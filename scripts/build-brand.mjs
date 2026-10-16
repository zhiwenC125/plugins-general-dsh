import { readFile, mkdir, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const svg = await readFile(new URL('assets/revolution.svg', root), 'utf8');
const fist = await readFile(new URL('assets/revolution-fist.svg', root), 'utf8');
const source = await readFile(new URL('plugins/revolution-brand/src/client.js', root), 'utf8');
await mkdir(new URL('plugins/revolution-brand/lib/', root), { recursive: true });
await writeFile(new URL('plugins/revolution-brand/lib/client.js', root), `window.__ModuleLoader__.load({id:'revolution-brand',factory:(require)=>{const React=require('react');const REV_ICON=${JSON.stringify('data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'))};const REV_HERO_SVG=${JSON.stringify(fist)};\n${source}\nreturn {apply,inject:['slots','theme']};}});\n`);
console.log('Built Revolution brand');
