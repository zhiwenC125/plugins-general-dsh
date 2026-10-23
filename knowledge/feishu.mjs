import { digest } from './core.mjs';
import { writeFile, rename } from 'node:fs/promises';

const API = 'https://open.feishu.cn/open-apis';
const BATCH = 20;

export class FeishuClient {
  constructor({ token, fetchImpl = fetch, apiBase = API }) {
    if (!token) throw new Error('FEISHU_USER_ACCESS_TOKEN is required');
    this.token = token;
    this.fetch = fetchImpl;
    this.apiBase = apiBase;
  }

  async request(method, path, body) {
    const response = await this.fetch(`${this.apiBase}${path}`, {
      method,
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json; charset=utf-8' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || result.code !== 0) {
      throw new Error(`Feishu ${method} ${path} failed (${response.status}, code ${result?.code ?? 'unknown'}): ${result?.msg ?? 'invalid response'}`);
    }
    return result.data ?? {};
  }

  async createDocument(title, folderToken) {
    if (!folderToken) throw new Error('FEISHU_DOC_FOLDER_TOKEN is required for ordinary docs');
    const data = await this.request('POST', '/docx/v1/documents', { title, folder_token: folderToken });
    if (!data.document?.document_id) throw new Error('Feishu did not return a document ID');
    return { documentId: data.document.document_id, url: `https://www.feishu.cn/docx/${data.document.document_id}` };
  }

  async createWikiNode(title, spaceId, parentNodeToken) {
    if (!spaceId) throw new Error('FEISHU_WIKI_SPACE_ID is required for Wiki');
    const data = await this.request('POST', `/wiki/v2/spaces/${encodeURIComponent(spaceId)}/nodes`, {
      obj_type: 'docx', node_type: 'origin', title,
      ...(parentNodeToken ? { parent_node_token: parentNodeToken } : {}),
    });
    if (!data.node?.obj_token || !data.node?.node_token) throw new Error('Feishu did not return Wiki document and node tokens');
    return { documentId: data.node.obj_token, nodeToken: data.node.node_token, url: `https://www.feishu.cn/wiki/${data.node.node_token}` };
  }

  async children(documentId) {
    const base = `/docx/v1/documents/${encodeURIComponent(documentId)}/blocks/${encodeURIComponent(documentId)}/children`;
    const items = [];
    let pageToken;
    do {
      const suffix = pageToken ? `?page_size=100&page_token=${encodeURIComponent(pageToken)}` : '?page_size=100';
      const data = await this.request('GET', base + suffix);
      items.push(...(data.items ?? []));
      pageToken = data.has_more ? data.page_token : undefined;
      if (data.has_more && !pageToken) throw new Error('Feishu children pagination omitted page_token');
    } while (pageToken);
    return items;
  }

  async replaceChildren(documentId, oldCount, content) {
    const base = `/docx/v1/documents/${encodeURIComponent(documentId)}/blocks/${encodeURIComponent(documentId)}/children`;
    for (let end = oldCount; end > 0; end -= BATCH) {
      await this.request('DELETE', `${base}/batch_delete`, {
        start_index: Math.max(0, end - BATCH), end_index: end, document_revision_id: -1,
      });
    }
    const blocks = markdownBlocks(content);
    for (let index = 0; index < blocks.length; index += BATCH) {
      await this.request('POST', base, { index, children: blocks.slice(index, index + BATCH), document_revision_id: -1 });
    }
  }
}

export function markdownBlocks(content) {
  const lines = content.split('\n');
  for (const line of lines) if (line.length > 100000) throw new Error('Knowledge line exceeds Feishu text block limit');
  return lines.map(line => ({
    block_type: 2,
    text: { elements: line ? [{ text_run: { content: line } }] : [] },
  }));
}

export function readMarkdownBlocks(blocks) {
  return blocks.map(block => {
    if (block.block_type !== 2 || !block.text || !Array.isArray(block.text.elements)) {
      throw new Error('Feishu document contains edited or unsupported blocks; reconcile it before syncing');
    }
    return block.text.elements.map(element => {
      if (!element.text_run || typeof element.text_run.content !== 'string') {
        throw new Error('Feishu document contains rich content; reconcile it before syncing');
      }
      return element.text_run.content;
    }).join('');
  }).join('\n');
}

export async function syncFeishu(entries, mode, state, client, options = {}) {
  if (!['docs', 'wiki'].includes(mode)) throw new Error(`Unknown Feishu mode: ${mode}`);
  const key = mode === 'docs' ? 'feishuDocs' : 'feishuWiki';
  if (mode === 'docs' && !options.folderToken) throw new Error('FEISHU_DOC_FOLDER_TOKEN is required');
  if (mode === 'wiki' && !options.spaceId) throw new Error('FEISHU_WIKI_SPACE_ID is required');
  const plans = [];
  // Read all existing remote documents before writing any content.
  for (const entry of entries) {
    const previous = state.items[entry.id]?.[key];
    if (previous && !client) throw new Error('FEISHU_USER_ACCESS_TOKEN is required to check existing Feishu documents');
    const blocks = previous ? await client.children(previous.documentId) : [];
    if (previous) {
      const remote = readMarkdownBlocks(blocks);
      const expected = previous.hash ? digest(remote) === previous.hash : entry.content.startsWith(remote);
      if (!expected) throw new Error(`Feishu ${mode} conflict for ${entry.id}; remote content changed since last sync`);
    }
    plans.push({ entry, previous, oldCount: blocks.length, action: !previous ? 'create' : previous.hash === entry.hash ? 'current' : 'update' });
  }
  if (options.dryRun) return plans.map(({ entry, action }) => ({ id: entry.id, action }));
  const actions = [];
  for (const plan of plans) {
    const { entry, action } = plan;
    if (action === 'current') { actions.push({ id: entry.id, action }); continue; }
    const item = state.items[entry.id] ??= {};
    if (!plan.previous) {
      item[key] = mode === 'docs'
        ? await client.createDocument(`[${entry.id}] ${entry.title}`, options.folderToken)
        : await client.createWikiNode(`[${entry.id}] ${entry.title}`, options.spaceId, options.parentNodeToken);
      // Persist the ID immediately so a failed content write can resume without duplicate pages.
      await options.persist?.();
    }
    const remote = item[key];
    await client.replaceChildren(remote.documentId, plan.oldCount, entry.content);
    const written = readMarkdownBlocks(await client.children(remote.documentId));
    if (written !== entry.content) throw new Error(`Feishu ${mode} read-back differed for ${entry.id}; inspect the remote document`);
    remote.hash = entry.hash;
    await options.persist?.();
    actions.push({ id: entry.id, action, url: remote.url });
  }
  return actions;
}

export async function pullFeishu(entries, mode, state, client, options = {}) {
  if (!['docs', 'wiki'].includes(mode)) throw new Error(`Unknown Feishu mode: ${mode}`);
  const key = mode === 'docs' ? 'feishuDocs' : 'feishuWiki';
  const actions = [];
  for (const entry of entries) {
    const previous = state.items[entry.id]?.[key];
    if (!previous?.hash) { actions.push({ id: entry.id, action: 'unlinked' }); continue; }
    if (!client) throw new Error('FEISHU_USER_ACCESS_TOKEN is required to read existing Feishu documents');
    const remote = readMarkdownBlocks(await client.children(previous.documentId));
    const remoteHash = digest(remote);
    if (remoteHash === previous.hash) { actions.push({ id: entry.id, action: 'current' }); continue; }
    if (entry.hash !== previous.hash) throw new Error(`Knowledge conflict for ${entry.id}: GitHub source and Feishu ${mode} both changed`);
    actions.push({ id: entry.id, action: 'pull', content: remote, hash: remoteHash, path: entry.path });
  }
  if (options.dryRun) return actions.map(({ content, ...action }) => action);
  for (const action of actions.filter(a => a.action === 'pull')) {
    const temporary = `${action.path}.${process.pid}.tmp`;
    await writeFile(temporary, action.content);
    await rename(temporary, action.path);
    state.items[action.id][key].hash = action.hash;
    await options.persist?.();
  }
  return actions.map(({ content, ...action }) => action);
}
