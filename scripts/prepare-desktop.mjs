import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { cp, readFile, writeFile } from 'node:fs/promises';
const require = createRequire(new URL('../apps/revolution/package.json', import.meta.url));
const sharp = require('sharp');
await sharp(fileURLToPath(new URL('../assets/revolution.svg', import.meta.url))).resize(1024, 1024).png().toFile(fileURLToPath(new URL('../apps/revolution/icon.png', import.meta.url)));
const relayUrl = process.env.REVOLUTION_RELAY_URL || null;
if (relayUrl) {
  const url = new URL(relayUrl);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash) throw new Error('REVOLUTION_RELAY_URL must be an HTTPS origin');
}
await writeFile(new URL('../apps/revolution/relay-config.json', import.meta.url), JSON.stringify({ url: relayUrl }, null, 2) + '\n');
for (const name of ['workflow-studio', 'revolution-brand', 'revolution-knowledge']) {
  const packageName = name === 'workflow-studio' ? 'dsh-workflow-studio' : name;
  if (name === 'revolution-knowledge') {
    for (const dir of ['src', 'engine']) await cp(new URL(`../plugins/${name}/${dir}/`, import.meta.url), new URL(`../apps/revolution/node_modules/${packageName}/${dir}/`, import.meta.url), { recursive: true });
  }
  await cp(new URL(`../plugins/${name}/lib/`, import.meta.url), new URL(`../apps/revolution/node_modules/${packageName}/lib/`, import.meta.url), { recursive: true });
  await cp(new URL(`../plugins/${name}/cordis.patch.yml`, import.meta.url), new URL(`../apps/revolution/node_modules/${packageName}/cordis.patch.yml`, import.meta.url));
}
console.log('Prepared Revolution desktop icon');
// DSH 0.2.1-rc.2 has no headline-text slot. Apply a bounded downstream copy patch
// to the installed package, never to the upstream source checkout or user data.
const conversation = require.resolve('@deepseek-ai/dsh-client-ui-conversation/client');
let client = await readFile(conversation, 'utf8');
for (const [before, after] of [['探索未至之境', '编写自之史章'], ['Into the Unknown', 'Write Your Own Chapter']]) {
  if (client.includes(after)) continue;
  const count = client.split(before).length - 1;
  if (count !== 1) throw new Error(`DSH headline compatibility changed: expected one ${before}, got ${count}`);
  client = client.replace(before, after);
}
await writeFile(conversation, client);
console.log('Applied Revolution headline overlay');
