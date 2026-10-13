window.__ModuleLoader__.load({id:"dsh-workflow-studio",factory:(require)=>{
const React=require("react");
const ReactDOM=require("react-dom");
const STUDIO_CSS=".ws-root{--ws-bg:var(--dsw-alias-bg-base,#f5f6f8);--ws-surface:var(--dsw-alias-bg-layer-1,#fff);--ws-text:var(--dsw-alias-text-primary,#202632);--ws-muted:var(--dsw-alias-text-secondary,#687384);--ws-border:var(--dsw-alias-border-l4,#e2e6ed);--ws-accent:var(--dsw-alias-brand-primary,#4d6bfe);position:relative;display:flex;flex-direction:column;width:100%;height:100%;min-height:500px;overflow:hidden;color:var(--ws-text);background:var(--ws-bg);font:13px/1.5 var(--dsw-font-family,system-ui,sans-serif)}\n.ws-root *{box-sizing:border-box}.ws-root button,.ws-root select,.ws-root input,.ws-root textarea{font:inherit;color:inherit}.ws-root button{cursor:pointer;border:1px solid var(--ws-border);background:var(--ws-surface);border-radius:8px;padding:7px 11px;white-space:nowrap}.ws-root button:disabled{opacity:.45;cursor:not-allowed}.ws-root button:hover:not(:disabled){border-color:var(--ws-accent)}.ws-root :focus-visible{outline:2px solid var(--ws-accent);outline-offset:3px}.ws-root .ws-primary{background:var(--ws-accent);color:white;border-color:var(--ws-accent)}\n.ws-header{display:flex;gap:16px;align-items:center;justify-content:space-between;padding:16px 22px;background:var(--ws-surface);border-bottom:1px solid var(--ws-border);flex-wrap:wrap}.ws-header h2{font-size:19px;margin:0}.ws-header p{color:var(--ws-muted);font-size:11px;margin:4px 0 0}.ws-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.ws-body{display:flex;flex:1;min-height:0}.ws-canvas{position:relative;flex:1;min-width:200px;min-height:360px;overflow:hidden;touch-action:none;background-image:radial-gradient(var(--ws-border) 1px,transparent 1px);background-size:24px 24px;cursor:grab}.ws-canvas:active{cursor:grabbing}.ws-world{position:absolute;left:0;top:0;transform-origin:0 0}.ws-edges{position:absolute;overflow:visible;pointer-events:none}.ws-edges path{fill:none;stroke:var(--ws-border);stroke-width:2}.ws-edges .ws-edge-done{stroke:var(--ws-accent)}\n.ws-node{position:absolute;width:260px;min-height:200px;background:var(--ws-surface);border:1px solid var(--ws-border);border-radius:12px;padding:17px;box-shadow:0 3px 12px #00000006;cursor:grab;user-select:none}.ws-node.ws-selected{border:2px solid var(--ws-accent);padding:16px}.ws-node-top{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--ws-muted)}.ws-node-child{color:var(--ws-muted);font-size:10px}.ws-dot{width:7px;height:7px;background:var(--ws-muted);border-radius:50%}.ws-node[data-status=running] .ws-dot{background:var(--ws-accent)}.ws-node[data-status=completed] .ws-dot{background:#238568}.ws-node[data-status=failed] .ws-dot{background:#c64a4a}.ws-root .ws-node-title{font-weight:600;font-size:15px;padding:10px 0 0;border:0;background:none;white-space:normal;text-align:left;overflow-wrap:anywhere}.ws-node-role{color:var(--ws-muted);margin:6px 0 10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ws-inout{display:flex;flex-direction:column;gap:6px;margin:2px 0 8px}.ws-io{display:flex;gap:8px;align-items:flex-start;font-size:11px}.ws-io-tag{flex:none;color:var(--ws-muted);border:1px solid var(--ws-border);border-radius:4px;padding:0 5px;font-size:10px;line-height:1.6}.ws-io-out{color:#238568}.ws-io-text{overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow-wrap:anywhere}.ws-node-tools{font-size:11px;color:var(--ws-muted);margin-top:6px}.ws-node-detail{border-top:1px solid var(--ws-border);margin-top:12px;padding-top:10px}.ws-node-detail h4{margin:12px 0 5px;font-size:12px}.ws-node-detail p.ws-detail-text{white-space:pre-wrap;overflow-wrap:anywhere;color:var(--ws-muted);margin:0;font-size:11px}.ws-child-btn,.ws-collapse{margin-top:10px}.ws-collapse{border:0;background:none;color:var(--ws-accent);padding:0;margin-left:10px;font-size:12px}\n.ws-controls{position:absolute;bottom:18px;left:18px;display:flex;gap:7px;align-items:center;background:var(--ws-surface);border:1px solid var(--ws-border);border-radius:10px;padding:5px;cursor:default}.ws-controls button{border:0}.ws-controls span{min-width:40px;text-align:center;font-size:11px}.ws-inspector{width:300px;flex:none;background:var(--ws-surface);border-left:1px solid var(--ws-border);padding:20px;overflow:auto}.ws-inspector h3{font-size:15px;margin:0 0 16px}.ws-inspector h4{margin:20px 0 8px}.ws-inspector-title{display:flex;justify-content:space-between;align-items:center}.ws-field{display:flex;flex-direction:column;gap:6px;margin:12px 0;font-size:12px}.ws-field>span{color:var(--ws-muted)}.ws-field input,.ws-field textarea,.ws-field select,.ws-version select{background:var(--ws-bg);border:1px solid var(--ws-border);padding:8px;border-radius:7px;min-width:0;resize:vertical;width:100%}.ws-help{font-size:11px;color:var(--ws-muted);line-height:1.8}.ws-result,.ws-call pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--ws-bg);border-radius:8px;padding:10px;max-height:320px;overflow:auto;font-size:11px}.ws-call{border-top:1px solid var(--ws-border);padding:8px 0}.ws-call summary{cursor:pointer}.ws-upstream>div{display:flex;align-items:center;justify-content:space-between}.ws-version{padding:8px 20px;display:flex;gap:12px;align-items:center;border-bottom:1px solid var(--ws-border);font-size:11px}.ws-version label{display:flex;gap:10px;align-items:center}.ws-version select{width:280px;padding:4px}.ws-notice{padding:9px 22px;background:var(--ws-surface);color:var(--ws-muted);font-size:12px}.ws-error{color:#b33e3e;white-space:pre-wrap}.ws-empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px;text-align:center;cursor:default}.ws-empty h3{font-size:24px;margin:12px}.ws-empty p{max-width:460px;color:var(--ws-muted);line-height:1.8}.ws-symbol{font-size:60px;color:var(--ws-accent)}.ws-json{position:absolute;inset:20px;background:var(--ws-surface);border:1px solid var(--ws-border);border-radius:12px;box-shadow:0 20px 80px #0003;z-index:5;display:flex;flex-direction:column;padding:20px;gap:14px}.ws-json textarea{flex:1;resize:none;background:var(--ws-bg);border:1px solid var(--ws-border);border-radius:8px;padding:12px;font-family:monospace}.ws-json h3{margin:0}@media(max-width:850px){.ws-inspector{width:250px}.ws-header{padding:12px}.ws-actions{gap:4px}.ws-actions button{padding:5px 7px;font-size:11px}}@media(max-width:600px){.ws-body{flex-direction:column}.ws-inspector{width:100%;max-height:260px;border-left:0;border-top:1px solid var(--ws-border)}.ws-canvas{min-height:340px}}\n.ws-progress{height:5px;border-radius:3px;background:var(--ws-border);overflow:hidden;margin:10px 0}.ws-progress-fill{height:100%;border-radius:3px;background:var(--ws-muted);transition:width .4s ease}.ws-fill-running{width:40%;background:var(--ws-accent);animation:ws-progress-run 1.4s ease-in-out infinite}.ws-fill-completed{background:#238568}.ws-fill-failed,.ws-fill-cancelled,.ws-fill-interrupted{background:#c64a4a}.ws-fill-blocked,.ws-fill-ready{width:0}@keyframes ws-progress-run{0%{margin-left:-40%}100%{margin-left:100%}}\n.ws-chatbar{flex:none;border-top:1px solid var(--ws-border);background:var(--ws-surface);padding:12px 16px;display:flex;flex-direction:column;gap:8px}.ws-chat-target{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ws-muted)}.ws-chat-target-dot{width:8px;height:8px;border-radius:50%;background:var(--ws-accent)}.ws-chatbar .ws-chat-target button{border:0;background:none;color:var(--ws-accent);padding:0 4px;font-size:12px}.ws-chatbar textarea{resize:vertical;background:var(--ws-bg);border:1px solid var(--ws-border);border-radius:8px;padding:10px;font:inherit;min-height:56px;width:100%}.ws-chat-actions{display:flex;justify-content:flex-end}\n.ws-side{width:340px;flex:none;display:flex;flex-direction:column;border-left:1px solid var(--ws-border);background:var(--ws-surface);min-height:0}.ws-side-head{padding:12px 16px;border-bottom:1px solid var(--ws-border);font-size:12px;color:var(--ws-muted)}.ws-side-stream{flex:1;overflow:auto;padding:12px 16px;display:flex;flex-direction:column;gap:8px;min-height:0}.ws-side-input{border-top:1px solid var(--ws-border);padding:12px 16px;display:flex;flex-direction:column;gap:8px}.ws-side-input textarea{resize:vertical;background:var(--ws-bg);border:1px solid var(--ws-border);border-radius:8px;padding:10px;font:inherit;min-height:64px;width:100%}.ws-stream-item{display:flex;align-items:center;gap:8px;font-size:12px}.ws-stream-plan{font-size:13px}.ws-stream-dot{width:7px;height:7px;border-radius:50%;background:var(--ws-muted);flex:none}.ws-stream-item[data-status=running] .ws-stream-dot{background:var(--ws-accent)}.ws-stream-item[data-status=completed] .ws-stream-dot{background:#238568}.ws-stream-item[data-status=failed] .ws-stream-dot{background:#c64a4a}.ws-muted{color:var(--ws-muted)}.ws-stream-empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:24px 8px}.ws-stream-empty p{margin:0;color:var(--ws-muted);line-height:1.8}.ws-stream-empty .ws-symbol{font-size:44px}@media(max-width:900px){.ws-side{width:280px}}\n.ws-runline{display:flex;align-items:center;gap:8px;font-size:12px;padding:6px 0;border-bottom:1px solid var(--ws-border)}.ws-runline[data-status=running] .ws-stream-dot{background:var(--ws-accent)}.ws-runline[data-status=completed] .ws-stream-dot{background:#238568}.ws-runline[data-status=failed] .ws-stream-dot{background:#c64a4a}.ws-msg{display:flex;flex-direction:column;gap:3px;padding:7px 0;border-bottom:1px solid var(--ws-border);font-size:12px}.ws-msg-who{font-size:10px;color:var(--ws-muted)}.ws-msg-user .ws-msg-who{color:var(--ws-accent)}.ws-msg-text{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7}.ws-msg-tool .ws-msg-text{color:var(--ws-muted)}.ws-msg-error .ws-msg-text{color:#b33e3e}\n.ws-history{background:var(--ws-bg);border:1px solid var(--ws-border);border-radius:7px;padding:6px 8px;font-size:12px;max-width:260px}\n.ws-live{font-size:11px;color:var(--ws-accent);margin-top:6px;overflow-wrap:anywhere}\n\n/* One native transcript and one native editor, both remain mounted in place.\n   Studio is a sibling canvas in the same Conversation body, never another page. */\n[data-conversation-content]:has(> [data-workflow-studio]) {\n  position: relative;\n  --ws-side-width: clamp(320px, 36%, 480px);\n}\n[data-conversation-content]:has(> [data-workflow-studio]) > [data-conversation-scroll] {\n  flex: 1; width: var(--ws-side-width); margin-left: auto;\n  border-left: 1px solid var(--dsw-alias-border-l4,#e2e6ed);\n  --dsh-chat-content-width: 100%;\n  --dsh-composer-side-clearance: 0px;\n}\n[data-conversation-content] > .ws-root {\n  position: absolute; left: 0; top: 0; bottom: 0;\n  width: calc(100% - var(--ws-side-width)); height: 100%; min-height: 0;\n}\n.ws-body { flex-direction: row; }\n.ws-canvas { min-width: 0; min-height: 0; }\n@media(max-width:650px) {\n  [data-conversation-content]:has(> [data-workflow-studio]) { --ws-side-width: 52%; }\n  .ws-header { padding: 8px; gap: 8px; }\n  .ws-header h2 { font-size: 14px; }\n  .ws-controls { left: 6px; bottom: 6px; gap: 0; }\n  .ws-controls button { padding: 6px; }\n}\n";
/** Versioned JSON graph shared by the host validator and browser editor. */
const PLAN_KIND = 'workflow-studio-plan';
const RUN_KIND = 'workflow-studio-run';
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
function validatePlan(input, maxNodes = 24) {
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
function graphWaves(plan) {
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
function runName(plan) { return `studio:${plan.id}:${plan.revision}`; }
/** Only direct upstream outputs enter a node; arbitrary text is never evaluated as code. */
function nodePrompt(plan, node, outputs, skills) {
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
function samplePlan() {
  return { version: 1, id: 'delivery', revision: 1, title: '从需求到交付', input: '请在运行前填写真实需求与文档路径。', nodes: [
    { id: 'clarify', label: '需求澄清 Agent', role: '产品经理', task: '阅读需求，列出目标、范围、约束、验收标准与待确认问题。不得自行假定未确认的关键需求。', skills: [], tools: [], output: '需求澄清文档' },
    { id: 'design', label: '方案设计 Agent', role: '架构师', task: '根据上游需求输出可实施的架构、接口、数据模型、验证方案与风险。', skills: [], tools: [], output: '详细技术方案' },
    { id: 'coding', label: 'Coding Agent', role: '工程师', task: '依据技术方案实现代码并运行相关验证，报告实际修改与结果。', skills: [], tools: [], output: '代码变更与验证报告' },
  ], edges: [{ from: 'clarify', to: 'design' }, { from: 'design', to: 'coding' }] };
}


/** Read only the plugin's versioned tool result; malformed data remains a generic native tool card. */
function studioResult(event) {
  if (event.type !== 'tool/result' && event.type !== 'tool/ptc-dispatch') return null;
  const data = event.data;
  if (data.message?.isError || data.isError) return null;
  let value = data.meta;
  if (!value || (value.kind !== PLAN_KIND && value.kind !== RUN_KIND)) {
    const content = data.message?.content ?? data.content ?? [];
    const text = content.filter(b => b.type === 'text').map(b => b.text).join('');
    try { value = JSON.parse(text); } catch { return null; }
  }
  if (value?.kind !== PLAN_KIND && value?.kind !== RUN_KIND) return null;
  try { return { ...value, plan: validatePlan(value.plan, 100) }; } catch { return null; }
}
/** Pure, replayable event folds for plans and actual workflow membership. */
const studioDefinition = {
  kind: 'workflow-studio', target: 'workflow-studio',
  match(event) {
    const result = studioResult(event);
    if (result) return { id: `result:${event.seq}`, role: 'start' };
    if (event.type === 'tool-workflow/run-start') return { id: event.data.runId, role: 'start' };
    if (['tool-workflow/agent-start', 'tool-workflow/agent-end', 'tool-workflow/agent-progress', 'tool-workflow/run-end'].includes(event.type)) return { id: event.data.runId, role: 'update' };
    return null;
  },
  start(_context, match) {
    const result = studioResult(match.event);
    return result ? { type: 'result', ...result } : { type: 'run', name: match.event.data.name, runId: match.event.data.runId, status: 'running', members: [] };
  },
  update(context, match) {
    const s = context.state, e = match.event;
    if (e.type === 'tool-workflow/agent-start') return { ...s, members: [...s.members, { ...e.data, status: 'running' }] };
    if (e.type === 'tool-workflow/agent-progress') return { ...s, members: s.members.map(m => m.seq === e.data.seq ? { ...m, calls: e.data.calls, lastTool: e.data.lastTool } : m) };
    if (e.type === 'tool-workflow/agent-end') return { ...s, members: s.members.map(m => m.seq === e.data.seq ? { ...m, status: e.data.outcome } : m) };
    if (e.type === 'tool-workflow/run-end') return { ...s, status: e.data.stopReason === 'error' ? 'failed' : e.data.stopReason };
    return s;
  },
  buildViewNode(context) {
    if (!context.start) return null;
    let data = context.state;
    const location = context.start.location;
    const reason = location.turn?.end?.data.reason?.kind;
    if (data.type === 'run' && data.status === 'running' && ['interrupted', 'forked'].includes(reason)) data = { ...data, status: 'interrupted', members: data.members.map(m => m.status === 'running' ? { ...m, status: 'interrupted' } : m) };
    return { key: context.key, kind: 'workflow-studio', id: context.id, target: 'workflow-studio', anchorSeq: context.start.event.seq, location, visibility: 'visible', data };
  },
};
/** Incremental target builder; complete reconstruction is reserved for history replacement. */
function createStudioBuilder() {
  const nodes = new Map();
  const snapshot = () => [...nodes.values()].sort((a, b) => a.anchorSeq - b.anchorSeq);
  return { empty: [], replace({ nodes: rows }) { nodes.clear(); rows.forEach(n => nodes.set(n.key, n)); return snapshot(); }, apply({ upserts }) { upserts.forEach(n => nodes.set(n.key, n)); return snapshot(); } };
}

const zh = {
  tab: '工作流', title: 'Agent 工作流', subtitle: '把目标拆解为可以追踪的工作', chat: '原生聊天', sample: '使用示例草案', edit: '编辑 JSON', export: '导出', import: '导入', run: '运行此版本', save: '发布草案', close: '关闭', reset: '适应画布', zoomIn: '放大', zoomOut: '缩小', add: '添加 Agent', connect: '连接到', remove: '删除节点', empty: '从一个目标开始', emptyHelp: '在右侧对话中描述目标，Agent 流程会随对话建立并更新。', draft: '本地草案 · 尚未发布', ready: '待运行', running: '运行中', completed: '已完成', failed: '失败', cancelled: '已取消', interrupted: '已中断', blocked: '未执行', details: '节点详情', role: '角色 / 背景', task: '任务', skills: '技能名称（每行一个）', tools: '允许的工具（每行一个）', output: '预期产物', input: '项目输入 / 文档路径', upstream: '上游节点', actual: '实际输出', noOutput: '尚无已提交的输出。预期产物不代表文件已生成。', trace: '实际工具调用', noTrace: '尚无已提交的调用记录；运行中可在子会话查看。', openChild: '打开子会话', planOnly: '技能会在运行前读取；工具白名单在子 Agent 中强制生效。空白名单不授予任何工具。', configure: '示例未绑定技能和工具。请先让 AI 查询真实能力并配置，再运行。', pending: '请求已提交，等待 AI 调用对应工具。', history: '版本 / 运行记录', aiHelp: '通过右侧对话修改流程、添加附件、回答澄清问题。', preparing: '正在提交…', newNode: '新 Agent', newTask: '填写这个节点要完成的工作。', newOutput: '填写可验收的输出。', noSkills: '未绑定技能', noTools: '无工具权限', importError: '无法读取工作流', editHint: '修改后作为新的草案发布；不会改变已有运行。', label: '节点名称', unknown: '状态未知', disconnect: '移除此依赖', status: '状态', toolsCount: '工具', skillsCount: '技能', select: '点击节点查看配置与执行结果', sampleTitle: '从需求到交付', error: '操作失败', name: '工作流名称', nativeRequired: '运行请使用 Native 工具模式；PTC 嵌套执行会被明确拒绝。', viewResult: '查看运行结果', noEdges: '无上游依赖', exportName: 'workflow.json', calls: '工具调用', you: '你', assistant: '助手', tool: '工具', conversation: '对话 · 执行流', autoPlanHint: '请基于以下诉求立即编排并生成工作流，无需等待我确认编排：', send: '发送', chatPlaceholder: '描述你的目标，或粘贴需求、飞书纪要、GitHub / Coding 需求链接…', chatPlaceholderNode: '向该 Agent 补充或修改要求，变更会影响后续 Agent…', targetWorkflow: '整个工作流 · 总领输入', targetNode: 'Agent：{label}', clearTarget: '回到工作流', noChild: '该 Agent 尚未运行，暂时无法单独对话', collapse: '收起', in: '输入', out: '输出', runRequest: '请运行画布中的当前工作流',
};
const en = {
  tab: 'Workflow', title: 'Agent workflow', subtitle: 'Turn a goal into traceable work', chat: 'Native chat', sample: 'Use sample draft', edit: 'Edit JSON', export: 'Export', import: 'Import', run: 'Run this revision', save: 'Publish draft', close: 'Close', reset: 'Fit canvas', zoomIn: 'Zoom in', zoomOut: 'Zoom out', add: 'Add agent', connect: 'Connect to', remove: 'Delete node', empty: 'Start with a goal', emptyHelp: 'Describe your goal on the right. The agent workflow is created and updated as you chat.', draft: 'Local draft · unpublished', ready: 'Ready', running: 'Running', completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled', interrupted: 'Interrupted', blocked: 'Not executed', details: 'Node details', role: 'Role / background', task: 'Task', skills: 'Skill names (one per line)', tools: 'Allowed tools (one per line)', output: 'Expected deliverable', input: 'Project input / document paths', upstream: 'Upstream nodes', actual: 'Actual output', noOutput: 'No committed output yet. An expected deliverable does not prove a file exists.', trace: 'Actual tool calls', noTrace: 'No committed calls yet; open the child session during execution.', openChild: 'Open child session', planOnly: 'Skills load before execution; tool allowlists are enforced in each child. An empty list grants no tools.', configure: 'The sample has no skills or tools bound. Ask AI to discover and configure real capabilities before running.', pending: 'Request submitted; waiting for AI to call the corresponding tool.', history: 'Revisions / runs', aiHelp: 'Use the chat on the right to edit the graph, attach documents, and answer questions.', preparing: 'Submitting…', newNode: 'New agent', newTask: 'Describe the work this node should perform.', newOutput: 'Describe a verifiable deliverable.', noSkills: 'No skills bound', noTools: 'No tool access', importError: 'Cannot read workflow', editHint: 'Edits create a new draft and do not change an existing run.', label: 'Node name', unknown: 'Unknown', disconnect: 'Remove dependency', status: 'Status', toolsCount: 'tools', skillsCount: 'skills', select: 'Select a node to inspect its configuration and execution', sampleTitle: 'From requirements to delivery', error: 'Action failed', name: 'Workflow name', nativeRequired: 'Run in Native tool mode; nested PTC execution is explicitly rejected.', viewResult: 'View run result', noEdges: 'No upstream dependencies', exportName: 'workflow.json', calls: 'tool calls', you: 'You', assistant: 'Assistant', tool: 'Tool', conversation: 'Conversation · execution', autoPlanHint: 'Plan and generate the workflow immediately from the following request, without waiting for my approval:', send: 'Send', chatPlaceholder: 'Describe your goal, or paste requirements, Feishu notes, or a GitHub / Coding issue link…', chatPlaceholderNode: 'Add or revise requirements for this agent; changes ripple to downstream agents…', targetWorkflow: 'Entire workflow · initial input', targetNode: 'Agent: {label}', clearTarget: 'Back to workflow', noChild: 'This agent has not run yet, so it cannot be addressed directly', collapse: 'Collapse', in: 'In', out: 'Out', runRequest: 'Please run the current workflow on the canvas',
};


const h = (...args) => React.createElement(...args);
const { useState, useRef, useMemo, useEffect } = React;
const button = (label, onClick, extra = {}) => h('button', { type: 'button', onClick, ...extra }, label);


// Keep the resident native Chat and composer untouched. The canvas is a sibling
// of their scrollport, mounted from the session header's independent slot.
function StudioCanvasPortal(props) {
  const anchor = useRef(null);
  const [container, setContainer] = useState(null);
  const view = props.useStore(value => value.view);
  const active = view == null || view === 'chat' || view === 'workflow-studio';
  React.useLayoutEffect(() => {
    const root = anchor.current?.closest('[data-phase]');
    if (!root) return;
    const sync = () => setContainer(root.querySelector('[data-conversation-content]'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true });
    return () => observer.disconnect();
  }, [props.sessionId]);
  useEffect(() => { if (view === 'workflow-studio') props.restoreChat(); }, [view]);
  return h(React.Fragment, null,
    h('span', { ref: anchor, hidden: true }),
    active && container ? ReactDOM.createPortal(h(StudioView, props), container) : null);
}

/** Workflow canvas with the native conversation mounted in its right sidebar. */
function StudioView(props) {
  const { t } = props;
  const rows = props.useStudio(v => v);
  const sessions = props.useSessions(v => v);
  const running = props.useSession(v => v.running);
  const [selectedNode, setSelectedNode] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [offset, setOffset] = useState({ x: 36, y: 80, scale: 1 });
  const [positions, setPositions] = useState({});
  const viewport = useRef(null), gesture = useRef(null);
  const focused = useRef(null), wasRunning = useRef(false);

  const versions = rows.filter(r => r.data.type === 'result');
  const selected = versions.find(r => r.key === selectedVersion) ?? versions.at(-1);
  const plan = selected?.data.plan;
  const result = selected?.data.kind === RUN_KIND ? selected.data : null;
  const liveRun = plan ? rows.filter(r => r.data.type === 'run' && r.data.name === runName(plan)).at(-1)?.data : null;
  const run = result ? rows.find(r => r.data.type === 'run' && r.data.runId === result.runId)?.data : liveRun;

  const statusFor = n => run?.members.find(m => m.phase === n.id)?.status ?? (run && run.status !== 'running' ? 'blocked' : 'ready');
  const runRunning = run?.status === 'running';

  // Fit once on entry/new workflow and at the start of an interaction. Streaming
  // updates never reclaim the viewport after the user has panned or moved nodes.
  useEffect(() => {
    if (plan && (focused.current !== plan.id || (running && !wasRunning.current))) {
      fit(); focused.current = plan.id;
    }
    wasRunning.current = running;
  }, [plan?.id, running]);

  const layout = useMemo(() => {
    if (!plan) return {};
    try { return Object.fromEntries(graphWaves(plan).flatMap((wave, x) => wave.map((n, y) => [n.id, { x: x * 320, y: y * 300 }]))); }
    catch { return Object.fromEntries(plan.nodes.map((n, i) => [n.id, { x: i * 320, y: 0 }])); }
  }, [plan]);
  const pos = n => positions[n.id] ?? layout[n.id] ?? { x: 0, y: 0 };

  function selectNode(id) { setSelectedNode(id); setExpanded(prev => ({ ...prev, [id]: true })); setError(''); }
  function toggleExpand(id) { setExpanded(prev => ({ ...prev, [id]: false })); if (selectedNode === id) setSelectedNode(null); }

  async function submitRun() {
    if (!plan || busy || runRunning) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await props.send(t('runRequest'), undefined);
      setNotice(t('pending'));
    } catch (e) { setError(String(e.message ?? e)); }
    finally { setBusy(false); }
  }
  function openChildFor(childId) {
    if (!childId) { setError(t('noChild')); return; }
    const child = sessions.byId?.[childId];
    if (!child) { setError(t('unknown')); return; }
    const mode = sessions.projectionsBySession?.[childId]?.values?.subagent?.mode;
    props.openChild({ parentSessionId: props.sessionId, childSessionId: childId, ...(mode ? { mode } : {}) });
  }
  function fit() {
    if (!plan || !viewport.current) return;
    const bounds = plan.nodes.map(n => pos(n));
    const left = Math.min(...bounds.map(p => p.x)), top = Math.min(...bounds.map(p => p.y));
    const width = Math.max(...bounds.map(p => p.x + 260)) - left;
    const height = Math.max(...bounds.map(p => p.y + 260)) - top;
    const w = viewport.current.clientWidth, h = viewport.current.clientHeight;
    const scale = Math.min(1, Math.max(0.15, Math.min((w - 64) / width, (h - 100) / height)));
    setOffset({ x: (w - width * scale) / 2 - left * scale, y: Math.max(24, (h - height * scale) / 2 - 25) - top * scale, scale });
  }
  function wheel(e) {
    if (!e.ctrlKey && !e.metaKey) { setOffset(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY })); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    setOffset(v => { const scale = Math.max(0.25, Math.min(2, v.scale * Math.exp(-e.deltaY / 500))); return { scale, x: x - (x - v.x) * scale / v.scale, y: y - (y - v.y) * scale / v.scale }; });
  }
  function begin(e, id) {
    if (e.button !== 0 || e.target.closest('button,input,select,textarea')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { id, x: e.clientX, y: e.clientY, start: id ? pos({ id }) : offset };
    if (id) setSelectedNode(id);
    e.stopPropagation();
  }
  function move(e) {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (g.id) setPositions(p => ({ ...p, [g.id]: { x: g.start.x + dx / offset.scale, y: g.start.y + dy / offset.scale } }));
    else setOffset(p => ({ ...p, x: g.start.x + dx, y: g.start.y + dy }));
  }

  function progress(status) {
    return h('div', { className: 'ws-progress' }, h('div', { className: `ws-progress-fill ws-fill-${status}`, style: status === 'completed' || status === 'failed' ? { width: '100%' } : status === 'running' ? undefined : { width: '0%' } }));
  }

  function nodeCard(n) {
    const status = statusFor(n);
    const isOpen = expanded[n.id] === true || status === 'running' || n.id === selectedNode;
    const out = result?.outputs?.[n.id];
    const tr = result?.traces?.[n.id];
    const member = run?.members.find(m => m.phase === n.id);
    const childId = member?.childId ?? out?.childId;
    const liveCalls = member?.calls;
    const liveTool = member?.lastTool;
    const upstreamIds = plan.edges.filter(e => e.to === n.id).map(e => e.from);
    return h('article', {
      key: n.id,
      className: `ws-node ${selectedNode === n.id ? 'ws-selected' : ''} ${isOpen ? 'ws-open' : ''}`,
      'data-status': status,
      style: { left: pos(n).x, top: pos(n).y },
      onPointerDown: e => begin(e, n.id),
    },
      h('div', { className: 'ws-node-top' }, h('span', { className: 'ws-dot' }), h('span', null, t(status)), childId && h('span', { className: 'ws-node-child' }, `· ${childId.slice(0, 8)}`)),
      progress(status),
      h('button', { className: 'ws-node-title', onClick: () => selectNode(n.id) }, n.label),
      h('p', { className: 'ws-node-role' }, n.role),
      h('div', { className: 'ws-inout' },
        h('div', { className: 'ws-io' }, h('span', { className: 'ws-io-tag' }, t('in')), h('div', { className: 'ws-io-text' }, n.task)),
        h('div', { className: 'ws-io' }, h('span', { className: 'ws-io-tag ws-io-out' }, t('out')), h('div', { className: 'ws-io-text' }, out?.text ?? n.output)),
      ),
      h('div', { className: 'ws-node-tools' }, `${n.skills.length} ${t('skillsCount')} · ${n.tools.length} ${t('toolsCount')}`),
      status === 'running' && liveCalls != null && h('div', { className: 'ws-live' }, `${t('calls')}: ${liveCalls}${liveTool ? ` · ${liveTool}` : ''}`),
      isOpen && h('div', { className: 'ws-node-detail' },
        h('h4', null, t('task')), h('p', { className: 'ws-detail-text' }, n.task),
        upstreamIds.length
          ? h('div', null, h('h4', null, t('upstream')), h('p', { className: 'ws-detail-text' }, upstreamIds.map(id => plan.nodes.find(x => x.id === id)?.label ?? id).join(' → ')))
          : h('p', { className: 'ws-help' }, t('noEdges')),
        h('h4', null, t('actual')), h('pre', { className: 'ws-result' }, out?.text ?? t('noOutput')),
        tr?.length
          ? h('div', null, h('h4', null, t('trace')), tr.slice(0, 6).map((call, i) => h('div', { key: i, className: 'ws-call' }, `${call.isError ? '×' : '✓'} ${call.name}`)))
          : h('p', { className: 'ws-help' }, t('noTrace')),
        childId && h('button', { className: 'ws-child-btn', onClick: () => openChildFor(childId) }, t('openChild')),
        h('button', { className: 'ws-collapse', onClick: () => toggleExpand(n.id) }, t('collapse')),
      ),
    );
  }

  return h('section', { className: 'ws-root', 'data-workflow-studio': true },
    h('header', { className: 'ws-header' },
      h('div', null, h('h2', null, plan?.title ?? t('title')), h('p', null, plan ? (run ? `${t(run.status)} · ${run.runId?.slice(0, 8)}` : t('ready')) : t('subtitle'))),
      h('div', { className: 'ws-actions' },
        versions.length > 1 && h('select', {
          className: 'ws-history', value: selected?.key ?? '', 'aria-label': t('history'),
          onChange: e => { setSelectedVersion(e.target.value); setSelectedNode(null); setPositions({}); setError(''); },
        }, versions.map(v => h('option', { key: v.key, value: v.key }, `v${v.data.plan.revision} · ${v.data.status ? t(v.data.status) : t('ready')}`))),
        plan && button(t('run'), submitRun, { className: 'ws-primary', disabled: busy || runRunning }),
        button(t('reset'), fit)),
    ),
    (error || notice) && h('div', { className: error ? 'ws-notice ws-error' : 'ws-notice', role: error ? 'alert' : 'status' }, error || notice),
    h('div', { className: 'ws-body' },
      h('div', {
        className: 'ws-canvas', ref: viewport, onWheel: wheel, onPointerDown: e => begin(e), onPointerMove: move,
        onPointerUp: () => { gesture.current = null; }, onPointerCancel: () => { gesture.current = null; }, tabIndex: 0, 'aria-label': t('tab'),
      },
        !plan
          ? h('div', { className: 'ws-empty' }, h('div', { className: 'ws-symbol' }, '◇'), h('h3', null, t('empty')), h('p', null, t('emptyHelp')))
          : h('div', { className: 'ws-world', style: { transform: `translate(${offset.x}px, ${offset.y}px) scale(${offset.scale})` } },
              h('svg', { className: 'ws-edges', width: 1, height: 1, 'aria-hidden': true }, plan.edges.map(e => {
                const a = pos({ id: e.from }), b = pos({ id: e.to });
                return h('path', { key: `${e.from}-${e.to}`, d: `M ${a.x + 260} ${a.y + 90} C ${a.x + 292} ${a.y + 90}, ${b.x - 32} ${b.y + 90}, ${b.x} ${b.y + 90}`, className: statusFor({ id: e.from }) === 'completed' ? 'ws-edge-done' : '' });
              })),
              plan.nodes.map(nodeCard)),
        h('div', { className: 'ws-controls' },
          button('−', () => setOffset(o => ({ ...o, scale: Math.max(0.25, o.scale - 0.1) })), { 'aria-label': t('zoomOut') }),
          h('span', null, `${Math.round(offset.scale * 100)}%`),
          button('+', () => setOffset(o => ({ ...o, scale: Math.min(2, o.scale + 0.1) })), { 'aria-label': t('zoomIn') }),
          button(t('reset'), fit))),
  ));
}


const clientInject = ['slots', 'sessions', 'uiConversation', 'uiWorkspace', 'locale'];
/** Registers a real Conversation target and hooks through the native renderer. */
function applyClient(ctx) {
  ctx.effect(() => {
    const style = document.createElement('style'); style.dataset.workflowStudio = 'true'; style.textContent = STUDIO_CSS;
    document.head.appendChild(style); return () => style.remove();
  });
  ctx.effect(() => ctx.locale.register('workflowStudio', { zh, en }));
  const t = ctx.locale.bind('workflowStudio');
  ctx.uiConversation.events.register(studioDefinition);
  ctx.uiConversation.views.register({ target: 'workflow-studio', create: createStudioBuilder, isActive: rows => rows.length > 0 });
  const empty = [];
  ctx.slots.inject('conversation.session.header.actions', () => {
    const store = ctx.slots.entries('conversation.session.header').find(entry => entry.store)?.store;
    if (!store) throw new Error('Workflow Studio requires the native Conversation store');
    return ctx.slots.register({
      name: 'conversation.session.header.actions', id: 'workflow-studio', store, locale: 'workflowStudio',
      inject: (sessionId, actions) => {
        const session = ctx.sessions.binding(sessionId)?.session;
        if (!session) throw new Error('Workflow Studio: session unavailable');
        const binding = ctx.uiConversation.binding(sessionId);
        const target = binding.target('workflow-studio');
        return {
          hooks: { studio: { getSnapshot: () => target.getSnapshot() ?? empty, subscribe: listener => target.subscribe(listener) } },
          restoreChat: () => { binding.activate('chat'); actions.setView('chat'); },
          send: async text => {
            const result = await session.prompt([{ type: 'text', text }], 'queue');
            if (!result.ok) throw new Error(result.error.message);
          },
          openChild: target => ctx.uiWorkspace.openSession(target),
        };
      },
    }, StudioCanvasPortal);
  });
}

return {apply:applyClient,inject:clientInject};
}});
