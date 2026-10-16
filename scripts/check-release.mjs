import { readFile } from 'node:fs/promises';
const read = async path => JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'));
const pkg = await read('apps/revolution/package.json');
const lock = await read('apps/revolution/package-lock.json');
if (pkg.version !== lock.version || pkg.version !== lock.packages[''].version) throw new Error('Desktop manifest/lock version mismatch');
for (const [name, version] of Object.entries(pkg.dependencies)) {
  if (lock.packages[''].dependencies[name] !== version) throw new Error('Lock mismatch: ' + name);
}
const ref = process.env.GITHUB_REF_NAME || '';
if (process.env.GITHUB_REF_TYPE === 'tag' && ref !== `revolution-v${pkg.version}`) throw new Error(`Expected revolution-v${pkg.version}; received ${ref}`);
console.log(`PASS: locked desktop ${pkg.version}; DSH ${pkg.dependencies['@deepseek-ai/dsh']}`);
