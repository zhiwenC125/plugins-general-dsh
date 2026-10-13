import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePlan, samplePlan, graphWaves, nodePrompt } from '../src/graph.js';

test('serial sample has explicit waves; independent nodes share a wave', () => {
  const p = validatePlan(samplePlan());
  assert.deepEqual(graphWaves(p).map(w => w.map(n => n.id)), [['clarify'], ['design'], ['coding']]);
  p.edges = [{ from: 'clarify', to: 'coding' }, { from: 'design', to: 'coding' }];
  assert.deepEqual(graphWaves(p).map(w => w.map(n => n.id)), [['clarify', 'design'], ['coding']]);
});
test('rejects cycles, duplicate identities, missing nodes, self loops and invalid versions', () => {
  for (const mutate of [
    p => p.edges.push({ from: 'coding', to: 'clarify' }),
    p => p.nodes.push(p.nodes[0]), p => p.edges.push({ from: 'missing', to: 'design' }),
    p => p.edges.push({ from: 'clarify', to: 'clarify' }), p => p.edges.push(p.edges[0]),
    p => p.version = 2, p => p.nodes[0].tools = '*', p => p.revision = 0,
  ]) { const p = samplePlan(); mutate(p); assert.throws(() => validatePlan(p)); }
});
test('skill bodies and only direct upstream results enter a logged child prompt', () => {
  const p = samplePlan();
  const prompt = nodePrompt(p, p.nodes[2], { clarify: 'PRIVATE_OTHER_STAGE', design: { text: 'design output' } }, [{ name: 'coding', content: 'EXACT_SKILL_BODY', resourceBase: { kind: 'directory', path: '/test' } }]);
  assert.match(prompt, /EXACT_SKILL_BODY/); assert.match(prompt, /design output/); assert.doesNotMatch(prompt, /PRIVATE_OTHER_STAGE/);
  assert.throws(() => nodePrompt(p, p.nodes[1], {}, []), /Missing upstream/);
});
test('validation detaches graph input and preserves intentional empty allowlists', () => {
  const original = samplePlan(), result = validatePlan(original);
  original.nodes[0].label = 'changed'; assert.notEqual(result.nodes[0].label, 'changed'); assert.deepEqual(result.nodes[0].tools, []);
});
