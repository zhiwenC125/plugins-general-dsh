import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutFor, orchestratorPosition } from '../src/layout.js';
import { childPreview } from '../src/child-preview.js';
import { buildExportManifest, exportFileName } from '../src/export-manifest.js';

test('canvas places phases in columns and parallel agents in rows', () => {
  const positions = layoutFor({
    phases: [
      { key: 'discover', members: [{ seq: 1 }, { seq: 2 }] },
      { key: 'build', members: [{ seq: 3 }] },
    ],
  });
  assert.deepEqual(positions.get(1), { x: 430, y: 116 });
  assert.deepEqual(positions.get(2), { x: 430, y: 312 });
  assert.deepEqual(positions.get(3), { x: 790, y: 116 });
  assert.deepEqual(orchestratorPosition({ phases: [{ members: [{}, {}] }] }), { x: 48, y: 214 });
});

test('child session facts expose input, output, runtime, and produced files', () => {
  const event = (type, data) => ({ type: 'event', event: { type, data } });
  assert.deepEqual(childPreview([
    event('user/message', { source: { kind: 'user' }, content: [{ type: 'text', text: 'Audit the renderer' }] }),
    event('user/message', { source: { kind: 'runtime-context' }, content: [{ type: 'text', text: 'Internal runtime context' }] }),
    event('request/header', { header: { config: { provider: 'deepseek', model: 'v4' } } }),
    event('tool/call', { callId: 'c1', name: 'write', arguments: JSON.stringify({ file_path: 'report.md', content: 'x' }) }),
    event('tool/result', { message: { source: { callId: 'read-only' } }, meta: { path: '/workspace/read-only.md' } }),
    event('tool/result', { message: { source: { callId: 'c1' } }, meta: { path: '/workspace/report.md' } }),
    event('assistant/message', { message: { content: [{ type: 'text', text: 'Audit complete' }] } }),
  ]), {
    input: 'Audit the renderer', output: 'Audit complete', files: ['/workspace/report.md'], provider: 'deepseek', model: 'v4',
  });
});

test('export manifest includes only confirmed agents and preserves fact boundaries', () => {
  const run = {
    runId: 'run/42', name: 'Audit', status: 'completed',
    phases: [{ key: 'discover', phase: 'discover' }],
    members: [
      { seq: 1, childId: 'child-a', label: 'A', phase: 'discover', status: 'completed' },
      { seq: 2, childId: 'child-b', label: 'B', phase: null, status: 'failed' },
    ],
  };
  const manifest = buildExportManifest(run, {
    'child-a': { input: 'in', output: 'out', provider: 'deepseek', model: 'reasoner', files: ['a.md', 'a.md'] },
    'child-b': { input: 'skip', files: ['b.md'] },
  }, { id: 'parent', title: 'Main' }, [1]);
  assert.equal(manifest.schema, 'revolution.workflow-export/v1');
  assert.deepEqual(manifest.agents.map(agent => agent.childSessionId), ['child-a']);
  assert.deepEqual(manifest.agents[0].candidateFiles, ['a.md']);
  assert.equal(manifest.semantics.agentDependenciesInferred, false);
  assert.equal(manifest.semantics.filesCopied, false);
  assert.equal(exportFileName(run.runId), 'workflow-run-42.json');
});
