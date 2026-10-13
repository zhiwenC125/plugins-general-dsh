import test from 'node:test';
import assert from 'node:assert/strict';
import { samplePlan, PLAN_KIND } from '../src/graph.js';
import { studioResult, studioDefinition, createStudioBuilder } from '../src/projection.js';

test('native metadata and nested plan results reconstruct the same graph', () => {
  const value = { kind: PLAN_KIND, plan: samplePlan() };
  const native = studioResult({ type: 'tool/result', data: { meta: value, message: { content: [] } } });
  const nested = studioResult({ type: 'tool/ptc-dispatch', data: { content: [{ type: 'text', text: JSON.stringify(value) }] } });
  assert.deepEqual(native, nested);
  assert.equal(studioResult({ type: 'tool/result', data: { meta: value, message: { isError: true } } }), null);
  assert.equal(studioResult({ type: 'tool/result', data: { meta: { ...value, plan: {} }, message: { content: [] } } }), null);
});
test('run fold is replayable and ordinary turn end does not imply workflow completion', () => {
  const start = { event: { type: 'tool-workflow/run-start', seq: 1, data: { runId: 'run', name: 'studio:delivery:1' } }, location: { kind: 'turn', turn: { end: { data: { reason: { kind: 'completed' } } } } } };
  let state = studioDefinition.start({}, start);
  state = studioDefinition.update({ state }, { event: { type: 'tool-workflow/agent-start', data: { seq: 1, phase: 'clarify', childId: 'child' } } });
  let view = studioDefinition.buildViewNode({ state, start, key: 'run', id: 'run' }); assert.equal(view.data.status, 'running');
  start.location.turn.end.data.reason.kind = 'interrupted';
  view = studioDefinition.buildViewNode({ state, start, key: 'run', id: 'run' }); assert.equal(view.data.status, 'interrupted'); assert.equal(view.data.members[0].status, 'interrupted');
});
test('history replacement and incremental upserts converge', () => {
  const a = { key: 'a', anchorSeq: 1 }, b = { key: 'b', anchorSeq: 5 }, updated = { ...b, data: 'done' };
  const one = createStudioBuilder(), two = createStudioBuilder();
  one.replace({ nodes: [a, updated] }); two.replace({ nodes: [b] }); two.apply({ upserts: [a] });
  assert.deepEqual(one.apply({ upserts: [] }), two.apply({ upserts: [updated] }));
});
test('agent progress folds live tool-call counters onto the running member', () => {
  const start = { event: { type: 'tool-workflow/run-start', seq: 1, data: { runId: 'run', name: 'studio:delivery:1' } }, location: { kind: 'turn', turn: { end: { data: { reason: { kind: 'completed' } } } } } };
  let state = studioDefinition.start({}, start);
  state = studioDefinition.update({ state }, { event: { type: 'tool-workflow/agent-start', data: { seq: 1, phase: 'clarify', childId: 'child' } } });
  state = studioDefinition.update({ state }, { event: { type: 'tool-workflow/agent-progress', data: { seq: 1, calls: 3, lastTool: 'read_file' } } });
  assert.equal(state.members[0].calls, 3); assert.equal(state.members[0].lastTool, 'read_file'); assert.equal(state.members[0].status, 'running');
});
