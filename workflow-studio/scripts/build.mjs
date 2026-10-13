import { readFile, mkdir, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const files = ['graph.js', 'projection.js', 'locales.js', 'view.js', 'client.js'];
const sources = await Promise.all(files.map(f => readFile(new URL(`src/${f}`, root), 'utf8')));
// This package's browser sources use only named exports and local one-line imports.
const body = sources.map(s => s.replace(/^import .*;\n/gm, '').replace(/^export /gm, '')).join('\n');
const css = await readFile(new URL('src/style.css', root), 'utf8');
await mkdir(new URL('lib/', root), { recursive: true });
await writeFile(new URL('lib/client.js', root), `window.__ModuleLoader__.load({id:"dsh-workflow-studio",factory:(require)=>{\nconst React=require("react");\nconst ReactDOM=require("react-dom");\nconst STUDIO_CSS=${JSON.stringify(css)};\n${body}\nreturn {apply:applyClient,inject:clientInject};\n}});\n`);
console.log('Built lib/client.js (React supplied by DSH; no network dependencies)');
