#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog, readState, saveState, syncObsidian, pullObsidian, searchEntries, REPO_ROOT, DEFAULT_STATE } from './core.mjs';
import { FeishuClient, syncFeishu, pullFeishu } from './feishu.mjs';

function argumentsFor(argv) {
  const [command = 'help', ...rest] = argv;
  const options = {};
  const positional = [];
  for (let index = 0; index < rest.length; index++) {
    const value = rest[index];
    if (!value.startsWith('--')) { positional.push(value); continue; }
    const key = value.slice(2);
    if (key === 'dry-run') { options.dryRun = true; continue; }
    if (!['repo', 'state', 'vault', 'folder-token', 'space-id', 'parent-node-token', 'out'].includes(key)) throw new Error(`Unknown option: ${value}`);
    if (!rest[index + 1] || rest[index + 1].startsWith('--')) throw new Error(`Missing value for ${value}`);
    options[key] = rest[++index];
  }
  return { command, options, positional };
}

function help() {
  return `Revolution Knowledge: one article set across GitHub, Obsidian, Feishu Docs and Feishu Wiki.

  check | doctor | search <term> | status | export --out <new-directory>
  sync-obsidian --vault <vault> | pull-obsidian --vault <vault>
  sync-docs --folder-token <personal-folder-token> | pull-docs
  sync-wiki --space-id <personal-space-id> [--parent-node-token <token>] | pull-wiki
  sync-all --vault <vault> --folder-token <token> --space-id <id>

  FEISHU_USER_ACCESS_TOKEN is read from the environment; it is never saved.
  --dry-run checks for conflicts without writing. --state overrides the local state path.
  GitHub portability: commit knowledge/catalog.json and its source Markdown files.`;
}

function tokenProblem(token) {
  if (!token) return 'missing';
  if (/\s/.test(token) || /^Bearer\b/i.test(token)) return 'contains whitespace or Bearer prefix';
  const parts = token.split('.');
  if (parts.length === 3 && parts[0].startsWith('eyJ')) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      if (!Number.isFinite(payload.exp)) return 'JWT has no valid expiry';
      if (payload.exp * 1000 <= Date.now()) return 'expired';
    } catch {
      return 'malformed JWT';
    }
  }
  return null;
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const { command, options, positional } = argumentsFor(argv);
  if (command === 'help') return help();
  if (command === 'doctor') {
    const required = ['FEISHU_USER_ACCESS_TOKEN', 'FEISHU_DOC_FOLDER_TOKEN', 'FEISHU_WIKI_SPACE_ID'];
    const lines = required.map(key => {
      if (key !== 'FEISHU_USER_ACCESS_TOKEN') return `${key}: ${env[key] ? 'configured' : 'missing'}`;
      const problem = tokenProblem(env[key]);
      return `${key}: ${problem ? problem === 'missing' ? 'missing' : `invalid (${problem})` : 'configured'}`;
    });
    lines.push('The first dry-run checks the local plan only. Real Feishu permission checks require sync-docs and sync-wiki to create and read back test documents.');
    return lines.join('\n');
  }
  const root = options.repo ? resolve(options.repo) : REPO_ROOT;
  const entries = await loadCatalog(root);
  if (command === 'check') return `${entries.length} knowledge articles validated\n` + entries.map(e => `${e.id}  ${e.hash.slice(0, 12)}  ${e.source}`).join('\n');
  if (command === 'search') return JSON.stringify(searchEntries(entries, positional.join(' ')), null, 2);
  const statePath = options.state ? resolve(options.state) : DEFAULT_STATE;
  const state = await readState(statePath);
  if (command === 'status') return entries.map(entry => {
    const item = state.items[entry.id] ?? {};
    const status = key => item[key]?.hash === entry.hash ? 'recorded-current' : item[key] ? 'outdated' : 'unlinked';
    return `${entry.id}  obsidian=${status('obsidian')}  docs=${status('feishuDocs')}  wiki=${status('feishuWiki')}`;
  }).join('\n');
  if (command === 'export') {
    if (!options.out) throw new Error('--out is required');
    const out = resolve(options.out);
    if (!options.dryRun) {
      await mkdir(out);
      await mkdir(join(out, 'articles'));
      for (const entry of entries) await writeFile(join(out, 'articles', `${entry.id}.md`), entry.content);
      await writeFile(join(out, 'manifest.json'), JSON.stringify({ schema: 'revolution.knowledge.bundle/v1', entries: entries.map(({ id, title, source, hash }) => ({ id, title, source, hash, file: `articles/${id}.md` })) }, null, 2) + '\n');
    }
    return `Export ${entries.length} articles to ${out}${options.dryRun ? ' (dry run)' : ''}`;
  }

  const vault = options.vault ?? env.REVOLUTION_OBSIDIAN_VAULT;
  const persist = () => saveState(state, statePath);
  if (command === 'sync-obsidian' || command === 'pull-obsidian') {
    const result = command === 'sync-obsidian'
      ? await syncObsidian(entries, vault, state, options)
      : await pullObsidian(entries, vault, state, options);
    if (!options.dryRun) await persist();
    return JSON.stringify(result, null, 2);
  }

  const remoteCommand = ['sync-docs', 'pull-docs', 'sync-wiki', 'pull-wiki', 'sync-all'];
  if (!remoteCommand.includes(command)) throw new Error(`Unknown command: ${command}`);
  const folderToken = options['folder-token'] ?? env.FEISHU_DOC_FOLDER_TOKEN;
  const spaceId = options['space-id'] ?? env.FEISHU_WIKI_SPACE_ID;
  const parentNodeToken = options['parent-node-token'] ?? env.FEISHU_WIKI_PARENT_NODE_TOKEN;
  if (['sync-docs', 'sync-all'].includes(command) && !folderToken) throw new Error('Personal Feishu ordinary-document folder token is required');
  if (['sync-wiki', 'sync-all'].includes(command) && !spaceId) throw new Error('Personal Feishu Wiki space ID is required');
  if (command === 'sync-all' && !vault) throw new Error('Obsidian vault path is required');
  if (!env.FEISHU_USER_ACCESS_TOKEN && !options.dryRun) throw new Error('FEISHU_USER_ACCESS_TOKEN is required for Feishu read or write');
  const problem = tokenProblem(env.FEISHU_USER_ACCESS_TOKEN);
  if (env.FEISHU_USER_ACCESS_TOKEN && problem) throw new Error(`FEISHU_USER_ACCESS_TOKEN is invalid (${problem}); enter a fresh token in the current shell`);
  const client = env.FEISHU_USER_ACCESS_TOKEN ? new FeishuClient({ token: env.FEISHU_USER_ACCESS_TOKEN }) : null;
  const feishuOptions = { folderToken, spaceId, parentNodeToken, dryRun: options.dryRun, persist };
  if (command === 'pull-docs' || command === 'pull-wiki') {
    return JSON.stringify(await pullFeishu(entries, command.endsWith('docs') ? 'docs' : 'wiki', state, client, feishuOptions), null, 2);
  }
  if (command === 'sync-docs' || command === 'sync-wiki') {
    return JSON.stringify(await syncFeishu(entries, command.endsWith('docs') ? 'docs' : 'wiki', state, client, feishuOptions), null, 2);
  }
  // Preflight each peer before the first write, then publish the same article set.
  await syncObsidian(entries, vault, state, { dryRun: true });
  await syncFeishu(entries, 'docs', state, client, { ...feishuOptions, dryRun: true });
  await syncFeishu(entries, 'wiki', state, client, { ...feishuOptions, dryRun: true });
  if (options.dryRun) return 'All three destinations passed preflight';
  const results = {
    obsidian: await syncObsidian(entries, vault, state),
  };
  await persist();
  results.docs = await syncFeishu(entries, 'docs', state, client, feishuOptions);
  results.wiki = await syncFeishu(entries, 'wiki', state, client, feishuOptions);
  return JSON.stringify(results, null, 2);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().then(output => { process.stdout.write(output + '\n'); }, error => { process.stderr.write(`Knowledge: ${error.message}\n`); process.exitCode = 1; });
}
