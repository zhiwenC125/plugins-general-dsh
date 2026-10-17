import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
if (process.platform !== 'darwin') throw new Error('This smoke requires a macOS GUI session');
const app = resolve(process.argv[2] || 'dist/mac-arm64/Revolution.app');
const home = await mkdtemp(join(tmpdir(), 'rev-desktop-smoke-'));
const env = { ...process.env, REVOLUTION_HOME: join(home, 'profile'), REVOLUTION_SMOKE_TEST: '1' };
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(join(app, 'Contents/MacOS/Revolution'), [`--user-data-dir=${join(home, 'electron')}`], { env, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '';
try {
  await new Promise((done, fail) => {
    const timer = setTimeout(() => fail(new Error('Desktop load timed out: ' + logs.slice(-2500))), 100000);
    child.once('error', e => { clearTimeout(timer); fail(e); });
    child.once('exit', code => { clearTimeout(timer); fail(new Error(`Desktop exited ${code}: ${logs.slice(-2500)}`)); });
    const read = chunk => {
      logs = (logs + chunk).slice(-18000);
      if (logs.includes('Revolution desktop ready')) { clearTimeout(timer); done(); }
    };
    child.stdout.on('data', read); child.stderr.on('data', read);
  });
  console.log('PASS: signed Electron app starts backend and loads its window. Not a user interaction or Gatekeeper acceptance test.');
} finally {
  if (child.exitCode === null) { child.kill('SIGTERM'); await new Promise(done => child.once('exit', done)); }
  await rm(home, { recursive: true, force: true });
}
