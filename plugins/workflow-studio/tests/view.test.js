import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutFor, orchestratorPosition } from '../src/layout.js';
import { childPreview } from '../src/child-preview.js';

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
