import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, writeFile } from 'node:fs/promises';
const dir = new URL('../dist/', import.meta.url);
const names = (await readdir(dir)).filter(n => /\.(dmg|zip|exe|AppImage)$/.test(n)).sort();
if (!names.length) throw new Error('No installers found');
const lines = [];
for (const name of names) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(new URL(name, dir))) hash.update(chunk);
  lines.push(`${hash.digest('hex')}  ${name}`);
}
await writeFile(new URL(`SHA256SUMS-${process.platform}-${process.arch}.txt`, dir), lines.join('\n') + '\n');
console.log(`Checksummed ${names.length} installers`);
