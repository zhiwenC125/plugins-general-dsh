import test from 'node:test';
import assert from 'node:assert/strict';
import { samplePlan } from '../src/graph.js';
import { runGraph, startChild } from '../src/runner.js';

function setup(start) {
  const events = [], controller = new AbortController(), plan = samplePlan();
  const parent = { session: { append: (type, data) => events.push({ type, data }) } };
  return { events, controller, args: { plan, parent, signal: controller.signal, subagents: { start }, provider: 'spawn', maxParallel: 2, skillsByNode: { clarify: [], design: [], coding: [] } } };
}
test('passes outputs and exact allowlists, and disposes before run end', async () => {
  const calls = [], disposed = [];
  const s = setup(async (_provider, request) => {
    const id = `child-${calls.length}`; calls.push(request);
    return { id, result: Promise.resolve({ stopReason: 'completed', output: [{ type: 'text', text: `${id}-result` }] }), dispose: async () => { disposed.push(id); } };
  });
  const result = await runGraph(s.args);
  assert.equal(result.status, 'completed'); assert.equal(calls.length, 3); assert.equal(disposed.length, 3);
  assert.deepEqual(calls[0].toolFilter, { allow: [] }); assert.match(calls[1].prompt[0].text, /child-0-result/);
  assert.equal(s.events.at(-1).type, 'tool-workflow/run-end');
  assert.deepEqual(s.events.filter(e => e.type.endsWith('agent-end')).map(e => e.data.outcome), ['completed', 'completed', 'completed']);
});
test('a failed node stops downstream work and still disposes', async () => {
  let calls = 0, disposed = 0;
  const s = setup(async () => ({ id: `child-${++calls}`, result: Promise.resolve({ stopReason: 'error', output: [] }), dispose: async () => { disposed++; } }));
  const r = await runGraph(s.args);
  assert.equal(r.status, 'failed'); assert.equal(calls, 1); assert.equal(disposed, 1); assert.equal(s.events.at(-1).data.stopReason, 'error');
});
test('cancellation reaches active children and waits for cleanup', async () => {
  let cleaned = false;
  const s = setup(async (_p, request) => ({ id: 'child', result: new Promise(resolve => request.signal.addEventListener('abort', () => resolve({ stopReason: 'cancelled', output: [] }), { once: true })), dispose: async () => { await new Promise(r => setTimeout(r, 5)); cleaned = true; } }));
  const running = runGraph(s.args); await new Promise(r => setTimeout(r, 5)); s.controller.abort(); const result = await running;
  assert.equal(result.status, 'cancelled'); assert.equal(cleaned, true); assert.equal(s.events.at(-1).data.stopReason, 'cancelled');
});
test('parallel siblings settle before a failed wave stops the graph', async () => {
  let calls = 0, disposed = 0;
  const s = setup(async () => { const i = calls++; return { id: `child-${i}`, result: Promise.resolve({ stopReason: i === 0 ? 'error' : 'completed', output: [{ type: 'text', text: 'ok' }] }), dispose: async () => { disposed++; } }; });
  s.args.plan.edges = [{ from: 'clarify', to: 'coding' }, { from: 'design', to: 'coding' }];
  const result = await runGraph(s.args); assert.equal(result.status, 'failed'); assert.equal(calls, 2); assert.equal(disposed, 2);
});
test('recording failure stops execution and cleans up the published child', async () => {
  let disposed = false;
  const s = setup(async () => ({ id: 'child', result: Promise.resolve({ stopReason: 'completed', output: [] }), dispose: async () => { disposed = true; } }));
  s.args.parent.session.append = type => { if (type.endsWith('agent-start')) throw new Error('disk failed'); };
  await assert.rejects(runGraph(s.args), /recording failed/); assert.equal(disposed, true);
});
test('current activation adapter requests caller-owned delivery and normalizes child id', async () => {
  let spec;
  const child = await startChild({ startActivation: async s => { spec = s; return { childId: 'modern', result: Promise.resolve({}), dispose: async () => {} }; } }, 'spawn', { signal: new AbortController().signal, label: 'Task', parent: {}, prompt: [] });
  assert.equal(child.id, 'modern'); assert.equal(spec.delivery, 'caller'); assert.equal(spec.label, 'Task'); assert.equal('signal' in spec.request, false);
});
test('streams live agent progress events from child tool calls', async () => {
  const s = setup(async () => ({ id: 'child-0', result: Promise.resolve({ stopReason: 'completed', output: [{ type: 'text', text: 'ok' }] }), dispose: async () => {} }));
  s.args.trackChild = (_childId, _nodeId, onCall) => { onCall({ calls: 2, name: 'read_file', isError: false }); return () => {}; };
  const result = await runGraph(s.args);
  assert.equal(result.status, 'completed');
  assert.ok(s.events.some(e => e.type === 'tool-workflow/agent-progress' && e.data.phase === 'clarify' && e.data.calls === 2 && e.data.lastTool === 'read_file'));
});
