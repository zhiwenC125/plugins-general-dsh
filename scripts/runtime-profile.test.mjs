import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ensureKnowledgeBundle } from '../apps/revolution/profile.mjs';
test('existing profiles gain knowledge once and retain user bundles/settings', async t => {
 const root = await mkdtemp(join(tmpdir(),'rev-profile-')); t.after(()=>rm(root,{recursive:true,force:true}));
 const file=join(root,'package.json');
 await writeFile(file,JSON.stringify({name:'personal',dsh:{profile:{bundles:['custom-plugin','revolution-brand']}},custom:{x:1}}));
 await ensureKnowledgeBundle(file); await ensureKnowledgeBundle(file);
 const value=JSON.parse(await readFile(file,'utf8'));
 assert.deepEqual(value.dsh.profile.bundles,['custom-plugin','revolution-brand','revolution-knowledge']); assert.equal(value.custom.x,1);
});
