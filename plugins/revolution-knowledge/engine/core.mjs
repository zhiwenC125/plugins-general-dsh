import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile, rename, realpath } from 'node:fs/promises';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
export const DEFAULT_STATE = join(homedir(), '.revolution', 'knowledge', 'state.json');
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function digest(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function safeSource(root, source) {
  if (typeof source !== 'string' || isAbsolute(source)) throw new Error(`Invalid knowledge source: ${source}`);
  const path = resolve(root, source);
  const rel = relative(root, path);
  if (!rel || rel.startsWith('..') || isAbsolute(rel) || !rel.endsWith('.md')) throw new Error(`Source escapes repository: ${source}`);
  return path;
}

export async function loadCatalog(root = REPO_ROOT) {
  const catalog = JSON.parse(await readFile(join(root, 'knowledge', 'catalog.json'), 'utf8'));
  if (catalog.schema !== 'revolution.knowledge/v1' || !Array.isArray(catalog.entries)) throw new Error('Unsupported knowledge catalog');
  const seen = new Set();
  const entries = [];
  for (const item of catalog.entries) {
    if (!ID.test(item.id) || seen.has(item.id)) throw new Error(`Invalid or duplicate knowledge ID: ${item.id}`);
    if (typeof item.title !== 'string' || !item.title.trim()) throw new Error(`Missing title: ${item.id}`);
    seen.add(item.id);
    const path = safeSource(root, item.source);
    const actual = await realpath(path);
    const actualRelative = relative(await realpath(root), actual);
    if (!actualRelative || actualRelative.startsWith('..') || isAbsolute(actualRelative)) throw new Error(`Source symlink escapes repository: ${item.source}`);
    const content = await readFile(path, 'utf8');
    if (!content.trim()) throw new Error(`Empty knowledge article: ${item.id}`);
    entries.push({ ...item, path, content, hash: digest(content) });
  }
  return entries;
}

export async function readState(path = DEFAULT_STATE) {
  try {
    const state = JSON.parse(await readFile(path, 'utf8'));
    if (state.schema !== 'revolution.knowledge.state/v1' || typeof state.items !== 'object' || !state.items) throw new Error('Invalid knowledge state');
    return state;
  } catch (error) {
    if (error.code === 'ENOENT') return { schema: 'revolution.knowledge.state/v1', items: {} };
    throw error;
  }
}

export async function saveState(state, path = DEFAULT_STATE) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(state, null, 2) + '\n', { mode: 0o600 });
  await rename(temporary, path);
}

export function obsidianPath(vault, entry) {
  if (!vault) throw new Error('Obsidian vault path is required');
  return join(resolve(vault), 'Revolution Knowledge', `${entry.id}.md`);
}

export async function syncObsidian(entries, vault, state, { dryRun = false } = {}) {
  const actions = [];
  // Inspect every destination before writing any of them.
  for (const entry of entries) {
    const path = obsidianPath(vault, entry);
    const previous = state.items[entry.id]?.obsidian;
    let current = null;
    try { current = await readFile(path, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (current === entry.content) { actions.push({ id: entry.id, action: 'current', path }); continue; }
    if (current !== null && (!previous || previous.hash !== digest(current))) throw new Error(`Obsidian conflict at ${path}. Preserve edits and reconcile before syncing.`);
    actions.push({ id: entry.id, action: current === null ? 'create' : 'update', path, content: entry.content, hash: entry.hash });
  }
  if (dryRun) return actions.map(({ content, ...action }) => action);
  for (const action of actions) {
    if (action.action === 'current') continue;
    await mkdir(dirname(action.path), { recursive: true });
    const temporary = `${action.path}.${process.pid}.tmp`;
    await writeFile(temporary, action.content);
    await rename(temporary, action.path);
    const item = state.items[action.id] ??= {};
    item.obsidian = { hash: action.hash, path: action.path };
  }
  // A matching vault can be adopted without rewriting its files.
  for (const action of actions.filter(a => a.action === 'current')) {
    const item = state.items[action.id] ??= {};
    item.obsidian = { hash: entries.find(e => e.id === action.id).hash, path: action.path };
  }
  return actions.map(({ content, ...action }) => action);
}

export async function pullObsidian(entries, vault, state, { dryRun = false } = {}) {
  const actions = [];
  for (const entry of entries) {
    const path = obsidianPath(vault, entry);
    const previous = state.items[entry.id]?.obsidian;
    if (!previous) { actions.push({ id: entry.id, action: 'unlinked' }); continue; }
    const remote = await readFile(path, 'utf8');
    const remoteHash = digest(remote);
    if (remoteHash === previous.hash) { actions.push({ id: entry.id, action: 'current' }); continue; }
    if (entry.hash !== previous.hash) throw new Error(`Knowledge conflict for ${entry.id}: GitHub source and Obsidian both changed`);
    actions.push({ id: entry.id, action: 'pull', content: remote, hash: remoteHash, path: entry.path });
  }
  if (dryRun) return actions.map(({ content, ...action }) => action);
  for (const action of actions.filter(a => a.action === 'pull')) {
    const temporary = `${action.path}.${process.pid}.tmp`;
    await writeFile(temporary, action.content);
    await rename(temporary, action.path);
    state.items[action.id].obsidian.hash = action.hash;
  }
  return actions.map(({ content, ...action }) => action);
}

export function searchEntries(entries, query) {
  const needle = String(query || '').trim().toLocaleLowerCase();
  if (!needle) throw new Error('Search query is required');
  return entries.flatMap(entry => {
    const lines = entry.content.split('\n');
    const matches = lines.map((line, index) => ({ line: index + 1, text: line.trim() }))
      .filter(hit => hit.text.toLocaleLowerCase().includes(needle)).slice(0, 3);
    return matches.length || entry.title.toLocaleLowerCase().includes(needle)
      ? [{ id: entry.id, title: entry.title, source: entry.source, matches }]
      : [];
  });
}
