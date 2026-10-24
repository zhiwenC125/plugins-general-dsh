import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
if (process.platform !== 'darwin') throw new Error('This smoke requires a macOS GUI session');
const app = resolve(process.argv[2] || 'dist/mac-arm64/Revolution.app');
async function verify(mode, relayUrl) {
  const home = await mkdtemp(join(tmpdir(), 'rev-desktop-smoke-'));
  const env = { ...process.env, REVOLUTION_HOME: join(home, 'profile'), REVOLUTION_SMOKE_TEST: '1' };
  if (relayUrl) env.REVOLUTION_RELAY_URL = relayUrl;
  else delete env.REVOLUTION_RELAY_URL;
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(join(app, 'Contents/MacOS/Revolution'), [`--user-data-dir=${join(home, 'electron')}`], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  try {
    await new Promise((done, fail) => {
      const timer = setTimeout(() => fail(new Error(`${mode} desktop load timed out: ${logs.slice(-2500)}`)), 100000);
      child.once('error', e => { clearTimeout(timer); fail(e); });
      child.once('exit', code => { clearTimeout(timer); fail(new Error(`${mode} desktop exited ${code}: ${logs.slice(-2500)}`)); });
      const read = chunk => {
        logs = (logs + chunk).slice(-18000);
        if (logs.includes('Revolution desktop ready')) { clearTimeout(timer); fail(new Error(`${mode} started backend before login`)); }
        if (logs.includes('Revolution login required')) { clearTimeout(timer); done(); }
      };
      child.stdout.on('data', read); child.stderr.on('data', read);
    });
    console.log(`PASS: ${mode} login window appears before the backend.`);
  } finally {
    if (child.exitCode === null) { child.kill('SIGTERM'); await new Promise(done => child.once('exit', done)); }
    await rm(home, { recursive: true, force: true });
  }
}
await verify('personal', null);
await verify('shared relay', 'http://127.0.0.1:9');
console.log('Desktop smoke does not replace a real Feishu login or Gatekeeper acceptance test.');
