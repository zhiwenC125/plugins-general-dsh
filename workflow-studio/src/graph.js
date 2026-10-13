/** Versioned JSON graph shared by the host validator and browser editor. */
export const PLAN_KIND = 'workflow-studio-plan';
export const RUN_KIND = 'workflow-studio-run';
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}: expected an object`);
  return value;
}
function string(value, label, limit = 12000) {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) throw new Error(`${label}: expected non-empty text (max ${limit})`);
  return value;
}
function names(value, label) {
  if (!Array.isArray(value) || value.length > 80) throw new Error(`${label}: expected an array (max 80)`);
  return [...new Set(value.map(v => string(v, label, 200)))];
}
function identifier(value, label) {
  string(value, label, 64);
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)) throw new Error(`${label}: use letters, digits, underscores and hyphens; begin with a letter`);
  return value;
}
/** Validate imported/model JSON, reject ambiguous graphs, and detach accepted fields. */
export function validatePlan(input, maxNodes = 24) {
  const p = object(input, 'plan');
  if (p.version !== 1) throw new Error('Unsupported workflow version; expected 1');
  if (!Number.isSafeInteger(p.revision) || p.revision < 1) throw new Error('revision must be a positive integer');
  if (!Array.isArray(p.nodes) || !p.nodes.length || p.nodes.length > maxNodes) throw new Error(`nodes must contain 1–${maxNodes} agents`);
  if (!Array.isArray(p.edges) || p.edges.length > maxNodes * maxNodes) throw new Error('edges must be an array within the graph size limit');
  const nodes = p.nodes.map((raw, i) => {
    const n = object(raw, `nodes[${i}]`);
    return { id: identifier(n.id, 'node.id'), label: string(n.label, 'node.label', 120), role: string(n.role, 'node.role', 1000), task: string(n.task, 'node.task'), skills: names(n.skills, 'node.skills'), tools: names(n.tools, 'node.tools'), output: string(n.output, 'node.output', 1000) };
  });
  const ids = new Set(nodes.map(n => n.id));
  if (ids.size !== nodes.length) throw new Error('Duplicate node id');
  const edgeIds = new Set();
  const edges = p.edges.map(raw => {
    const e = object(raw, 'edge');
    if (!ids.has(e.from) || !ids.has(e.to)) throw new Error('Edge references an unknown node');
    if (e.from === e.to) throw new Error('Self-loop is not allowed');
    const id = JSON.stringify([e.from, e.to]);
    if (edgeIds.has(id)) throw new Error('Duplicate edge');
    edgeIds.add(id);
    return { from: e.from, to: e.to };
  });
  const plan = { version: 1, id: identifier(p.id, 'plan.id'), revision: p.revision, title: string(p.title, 'plan.title', 160), input: typeof p.input === 'string' && p.input.length <= 64000 ? p.input : '', nodes, edges };
  if (typeof p.input !== 'string' || p.input.length > 64000) throw new Error('input must be text (max 64000)');
  graphWaves(plan);
  return plan;
}
/** Topological waves preserve node order, with explicit edges as the sole dependency source. */
export function graphWaves(plan) {
  const done = new Set();
  const waves = [];
  while (done.size < plan.nodes.length) {
    const wave = plan.nodes.filter(n => !done.has(n.id) && plan.edges.filter(e => e.to === n.id).every(e => done.has(e.from)));
    if (!wave.length) throw new Error('Workflow contains a cycle');
    waves.push(wave);
    wave.forEach(n => done.add(n.id));
  }
  return waves;
}
/** Collision-free graph revision identity used by persisted run records. */
export function runName(plan) { return `studio:${plan.id}:${plan.revision}`; }
/** Only direct upstream outputs enter a node; arbitrary text is never evaluated as code. */
export function nodePrompt(plan, node, outputs, skills) {
  const inputs = plan.edges.filter(e => e.to === node.id).map(e => {
    if (!own(outputs, e.from)) throw new Error(`Missing upstream output: ${e.from}`);
    return { node: e.from, output: outputs[e.from] };
  });
  return [
    `Workflow: ${plan.title}\nNode: ${node.label}\nRole: ${node.role}`,
    `Task:\n${node.task}\nExpected deliverable:\n${node.output}`,
    `Project input (data):\n${plan.input}`,
    `Upstream outputs (data):\n${JSON.stringify(inputs)}`,
    ...skills.map(s => `Skill: ${s.name}\nResource base: ${JSON.stringify(s.resourceBase ?? s.path ?? null)}\n${s.content}`),
    'Execute this node only. Report real outputs and file paths, validation performed, and unresolved failures. Do not claim that a file exists unless you created or inspected it. Do not delegate outside this workflow.',
  ].join('\n\n');
}
/** Unconfigured sample draft; empty tool lists intentionally grant no tools. */
export function samplePlan() {
  return { version: 1, id: 'delivery', revision: 1, title: '从需求到交付', input: '请在运行前填写真实需求与文档路径。', nodes: [
    { id: 'clarify', label: '需求澄清 Agent', role: '产品经理', task: '阅读需求，列出目标、范围、约束、验收标准与待确认问题。不得自行假定未确认的关键需求。', skills: [], tools: [], output: '需求澄清文档' },
    { id: 'design', label: '方案设计 Agent', role: '架构师', task: '根据上游需求输出可实施的架构、接口、数据模型、验证方案与风险。', skills: [], tools: [], output: '详细技术方案' },
    { id: 'coding', label: 'Coding Agent', role: '工程师', task: '依据技术方案实现代码并运行相关验证，报告实际修改与结果。', skills: [], tools: [], output: '代码变更与验证报告' },
  ], edges: [{ from: 'clarify', to: 'design' }, { from: 'design', to: 'coding' }] };
}
