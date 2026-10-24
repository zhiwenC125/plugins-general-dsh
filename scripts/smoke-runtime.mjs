import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const home = await mkdtemp(join(tmpdir(), 'revolution-smoke-'));
const entry = resolve(process.argv[2] || 'apps/revolution/runtime.mjs');
const child = spawn(process.execPath, [entry], { env: { ...process.env, REVOLUTION_HOME: home }, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '';
try {
  const url = await new Promise((resolveReady, reject) => {
    const timer = setTimeout(() => { reject(new Error('Runtime smoke test timed out')); }, 95000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Runtime exited ${code}: ${logs.slice(-3000)}`)); });
    const read = data => {
      logs = (logs + data.toString()).slice(-20000);
      const ready = logs.match(/Revolution ready: (http:\/\/127\.0\.0\.1:\d+[^\s]*)/);
      if (ready) { clearTimeout(timer); resolveReady(ready[1]); }
    };
    child.stdout.on('data', read); child.stderr.on('data', read);
  });
  const first = await fetch(url, { redirect: 'manual' });
  const cookies = first.headers.getSetCookie().map(cookie => cookie.split(';')[0]).join('; ');
  const response = first.status >= 300 && first.status < 400
    ? await fetch(new URL(first.headers.get('location'), url), { headers: { Cookie: cookies } })
    : first;
  if (!response.ok) throw new Error(`Runtime HTTP ${response.status}`);
  const html = await response.text();
  for (const name of ['revolution-brand', 'dsh-workflow-studio', 'revolution-knowledge']) {
    if (!html.includes(name)) throw new Error(`Missing browser plugin: ${name}`);
  }
  console.log('PASS: independent DSH runtime, HTTP response, brand, workflow and knowledge client roster');
} finally {
  child.kill('SIGTERM');
  if (child.exitCode === null) await new Promise(done => child.once('exit', done));
  await rm(home, { recursive: true, force: true });
}
