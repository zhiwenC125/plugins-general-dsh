import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

if (process.platform !== 'darwin') throw new Error('The Revolution preview build requires macOS.');
const root = resolve(import.meta.dirname, '..');
const desktop = join(root, 'apps', 'revolution');
// /var is a symlink to /private/var on macOS; DSH's direct-entry check needs
// the canonical spelling used by import.meta.url.
const staging = join('/private/tmp', `revolution-preview-${process.pid}`);
const applications = join(homedir(), 'Applications');
const backup = join(homedir(), 'Library', 'Application Support', 'Revolution Preview Builds');
const current = join(applications, 'Revolution Preview.app');
const next = join(applications, 'Revolution Preview.next.app');
const previous = join(backup, 'previous.app');
const built = join(staging, 'mac-arm64', 'Revolution.app');
const run = (file, args, cwd = root) => execFileSync(file, args, { cwd, stdio: 'inherit' });

try {
  const processes = execFileSync('ps', ['ax', '-o', 'command='], { encoding: 'utf8' });
  if (processes.includes(`${current}/Contents/MacOS/Revolution`)) {
    throw new Error('请先退出正在运行的 Revolution Preview，再更新固定测试版。');
  }
  run('npm', ['run', 'build:knowledge']);
  run('node', ['scripts/prepare-desktop.mjs']);
  run(join(desktop, 'node_modules/.bin/electron-builder'), ['--dir', '--publish', 'never', `--config.directories.output=${staging}`], desktop);
  run('node', ['scripts/smoke-runtime.mjs', join(built, 'Contents/Resources/app/runtime.mjs')]);
  run('node', ['scripts/smoke-desktop-mac.mjs', built]);
  run('node', ['scripts/verify-mac.mjs', built]);
  await mkdir(applications, { recursive: true });
  await mkdir(backup, { recursive: true });
  await rm(next, { recursive: true, force: true });
  run('ditto', [built, next]);
  run('codesign', ['--verify', '--deep', '--strict', next]);
  await rm(previous, { recursive: true, force: true });
  if (existsSync(current)) await rename(current, previous);
  await rename(next, current);
  console.log(`Revolution Preview ready: ${current}`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
