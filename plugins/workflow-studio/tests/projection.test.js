import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStudioBuilder, EMPTY_STUDIO_SNAPSHOT, studioDefinition, workflowPhases,
} from '../src/projection.js';

function startMatch(reason = 'completed') {
  return {
    event: { type: 'tool-workflow/run-start', seq: 10, data: { runId: 'run-1', name: 'Ship feature' } },
    location: { kind: 'turn', turn: { end: { data: { reason: { kind: reason } } } } },
  };
}

test('official workflow events become live phase and member data', () => {
  const start = startMatch();
  let state = studioDefinition.start({}, start);
  state = studioDefinition.update({ state }, {
    event: { type: 'tool-workflow/agent-start', data: { runId: 'run-1', seq: 1, label: 'Research', phase: 'Discover', childId: 'child-1' } },
  });
  state = studioDefinition.update({ state }, {
    event: { type: 'tool-workflow/agent-start', data: { runId: 'run-1', seq: 2, label: 'Implement', phase: 'Build', childId: 'child-2' } },
  });
  state = studioDefinition.update({ state }, {
    event: { type: 'tool-workflow/agent-end', data: { runId: 'run-1', seq: 1, outcome: 'completed' } },
  });
  const node = studioDefinition.buildViewNode({ state, start, key: 'context', id: 'run-1' });
  assert.equal(node.target, 'workflow-studio');
  assert.equal(node.data.status, 'running');
  assert.deepEqual(node.data.phases.map(phase => phase.phase), ['Discover', 'Build']);
  assert.deepEqual(node.data.members.map(member => member.status), ['completed', 'running']);
});

test('terminal and abandoned runs settle visible state', () => {
  const interruptedStart = startMatch('interrupted');
  let interrupted = studioDefinition.start({}, interruptedStart);
  interrupted = studioDefinition.update({ state: interrupted }, {
    event: { type: 'tool-workflow/agent-start', data: { runId: 'run-1', seq: 1, label: 'Agent', childId: 'child' } },
  });
  const interruptedNode = studioDefinition.buildViewNode({ state: interrupted, start: interruptedStart, key: 'a', id: 'run-1' });
  assert.equal(interruptedNode.data.status, 'interrupted');
  assert.equal(interruptedNode.data.members[0].status, 'interrupted');

  const completedStart = startMatch();
  let completed = studioDefinition.start({}, completedStart);
  completed = studioDefinition.update({ state: completed }, {
    event: { type: 'tool-workflow/run-end', data: { runId: 'run-1', stopReason: 'completed' } },
  });
  assert.equal(studioDefinition.buildViewNode({ state: completed, start: completedStart, key: 'b', id: 'run-1' }).data.status, 'completed');
});

test('phase grouping preserves missing and empty identities', () => {
  const groups = workflowPhases([
    { seq: 1 },
    { seq: 2, phase: '' },
    { seq: 3, phase: 'Build' },
    { seq: 4, phase: 'Build' },
  ]);
  assert.deepEqual(groups.map(group => [group.key, group.members.length]), [
    ['missing', 1],
    ['value:0:', 1],
    ['value:5:Build', 2],
  ]);
});

test('history replacement and live upserts converge', () => {
  assert.deepEqual(EMPTY_STUDIO_SNAPSHOT, { runs: [] });
  const a = { key: 'a', anchorSeq: 1, data: { runId: 'a' } };
  const b = { key: 'b', anchorSeq: 2, data: { runId: 'b', status: 'running' } };
  const updated = { ...b, data: { ...b.data, status: 'completed' } };
  const replay = createStudioBuilder();
  const live = createStudioBuilder();
  replay.replace({ nodes: [a, updated] });
  live.replace({ nodes: [b] });
  live.apply({ upserts: [a] });
  assert.deepEqual(live.apply({ upserts: [updated] }), replay.apply({ upserts: [] }));
});
