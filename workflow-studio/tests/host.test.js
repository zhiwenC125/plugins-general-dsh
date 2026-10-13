import test from 'node:test';
import assert from 'node:assert/strict';
import { apply, parseGithubUrl } from '../src/host.js';
import { samplePlan } from '../src/graph.js';

function host() {
  const tools = new Map();
  const ctx = { systemPrompt: { section: () => {}, getSectionOrder: () => 100 }, tools: { register: t => tools.set(t.name, t), schemas: () => [{ name: 'read_file' }] }, subagents: { list: () => ['spawn'] }, skills: { list: async () => [{ name: 'clarify', invocation: { modelInvocable: true } }], get: async () => ({ name: 'clarify', content: 'body' }) }, workingDirectory: { ensure: async () => '/workspace' }, effect: () => {}, on: () => {} };
  ctx.get = name => ctx[name];
  apply(ctx); return tools;
}
test('plan publication rejects invented tool and skill names before any execution', async () => {
  const tools = host(), exec = { agent: {}, signal: new AbortController().signal };
  const plan = samplePlan(); plan.nodes[0].tools = ['invented'];
  await assert.rejects(tools.get('workflow_studio_plan').execute({ plan: JSON.stringify(plan) }, exec), /unavailable.*tool/);
  plan.nodes[0].tools = ['read_file']; plan.nodes[0].skills = ['invented'];
  await assert.rejects(tools.get('workflow_studio_plan').execute({ plan: JSON.stringify(plan) }, exec), /unavailable skill/);
});
test('published graph has durable presentation metadata without executing agents', async () => {
  const tools = host(), tool = tools.get('workflow_studio_plan');
  const value = await tool.execute({ plan: JSON.stringify(samplePlan()) }, { agent: {}, signal: new AbortController().signal });
  assert.equal(tool.output.presentationMeta({}, value).kind, 'workflow-studio-plan');
});
test('nested execution is rejected explicitly instead of silently losing run records', async () => {
  const tools = host();
  await assert.rejects(tools.get('workflow_studio_run').execute({ plan: JSON.stringify(samplePlan()) }, { agent: {}, signal: new AbortController().signal, parent: Symbol() }), /Native/);
});
test('ingest normalizes natural language into a platform project brief', async () => {
  const tools = host();
  const value = await tools.get('workflow_studio_ingest').execute({ source: 'text', content: '做一个研发平台的统一登录与权限中心' }, {});
  const parsed = JSON.parse(value);
  assert.equal(parsed.source, 'text');
  assert.match(parsed.brief, /统一登录/); assert.match(parsed.brief, /平台\/产品目标/); assert.match(parsed.brief, /验收标准/);
});
test('github ingest parses issue and pull URLs and rejects malformed references', () => {
  assert.equal(parseGithubUrl('not-a-url'), null);
  assert.deepEqual(parseGithubUrl('https://github.com/acme/tool/pull/42'), { owner: 'acme', repo: 'tool', kind: 'pull', number: '42' });
  assert.deepEqual(parseGithubUrl('https://github.com/acme/tool.git/issues/7'), { owner: 'acme', repo: 'tool', kind: 'issues', number: '7' });
});
test('edit patches one node and bumps the plan revision', async () => {
  const tools = host();
  const plan = samplePlan();
  const value = await tools.get('workflow_studio_edit').execute({ plan: JSON.stringify(plan), nodeId: 'coding', task: '补充：额外增加单元测试' }, {});
  const parsed = JSON.parse(value);
  assert.equal(parsed.kind, 'workflow-studio-plan');
  assert.equal(parsed.plan.revision, 2);
  assert.equal(parsed.plan.nodes.find(n => n.id === 'coding').task, '补充：额外增加单元测试');
  assert.equal(parsed.plan.nodes.length, 3);
});
