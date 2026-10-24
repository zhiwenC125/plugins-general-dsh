import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
await mkdir(new URL('engine/', root), { recursive: true });
for (const file of ['core.mjs', 'feishu.mjs']) await cp(new URL(`../../knowledge/${file}`, root), new URL(`engine/${file}`, root));
await mkdir(new URL('lib/', root), { recursive: true });
const source = await readFile(new URL('src/client.js', root), 'utf8');
await writeFile(new URL('lib/client.js', root), `window.__ModuleLoader__.load({id:'revolution-knowledge',factory:(require)=>{const React=require('react');\n${source}\nreturn {apply,inject:['slots','layout']};}});\n`);
console.log('Built Revolution knowledge plugin');
