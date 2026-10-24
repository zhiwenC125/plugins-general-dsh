import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const all = { plugins: true, knowledge: true, bot: true, desktop: true };

export function classifyChangedFiles(files) {
  if (!files.length) return { ...all };
  const result = { plugins: false, knowledge: false, bot: false, desktop: false };
  for (const file of files) {
    if (file.startsWith('plugins/revolution-knowledge/')) { result.plugins = true; result.knowledge = true; result.desktop = true; }
    else if (/^plugins\/(workflow-studio|revolution-brand)\//.test(file)) result.plugins = true;
    else if (file.startsWith('knowledge/') || file.startsWith('docs/knowledge/')) result.knowledge = true;
    else if (file.startsWith('integrations/bot/')) result.bot = true;
    else if (file === 'README.md' || file.startsWith('docs/')) continue;
    else return { ...all }; // New or unclassified code gets the complete checks.
  }
  return result;
}

export function changedFiles(base, head) {
  if (!/^[0-9a-f]{40}$/.test(base ?? '') || !/^[0-9a-f]{40}$/.test(head ?? '') || /^0+$/.test(base)) {
    return null;
  }
  try {
    return execFileSync('git', ['diff', '--name-only', '--no-renames', base, head], { encoding: 'utf8' })
      .split('\n').filter(Boolean);
  } catch {
    return null;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const files = changedFiles(process.env.CI_BASE_SHA, process.env.CI_HEAD_SHA);
  const impact = files === null ? { ...all } : classifyChangedFiles(files);
  const output = Object.entries(impact).map(([key, value]) => `${key}=${value}`).join('\n') + '\n';
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, output);
  process.stdout.write(`Changed files: ${files === null ? 'unknown; running all checks' : files.join(', ') || '(none)'}\n${output}`);
}
