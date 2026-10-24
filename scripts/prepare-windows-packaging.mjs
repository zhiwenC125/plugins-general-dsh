import { readFile, writeFile } from 'node:fs/promises';

if (process.platform === 'win32') {
  const file = new URL('../apps/revolution/node_modules/app-builder-lib/out/util/appFileCopier.js', import.meta.url);
  const original = 'const pmApproaches = [await packager.getPackageManager(), node_module_collector_1.PM.TRAVERSAL];';
  const replacement = 'const pmApproaches = [node_module_collector_1.PM.TRAVERSAL];';
  const source = await readFile(file, 'utf8');
  if (source.split(original).length !== 2) {
    throw new Error('Pinned electron-builder collector layout changed; inspect Windows packaging before continuing');
  }
  await writeFile(file, source.replace(original, replacement));
  console.log('Windows packaging: using electron-builder filesystem dependency collector');
}
