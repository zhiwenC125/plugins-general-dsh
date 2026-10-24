import { ensureKnowledgeBundle } from './profile.mjs';
import { createRequire } from 'node:module';
import { mkdir, access, writeFile, symlink, lstat, readlink, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);

export async function startRuntime({ port = 0, home = process.env.REVOLUTION_HOME || join(homedir(), '.revolution') } = {}) {
  const profile = join(home, 'profiles', 'revolution');
  await mkdir(profile, { recursive: true });
  const manifestPath = join(profile, 'package.json');
  try { await access(manifestPath); } catch {
    await writeFile(manifestPath, JSON.stringify({ name: 'revolution-profile', private: true, dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', 'dsh-workflow-studio', 'revolution-brand', 'revolution-knowledge'] } } }, null, 2), { flag: 'wx' });
  }
  // Upgrade existing profiles while preserving user-installed bundles.
  await ensureKnowledgeBundle(manifestPath);
  // DSH's Loader resolves third-party entries relative to the profile.
  // Link our bundled packages; preserve user-installed plugins.
  await mkdir(join(profile, 'node_modules'), { recursive: true });
  for (const name of ['dsh-workflow-studio', 'revolution-brand', 'revolution-knowledge']) {
    const target = dirname(require.resolve(`${name}/package.json`));
    const link = join(profile, 'node_modules', name);
    let current;
    try { current = await lstat(link); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (current?.isSymbolicLink()) {
      if (await readlink(link) === target) continue;
      await unlink(link);
    } else if (current) {
      throw new Error(`Bundled plugin path is occupied: ${link}. Move it aside before starting Revolution.`);
    }
    await symlink(target, link, process.platform === 'win32' ? 'junction' : 'dir');
  }
  const cliPackage = require.resolve('@deepseek-ai/dsh/package.json');
  const nodePackage = require.resolve('node/package.json');
  const executable = join(dirname(nodePackage), 'bin', process.platform === 'win32' ? 'node.exe' : 'node');
  const cli = join(dirname(cliPackage), 'lib', 'bin.js');
  const backend = spawn(executable, [cli, '--profile', 'revolution', '--host', '127.0.0.1', '--port', String(port), '--no-open'], {
    cwd: home, env: { ...process.env, DSH_HOME: home }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  const ready = new Promise((resolveReady, reject) => {
    const timer = setTimeout(() => { backend.kill(); reject(new Error('Revolution backend startup timed out.\n' + logs.slice(-6000))); }, 90000);
    backend.once('error', error => { clearTimeout(timer); reject(error); });
    backend.once('exit', code => { clearTimeout(timer); reject(new Error(`DSH exited (${code}).\n${logs.slice(-6000)}`)); });
    const collect = chunk => {
      const line = chunk.toString(); logs = (logs + line).slice(-20000); process.stdout.write(line);
      const match = logs.replace(/\x1b\[[0-9;]*m/g, '').match(/dsh web: (http:\/\/127\.0\.0\.1:\d+[^\s\x1b]*)/);
      if (match) {
        clearTimeout(timer);
        if (/entries did not activate/.test(logs)) { backend.kill(); reject(new Error('A Revolution plugin did not activate.\n' + logs.slice(-6000))); }
        else resolveReady(match[1]);
      }
    };
    backend.stdout.on('data', collect); backend.stderr.on('data', collect);
  });
  return { backend, ready, home };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const runtime = await startRuntime();
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => runtime.backend.kill(signal));
  try { console.log('Revolution ready:', await runtime.ready); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
