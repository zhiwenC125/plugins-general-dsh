import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadCatalog, readState, syncObsidian, pullObsidian, searchEntries } from './core.mjs';
import { FeishuClient, syncFeishu, pullFeishu, markdownBlocks, readMarkdownBlocks } from './feishu.mjs';
import { main as knowledgeCli } from './cli.mjs';

test('doctor reports configuration without exposing the user token', async () => {
  const output = await knowledgeCli(['doctor'], {
    FEISHU_USER_ACCESS_TOKEN: 'secret-token',
    FEISHU_DOC_FOLDER_TOKEN: 'folder-id',
  });
  assert.match(output, /FEISHU_USER_ACCESS_TOKEN: configured/);
  assert.match(output, /FEISHU_WIKI_SPACE_ID: missing/);
  assert.doesNotMatch(output, /secret-token|folder-id/);
});

test('first Feishu dry-runs need destination IDs but no user token', async t => {
  const { root } = await fixture(t);
  const common = ['--repo', root, '--state', join(root, 'state.json'), '--dry-run'];
  const docs = JSON.parse(await knowledgeCli(['sync-docs', '--folder-token', 'personal-folder', ...common], {}));
  const wiki = JSON.parse(await knowledgeCli(['sync-wiki', '--space-id', 'personal-space', ...common], {}));
  assert.deepEqual(docs.map(item => item.action), ['create', 'create']);
  assert.deepEqual(wiki.map(item => item.action), ['create', 'create']);
  await assert.rejects(knowledgeCli(['sync-docs', '--folder-token', 'personal-folder', ...common.filter(value => value !== '--dry-run')], {}), /FEISHU_USER_ACCESS_TOKEN/);
});

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'revolution-kb-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'knowledge'));
  await mkdir(join(root, 'docs'));
  await writeFile(join(root, 'knowledge/catalog.json'), JSON.stringify({ schema: 'revolution.knowledge/v1', entries: [
    { id: 'first-note', title: 'First', source: 'docs/first.md' },
    { id: 'second-note', title: 'Second', source: 'docs/second.md' },
  ] }));
  await writeFile(join(root, 'docs/first.md'), '# First\n\nKnowledge\n');
  await writeFile(join(root, 'docs/second.md'), '# Second\nLine\n');
  return { root, entries: await loadCatalog(root), state: await readState(join(root, 'state.json')) };
}

function fakeFeishu() {
  const docs = new Map();
  const calls = [];
  let next = 1;
  const fetchImpl = async (url, init) => {
    const path = new URL(url).pathname.replace('/open-apis', '');
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method: init.method, path, body });
    assert.equal(init.headers.Authorization, 'Bearer test-user-token');
    let data = {};
    if (init.method === 'POST' && path === '/docx/v1/documents') {
      const id = `doc-${next++}`; docs.set(id, []); data = { document: { document_id: id } };
    } else if (init.method === 'POST' && path.includes('/wiki/v2/spaces/') && path.endsWith('/nodes')) {
      const id = `doc-${next++}`; docs.set(id, []); data = { node: { obj_token: id, node_token: `wiki-${id}` } };
    } else {
      const match = path.match(/\/docx\/v1\/documents\/([^/]+)\/blocks\/[^/]+\/children/);
      assert.ok(match, path);
      const blocks = docs.get(match[1]);
      assert.ok(blocks, match[1]);
      if (init.method === 'GET') data = { items: blocks, has_more: false };
      else if (init.method === 'DELETE') blocks.splice(body.start_index, body.end_index - body.start_index);
      else if (init.method === 'POST') blocks.splice(body.index, 0, ...body.children);
      else assert.fail(`Unexpected method ${init.method}`);
    }
    return { ok: true, status: 200, json: async () => ({ code: 0, data }) };
  };
  return { client: new FeishuClient({ token: 'test-user-token', fetchImpl }), docs, calls };
}

test('same GitHub articles mirror into Obsidian without overwriting local edits', async t => {
  const { root, entries, state } = await fixture(t);
  const vault = join(root, 'vault');
  const first = await syncObsidian(entries, vault, state);
  assert.deepEqual(first.map(action => action.action), ['create', 'create']);
  assert.equal(await readFile(join(vault, 'Revolution Knowledge/first-note.md'), 'utf8'), entries[0].content);
  await writeFile(join(vault, 'Revolution Knowledge/first-note.md'), '# First\n\nChanged in Obsidian\n');
  await assert.rejects(syncObsidian(entries, vault, state), /Obsidian conflict/);
  const pulled = await pullObsidian(entries, vault, state);
  assert.equal(pulled[0].action, 'pull');
  assert.match(await readFile(join(root, 'docs/first.md'), 'utf8'), /Changed in Obsidian/);
});

test('Docs and Wiki each receive the same complete article set and detect remote edits', async t => {
  const { entries, state } = await fixture(t);
  const { client, docs } = fakeFeishu();
  await syncFeishu(entries, 'docs', state, client, { folderToken: 'personal-folder' });
  await syncFeishu(entries, 'wiki', state, client, { spaceId: 'personal-space' });
  for (const entry of entries) {
    assert.equal(readMarkdownBlocks(docs.get(state.items[entry.id].feishuDocs.documentId)), entry.content);
    assert.equal(readMarkdownBlocks(docs.get(state.items[entry.id].feishuWiki.documentId)), entry.content);
    assert.notEqual(state.items[entry.id].feishuDocs.documentId, state.items[entry.id].feishuWiki.documentId);
  }
  const docBlocks = docs.get(state.items['first-note'].feishuDocs.documentId);
  docBlocks[0].text.elements[0].text_run.content = '# Edited remotely';
  await assert.rejects(syncFeishu(entries, 'docs', state, client, { folderToken: 'personal-folder' }), /conflict/);
  const pulled = await pullFeishu(entries, 'docs', state, client);
  assert.equal(pulled[0].action, 'pull');
});

test('changed source updates an untouched Feishu document in place', async t => {
  const { root, entries, state } = await fixture(t);
  const { client, docs, calls } = fakeFeishu();
  await syncFeishu(entries, 'docs', state, client, { folderToken: 'personal-folder' });
  await writeFile(join(root, 'docs/first.md'), '# First\n\nNew version\n');
  const changed = await loadCatalog(root);
  const actions = await syncFeishu(changed, 'docs', state, client, { folderToken: 'personal-folder' });
  assert.equal(actions[0].action, 'update');
  assert.equal(actions[1].action, 'current');
  assert.equal(readMarkdownBlocks(docs.get(state.items['first-note'].feishuDocs.documentId)), changed[0].content);
  assert.ok(calls.some(call => call.method === 'DELETE'));
});

test('multi-batch Feishu blocks retain exact Markdown order', async t => {
  const { root, state } = await fixture(t);
  const content = Array.from({ length: 48 }, (_, index) => `Line ${index}`).join('\n') + '\n';
  await writeFile(join(root, 'docs/first.md'), content);
  const entries = await loadCatalog(root);
  const { client, docs } = fakeFeishu();
  await syncFeishu(entries, 'wiki', state, client, { spaceId: 'personal-space' });
  assert.equal(readMarkdownBlocks(docs.get(state.items['first-note'].feishuWiki.documentId)), content);
});

test('catalog rejects traversal and search cites source lines', async t => {
  const { root, entries } = await fixture(t);
  const result = searchEntries(entries, 'knowledge');
  assert.deepEqual(result.map(item => item.id), ['first-note']);
  assert.equal(result[0].matches[0].line, 3);
  await writeFile(join(root, 'knowledge/catalog.json'), JSON.stringify({ schema: 'revolution.knowledge/v1', entries: [
    { id: 'escape', title: 'Escape', source: '../outside.md' },
  ] }));
  await assert.rejects(loadCatalog(root), /escapes repository/);
  assert.equal(readMarkdownBlocks(markdownBlocks('# Title\n\nBody\n')), '# Title\n\nBody\n');
});
