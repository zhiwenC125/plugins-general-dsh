import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
export async function ensureKnowledgeBundle(manifestPath) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const bundles = manifest.dsh?.profile?.bundles;
  if (!Array.isArray(bundles)) throw new Error('Invalid Revolution profile bundle configuration');
  if (bundles.includes('revolution-knowledge')) return;
  bundles.push('revolution-knowledge');
  const temporary = `${manifestPath}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(manifest, null, 2) + '\n');
  await rename(temporary, manifestPath);
}
