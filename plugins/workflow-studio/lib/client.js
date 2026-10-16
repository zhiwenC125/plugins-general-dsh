window.__ModuleLoader__.load({id:"dsh-workflow-studio",factory:(require)=>{
const React=require("react");
const STUDIO_CSS=".ws-root {\n  --ws-bg: var(--dsw-alias-bg-base, #f6f7f9);\n  --ws-panel: var(--dsw-alias-bg-layer-1, #fff);\n  --ws-text: var(--dsw-alias-label-primary, #1e2430);\n  --ws-muted: var(--dsw-alias-label-secondary, #6d7687);\n  --ws-border: var(--dsw-alias-border-l4, #e1e5ec);\n  --ws-accent: var(--dsw-alias-brand-primary, #4d6bfe);\n  position: relative; display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0;\n  color: var(--ws-text); background: var(--ws-bg); font: 13px/1.5 var(--dsw-font-family, system-ui, sans-serif); overflow: hidden;\n}\n.ws-root * { box-sizing: border-box; }\n.ws-run-summary { position: absolute; top: 12px; left: 16px; display: flex; gap: 14px; padding: 8px 12px; border: 1px solid var(--ws-border); border-radius: 10px; background: var(--ws-panel); color: var(--ws-muted); font-size: 11px; pointer-events: none; }\n.ws-artifact-kind { display: inline-block; margin-right: 8px; padding: 1px 5px; background: var(--ws-panel); border-radius: 4px; color: var(--ws-muted); font-size: 9px; }\n.ws-root button:focus-visible, .ws-root select:focus-visible { outline: 2px solid var(--ws-accent); outline-offset: 3px; }\n@media (prefers-reduced-motion: reduce) { .ws-root *, .ws-root *::before, .ws-root *::after { animation: none !important; transition: none !important; } }\n.ws-root button, .ws-root select { font: inherit; color: inherit; }\n.ws-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 14px 20px; background: var(--ws-panel); border-bottom: 1px solid var(--ws-border); flex: none; }\n.ws-heading { min-width: 0; }\n.ws-title-row { display: flex; align-items: center; gap: 10px; }\n.ws-title-row h2 { font-size: 17px; line-height: 1.3; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.ws-heading p { margin: 3px 0 0; color: var(--ws-muted); font-size: 11px; }\n.ws-actions { display: flex; align-items: center; gap: 8px; }\n.ws-actions button, .ws-actions select, .ws-controls button, .ws-open-child { border: 1px solid var(--ws-border); background: var(--ws-panel); border-radius: 8px; padding: 6px 10px; cursor: pointer; }\n.ws-actions select { max-width: 280px; }\n.ws-actions button:hover, .ws-controls button:hover, .ws-open-child:hover { border-color: var(--ws-accent); }\n.ws-content { display: flex; flex: 1; min-height: 0; }\n.ws-canvas { position: relative; flex: 1; min-width: 0; overflow: hidden; touch-action: none; cursor: grab; background-color: var(--ws-bg); background-image: radial-gradient(var(--ws-border) 1px, transparent 1px); background-size: 22px 22px; }\n.ws-canvas:active { cursor: grabbing; }\n.ws-world { position: absolute; left: 0; top: 0; transform-origin: 0 0; }\n.ws-phase-links { position: absolute; overflow: visible; pointer-events: none; }\n.ws-agent-link { fill: none; stroke: #9aa7c7; stroke-width: 2; }\n.ws-arrow-head { fill: #9aa7c7; }\n.ws-phase-label { position: absolute; width: 280px; height: 62px; display: grid; grid-template-columns: 24px 1fr; grid-template-rows: 28px 18px; column-gap: 8px; align-items: center; color: var(--ws-text); font-weight: 600; }\n.ws-phase-label small { grid-column: 2; color: var(--ws-muted); font-size: 10px; font-weight: 400; }\n.ws-phase-index { grid-row: 1/3; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: var(--ws-accent); color: #fff; font-size: 11px; }\n.ws-root-node, .ws-node { position: absolute; width: 280px; height: 172px; border: 1px solid var(--ws-border); border-radius: 14px; background: var(--ws-panel); box-shadow: 0 6px 18px #1018280a; }\n.ws-root-node { height: 156px; display: flex; flex-direction: column; padding: 16px; border-color: color-mix(in srgb, var(--ws-accent) 38%, var(--ws-border)); background: color-mix(in srgb, var(--ws-accent) 5%, var(--ws-panel)); }\n.ws-root-node strong { margin-top: 9px; font-size: 15px; }\n.ws-root-node p { margin: 10px 0 0; color: var(--ws-muted); font-size: 11px; line-height: 1.55; }\n.ws-node-kicker { color: var(--ws-accent); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }\n.ws-node { display: flex; flex-direction: column; align-items: stretch; text-align: left; padding: 13px 15px; cursor: pointer; overflow: hidden; }\n.ws-node:hover, .ws-node-selected { border-color: var(--ws-accent); box-shadow: 0 8px 24px #4d6bfe1c; }\n.ws-node-selected { outline: 2px solid color-mix(in srgb, var(--ws-accent) 22%, transparent); outline-offset: 2px; }\n.ws-node-top { display: flex; align-items: center; gap: 7px; color: var(--ws-muted); font-size: 10px; }\n.ws-runtime { margin-left: auto; max-width: 145px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.ws-node strong { margin: 9px 0 7px; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.ws-node-id { margin-top: 3px; color: var(--ws-muted); font: 10px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.ws-io { display: grid; grid-template-columns: 36px 1fr; gap: 5px; margin-top: 5px; color: var(--ws-muted); font-size: 10px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }\n.ws-io b { color: var(--ws-text); font-weight: 600; }\n.ws-file-count { margin-top: auto; color: var(--ws-accent); font-size: 10px; }\n.ws-dot { width: 7px; height: 7px; border-radius: 50%; background: #87909f; }\n.ws-node[data-status=running] .ws-dot { background: var(--ws-accent); box-shadow: 0 0 0 4px #4d6bfe18; animation: ws-pulse 1.4s ease-in-out infinite; }\n.ws-node[data-status=completed] .ws-dot { background: #23936f; }\n.ws-node[data-status=failed] .ws-dot { background: #d04f55; }\n.ws-node[data-status=cancelled] .ws-dot, .ws-node[data-status=interrupted] .ws-dot { background: #d18a24; }\n.ws-progress { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: var(--ws-border); }\n.ws-progress-fill { display: block; height: 100%; width: 0; background: #87909f; }\n.ws-node[data-status=running] .ws-progress-fill { width: 42%; background: var(--ws-accent); animation: ws-run 1.35s ease-in-out infinite; }\n.ws-node[data-status=completed] .ws-progress-fill { width: 100%; background: #23936f; }\n.ws-node[data-status=failed] .ws-progress-fill { width: 100%; background: #d04f55; }\n.ws-node[data-status=cancelled] .ws-progress-fill, .ws-node[data-status=interrupted] .ws-progress-fill { width: 100%; background: #d18a24; }\n.ws-legend { position: absolute; right: 16px; bottom: 16px; max-width: 310px; padding: 7px 10px; border: 1px solid var(--ws-border); border-radius: 8px; color: var(--ws-muted); background: var(--ws-panel); font-size: 10px; }\n.ws-controls { position: absolute; left: 16px; bottom: 16px; display: flex; align-items: center; gap: 3px; padding: 4px; border: 1px solid var(--ws-border); border-radius: 10px; background: var(--ws-panel); box-shadow: 0 6px 20px #10182812; cursor: default; }\n.ws-controls button { border: 0; padding: 5px 9px; }\n.ws-controls span { min-width: 44px; text-align: center; color: var(--ws-muted); font-size: 11px; }\n.ws-inspector { width: 340px; flex: none; padding: 18px; background: var(--ws-panel); border-left: 1px solid var(--ws-border); overflow: auto; }\n.ws-inspector-head { display: flex; justify-content: space-between; align-items: center; }\n.ws-inspector-head h3 { margin: 0; font-size: 15px; }\n.ws-inspector-head button { border: 0; background: none; font-size: 20px; cursor: pointer; }\n.ws-inspector h4 { font-size: 16px; margin: 18px 0; }\n.ws-inspector dl { margin: 18px 0; }\n.ws-inspector dt { color: var(--ws-muted); font-size: 11px; margin-top: 12px; }\n.ws-inspector dd { margin: 4px 0 0; overflow-wrap: anywhere; }\n.ws-mono { font: 11px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; }\n.ws-preview-section { margin: 18px 0; }\n.ws-preview-section h5 { margin: 0 0 7px; font-size: 11px; color: var(--ws-muted); }\n.ws-preview-section pre { max-height: 190px; margin: 0; padding: 10px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; border: 1px solid var(--ws-border); border-radius: 8px; background: var(--ws-bg); font: 11px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; }\n.ws-artifacts { display: flex; flex-direction: column; gap: 6px; }\n.ws-artifacts button { width: 100%; padding: 7px 9px; border: 1px solid var(--ws-border); border-radius: 7px; background: var(--ws-bg); color: var(--ws-accent); text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }\n.ws-open-child { width: 100%; background: var(--ws-accent); border-color: var(--ws-accent); color: #fff; }\n.ws-child-unavailable { margin: 9px 0 0; color: #b94147; font-size: 11px; }\n.ws-hint { margin-top: 12px; color: var(--ws-muted); font-size: 11px; line-height: 1.7; }\n.ws-status { display: inline-flex; align-items: center; border-radius: 999px; padding: 2px 8px; background: var(--ws-border); color: var(--ws-muted); font-size: 10px; white-space: nowrap; }\n.ws-status-running { background: #4d6bfe14; color: var(--ws-accent); }\n.ws-status-completed { background: #23936f16; color: #238366; }\n.ws-status-failed { background: #d04f5516; color: #b94147; }\n.ws-status-cancelled, .ws-status-interrupted { background: #d18a2418; color: #a96d17; }\n.ws-export-backdrop { position: absolute; inset: 0; z-index: 10; display: grid; place-items: center; padding: 24px; background: #10182842; backdrop-filter: blur(3px); }\n.ws-export-dialog { width: min(620px, 100%); max-height: min(720px, calc(100% - 24px)); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--ws-border); border-radius: 16px; background: var(--ws-panel); box-shadow: 0 24px 80px #10182838; }\n.ws-export-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding: 20px 22px 14px; }\n.ws-export-head h3 { margin: 0; font-size: 17px; }\n.ws-export-head p { margin: 5px 0 0; color: var(--ws-muted); font-size: 11px; line-height: 1.6; }\n.ws-export-head button { border: 0; background: none; font-size: 22px; cursor: pointer; }\n.ws-export-warning { margin: 0 22px 14px; padding: 10px 12px; border-radius: 9px; background: color-mix(in srgb, #d18a24 10%, var(--ws-panel)); color: color-mix(in srgb, #a96d17 85%, var(--ws-text)); font-size: 11px; line-height: 1.55; }\n.ws-export-list { min-height: 0; padding: 0 22px; overflow: auto; }\n.ws-export-agent { display: grid; grid-template-columns: 18px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 11px 4px; border-top: 1px solid var(--ws-border); cursor: pointer; }\n.ws-export-agent-copy { min-width: 0; display: flex; flex-direction: column; }\n.ws-export-agent-copy strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }\n.ws-export-agent-copy small, .ws-export-count { color: var(--ws-muted); font-size: 10px; }\n.ws-export-count { white-space: nowrap; }\n.ws-export-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 22px 20px; border-top: 1px solid var(--ws-border); }\n.ws-export-actions button { padding: 7px 12px; border: 1px solid var(--ws-border); border-radius: 8px; background: var(--ws-panel); cursor: pointer; }\n.ws-export-actions .ws-export-confirm { border-color: var(--ws-accent); background: var(--ws-accent); color: #fff; }\n.ws-export-actions .ws-export-confirm:disabled { opacity: .45; cursor: not-allowed; }\n.ws-empty, .ws-waiting { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px; color: var(--ws-muted); }\n.ws-empty h3 { color: var(--ws-text); font-size: 20px; margin: 14px 0 6px; }\n.ws-empty p { max-width: 520px; margin: 0; line-height: 1.8; }\n.ws-empty-icon { display: grid; place-items: center; width: 58px; height: 58px; border: 1px solid var(--ws-border); border-radius: 18px; background: var(--ws-panel); color: var(--ws-accent); font-size: 28px; box-shadow: 0 8px 28px #1018280d; }\n.ws-waiting { position: absolute; inset: 0; flex-direction: row; gap: 10px; }\n.ws-spinner { width: 14px; height: 14px; border: 2px solid var(--ws-border); border-top-color: var(--ws-accent); border-radius: 50%; animation: ws-spin .8s linear infinite; }\n@keyframes ws-spin { to { transform: rotate(360deg); } }\n@keyframes ws-pulse { 50% { opacity: .45; } }\n@keyframes ws-run { 0% { margin-left: -42%; } 100% { margin-left: 100%; } }\n@media (max-width: 760px) { .ws-header { padding: 10px 12px; } .ws-heading p { display: none; } .ws-inspector { width: 280px; } .ws-actions select { max-width: 170px; } .ws-legend { display: none; } }\n@media (max-width: 560px) { .ws-inspector { position: absolute; right: 0; top: 0; bottom: 0; z-index: 4; width: min(88%, 340px); box-shadow: -12px 0 30px #1018281a; } .ws-title-row h2 { font-size: 14px; } .ws-actions select { max-width: 120px; } }\n";
/** Status vocabulary shared by run and member cards. */
const RUNNING = 'running';

function stopStatus(reason) {
  if (reason === 'completed') return 'completed';
  if (reason === 'cancelled') return 'cancelled';
  return 'failed';
}

function memberStatus(outcome) {
  if (outcome === 'completed') return 'completed';
  if (outcome === 'cancelled') return 'cancelled';
  return 'failed';
}

function abandoned(location) {
  const reason = location?.turn?.end?.data?.reason?.kind;
  return reason === 'interrupted' || reason === 'forked';
}

/** Group observed members by their exact phase label, preserving first-seen order. */
function workflowPhases(members) {
  const phases = new Map();
  for (const member of members) {
    const phase = member.phase === undefined ? null : member.phase;
    const key = phase === null ? 'missing' : `value:${phase.length}:${phase}`;
    let group = phases.get(key);
    if (!group) {
      group = { key, phase, members: [] };
      phases.set(key, group);
    }
    group.members.push(member);
  }
  return [...phases.values()];
}

function projectedRun(context) {
  const state = context.state;
  const interrupted = state.status === RUNNING && abandoned(context.start?.location);
  const members = state.members.map(member => member.status === RUNNING && interrupted
    ? { ...member, status: 'interrupted' }
    : member);
  return {
    runId: state.runId,
    name: state.name,
    status: interrupted ? 'interrupted' : state.status,
    members,
    phases: workflowPhases(members),
  };
}

/** Replayable projection of the official tool-workflow event family. */
const studioDefinition = {
  kind: 'workflow-studio-run',
  target: 'workflow-studio',
  match(event) {
    if (event.type === 'tool-workflow/run-start') return { id: String(event.data.runId), role: 'start' };
    if (event.type === 'tool-workflow/agent-start'
      || event.type === 'tool-workflow/agent-end'
      || event.type === 'tool-workflow/run-end') {
      return { id: String(event.data.runId), role: 'update' };
    }
    return null;
  },
  start(_context, match) {
    if (match.event.type !== 'tool-workflow/run-start') throw new Error('workflow-studio run requires run-start');
    return {
      runId: String(match.event.data.runId),
      name: match.event.data.name,
      status: RUNNING,
      members: [],
    };
  },
  update(context, match) {
    const state = context.state;
    const event = match.event;
    if (event.type === 'tool-workflow/agent-start') {
      return {
        ...state,
        members: [...state.members, {
          seq: event.data.seq,
          label: event.data.label,
          ...(event.data.phase === undefined ? {} : { phase: event.data.phase }),
          childId: event.data.childId,
          status: RUNNING,
        }],
      };
    }
    if (event.type === 'tool-workflow/agent-end') {
      return {
        ...state,
        members: state.members.map(member => member.seq === event.data.seq
          ? { ...member, status: memberStatus(event.data.outcome) }
          : member),
      };
    }
    if (event.type === 'tool-workflow/run-end') return { ...state, status: stopStatus(event.data.stopReason) };
    return state;
  },
  buildViewNode(context) {
    if (!context.start) return null;
    return {
      key: context.key,
      kind: 'workflow-studio-run',
      id: context.id,
      target: 'workflow-studio',
      anchorSeq: context.start.event.seq,
      location: context.start.location,
      visibility: 'visible',
      data: projectedRun(context),
    };
  },
};

const EMPTY_STUDIO_SNAPSHOT = Object.freeze({ runs: [] });

/** Incremental target builder for workflow runs. */
function createStudioBuilder() {
  const nodes = new Map();
  const snapshot = () => ({
    runs: [...nodes.values()]
      .sort((left, right) => left.anchorSeq - right.anchorSeq)
      .map(node => node.data),
  });
  return {
    empty: EMPTY_STUDIO_SNAPSHOT,
    replace({ nodes: rows }) {
      nodes.clear();
      for (const row of rows) nodes.set(row.key, row);
      return snapshot();
    },
    apply({ upserts }) {
      for (const row of upserts) nodes.set(row.key, row);
      return snapshot();
    },
  };
}

const zh = {
  tab: '工作流',
  title: '工作流画布',
  empty: '当前对话还没有工作流',
  emptyHelp: '当 DeepSeek Harness 在本次对话中调用 workflow 工具后，阶段与 Agent 会在这里实时出现。',
  waiting: '等待 Agent 启动',
  phase: '阶段',
  unassigned: '未分组',
  unnamed: '未命名 Agent',
  members: 'Agent',
  latest: '最新运行',
  fit: '适应画布',
  export: '导出清单',
  runSummary: '运行概览',
  exportTitle: '导出本次 Workflow',
  exportHelp: '选择要写入 manifest 的 Agent。输入、输出、运行模型与候选文件路径会被保留。',
  exportBoundary: '此版本只下载清单，不复制工作区文件，也不会推断 Agent 依赖或最终产物。',
  cancelExport: '取消',
  downloadManifest: '下载 manifest',
  zoomIn: '放大',
  zoomOut: '缩小',
  details: 'Agent 详情',
  orchestrator: '当前会话 Agent',
  orchestratorRole: '编排 Agent · workflow 调用方',
  orchestratorHelp: '由主 Agent 生成编排脚本，Workflow Runtime 负责执行并派生子 Agent。',
  subagent: 'Subagent',
  runtime: '运行模型',
  relation: '连线表示原生父子执行关系，不表示未记录的 Agent 间依赖',
  input: '输入',
  output: '输出',
  loadingInput: '正在读取子会话输入…',
  previewLimited: '大型工作流仅加载前 64 个子会话的内容预览；双击可打开此子会话。',
  generating: '生成中…',
  noOutput: '暂无文本输出',
  artifacts: '文件产物',
  noArtifacts: '当前子会话没有记录到成功的文件写入或编辑。',
  filesCount: '{count} 个文件产物',
  childSession: '子会话',
  openChild: '打开子会话',
  childUnavailable: '子会话当前不可用',
  close: '关闭',
  running: '运行中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
  interrupted: '已中断',
  phaseHint: '阶段表示 Harness 报告的进度分组，不代表未记录的严格依赖关系。',
  live: '事件会随对话与 workflow 执行实时更新',
};

const en = {
  tab: 'Workflow',
  title: 'Workflow canvas',
  empty: 'No workflow in this conversation yet',
  emptyHelp: 'Phases and agents appear here live when DeepSeek Harness invokes the workflow tool in this conversation.',
  waiting: 'Waiting for agents',
  phase: 'Phase',
  unassigned: 'Unassigned',
  unnamed: 'Unnamed agent',
  members: 'agents',
  latest: 'Latest run',
  fit: 'Fit canvas',
  export: 'Export manifest',
  runSummary: 'Run summary',
  exportTitle: 'Export this workflow',
  exportHelp: 'Choose the agents to include. Inputs, outputs, runtime metadata, and candidate file paths are preserved.',
  exportBoundary: 'This version downloads a manifest only. It does not copy workspace files or infer agent dependencies or final artifacts.',
  cancelExport: 'Cancel',
  downloadManifest: 'Download manifest',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  details: 'Agent details',
  orchestrator: 'Current session agent',
  orchestratorRole: 'Orchestrating agent · workflow caller',
  orchestratorHelp: 'The main agent authors the orchestration script; Workflow Runtime executes it and starts subagents.',
  subagent: 'Subagent',
  runtime: 'Runtime model',
  relation: 'Lines show native parent-child execution, not unrecorded dependencies between agents',
  input: 'Input',
  output: 'Output',
  loadingInput: 'Loading child input…',
  previewLimited: 'Large workflows load content previews for the first 64 children; double-click to open this session.',
  generating: 'Generating…',
  noOutput: 'No text output yet',
  artifacts: 'File artifacts',
  noArtifacts: 'No successful file write or edit is recorded in this child session.',
  filesCount: '{count} file artifacts',
  childSession: 'Child session',
  openChild: 'Open child session',
  childUnavailable: 'Child session is currently unavailable',
  close: 'Close',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  interrupted: 'Interrupted',
  phaseHint: 'Phases are progress groups reported by Harness, not unrecorded strict dependencies.',
  live: 'Updates live with the conversation and workflow execution',
};

/** Place phases in columns and concurrently observed members in rows. */
function layoutFor(run) {
  const positions = new Map();
  run.phases.forEach((phase, column) => {
    phase.members.forEach((member, row) => {
      positions.set(member.seq, { x: 430 + column * 360, y: 116 + row * 196 });
    });
  });
  return positions;
}

/** The calling Agent is the durable parent of every workflow child. */
function orchestratorPosition(run) {
  const rows = Math.max(1, ...run.phases.map(phase => phase.members.length));
  return { x: 48, y: 116 + (rows - 1) * 98 };
}

const EMPTY = Object.freeze({ input: '', output: '', files: [], provider: '', model: '' });

function contentText(content) {
  if (!Array.isArray(content)) return '';
  return content.map((block) => {
    if (block?.type === 'text' && typeof block.text === 'string') return block.text;
    if (block?.type === 'file') return `[file] ${block.name ?? block.path ?? ''}`.trim();
    if (block?.type === 'image') return '[image]';
    return '';
  }).filter(Boolean).join('\n').trim();
}

function mutationPath(name, raw) {
  let args;
  try { args = JSON.parse(raw); } catch { return null; }
  if (!args || typeof args !== 'object' || Array.isArray(args)) return null;
  if (name === 'write' || name === 'edit') return typeof args.file_path === 'string' ? args.file_path : null;
  if (name === 'str_replace_editor') return typeof args.path === 'string' ? args.path : null;
  return null;
}

/** Extract browser-safe input, output, model, and produced-file facts from one child Session window. */
function childPreview(entries) {
  const calls = new Map();
  const files = [];
  let input = '';
  let contextualInput = '';
  let output = '';
  let provider = '';
  let model = '';
  for (const entry of entries ?? []) {
    if (entry?.type !== 'event') continue;
    const event = entry.event;
    if (event.type === 'user/message') {
      const text = contentText(event.data?.content);
      if (event.data?.source?.kind === 'user') input = text;
      else if (!contextualInput) contextualInput = text;
    }
    if (event.type === 'assistant/message') output = contentText(event.data?.message?.content);
    if (event.type === 'request/header') {
      const config = event.data?.header?.config;
      if (typeof config?.provider === 'string') provider = config.provider;
      if (typeof config?.model === 'string') model = config.model;
    }
    if (event.type === 'tool/call') {
      const path = mutationPath(event.data?.name, event.data?.arguments);
      if (path) calls.set(String(event.data.callId), path);
    }
    if (event.type === 'tool/result' && event.data?.message?.isError !== true) {
      const callId = String(event.data?.message?.source?.callId ?? '');
      const argumentPath = calls.get(callId);
      if (!argumentPath) continue;
      calls.delete(callId);
      const path = typeof event.data?.meta?.path === 'string' ? event.data.meta.path : argumentPath;
      if (path && !files.includes(path)) files.push(path);
    }
  }
  return { ...EMPTY, input: input || contextualInput, output, files, provider, model };
}

const EMPTY_CHILD_PREVIEW = EMPTY;

/** Classification only; contents continue through DSH's bounded resource preview. */
function artifactKind(path) {
  const ext = String(path).split(/[?#]/, 1)[0].split('.').at(-1).toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext)) return 'image';
  if (['json', 'jsonl'].includes(ext)) return 'json';
  if (['diff', 'patch'].includes(ext)) return 'diff';
  if (['md', 'txt', 'csv', 'tsv', 'yaml', 'yml', 'toml', 'xml', 'html', 'js', 'ts', 'py', 'css'].includes(ext)) return 'text';
  return 'file';
}

function stringValue(value) {
  return typeof value === 'string' ? value : '';
}

function uniqueFiles(files) {
  return [...new Set(Array.isArray(files) ? files.filter(file => typeof file === 'string' && file) : [])];
}

/** Build a deterministic, downstream-only export manifest from persisted Workflow facts. */
function buildExportManifest(run, previews, orchestrator, includedSeqs) {
  if (!run) return null;
  const included = includedSeqs ? new Set(includedSeqs) : null;
  return {
    schema: 'revolution.workflow-export/v1',
    run: {
      id: stringValue(run.runId),
      name: stringValue(run.name),
      status: stringValue(run.status),
      phases: (run.phases ?? []).map(phase => ({
        key: stringValue(phase.key),
        name: phase.phase === null || phase.phase === undefined ? null : String(phase.phase),
      })),
    },
    orchestrator: {
      id: stringValue(orchestrator?.id),
      title: stringValue(orchestrator?.title),
    },
    agents: (run.members ?? []).filter(member => !included || included.has(member.seq)).map(member => {
      const preview = previews?.[member.childId] ?? {};
      return {
        seq: member.seq,
        childSessionId: stringValue(member.childId),
        label: stringValue(member.label),
        phase: member.phase === null || member.phase === undefined ? null : String(member.phase),
        status: stringValue(member.status),
        runtime: { provider: stringValue(preview.provider), model: stringValue(preview.model) },
        input: stringValue(preview.input),
        output: stringValue(preview.output),
        candidateFiles: uniqueFiles(preview.files),
        previewLimited: Boolean(preview.limited),
        previewUnavailable: Boolean(preview.unavailable),
      };
    }),
    semantics: {
      relations: 'orchestrator-to-child execution only',
      agentDependenciesInferred: false,
      filesCopied: false,
      finalArtifactsInferred: false,
    },
  };
}

function exportFileName(runId) {
  const safe = String(runId || 'workflow').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return `workflow-${safe || 'workflow'}.json`;
}


const h = (...args) => React.createElement(...args);
const { useEffect, useMemo, useRef, useState } = React;

function statusText(status, t) {
  return t(status in { running: 1, completed: 1, failed: 1, cancelled: 1, interrupted: 1 } ? status : 'interrupted');
}

function phaseName(phase, t) {
  return phase === null || phase === '' ? t('unassigned') : phase;
}

function compact(text, fallback, limit = 92) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!value) return fallback;
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

/** Dedicated Workflow view driven by durable workflow and child Session facts. */
function StudioView(props) {
  const snapshot = props.useWorkflowStudio(value => value);
  const runs = snapshot.runs;
  const [requestedRun, setRequestedRun] = useState(null);
  const run = runs.find(candidate => candidate.runId === requestedRun) ?? runs.at(-1);
  const [selectedSeq, setSelectedSeq] = useState(null);
  const selected = run?.members.find(member => member.seq === selectedSeq) ?? null;
  const [previews, setPreviews] = useState({});
  const selectedPreview = selected ? previews[selected.childId] : null;
  const [unavailableChild, setUnavailableChild] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportSelection, setExportSelection] = useState({});
  const [offset, setOffset] = useState({ x: 28, y: 28, scale: 1 });
  const viewport = useRef(null);
  const gesture = useRef(null);
  const previousRun = useRef(null);
  const exportDialog = useRef(null);
  const exportTrigger = useRef(null);
  const positions = useMemo(() => run ? layoutFor(run) : new Map(), [run]);
  const rootPosition = useMemo(() => run ? orchestratorPosition(run) : { x: 48, y: 116 }, [run]);
  const childKey = run?.members.map(member => member.childId).join('\u0000') ?? '';

  useEffect(() => {
    setPreviews({});
    setExportOpen(false);
    if (!run) return undefined;
    return props.watchChildren(run.members.map(member => member.childId), setPreviews);
  }, [run?.runId, childKey]);

  useEffect(() => {
    if (!exportOpen) return undefined;
    const previousFocus = document.activeElement;
    exportDialog.current?.querySelector('button, input')?.focus();
    return () => previousFocus?.focus();
  }, [exportOpen]);

  function exportKeyDown(event) {
    if (event.key === 'Escape') { event.stopPropagation(); setExportOpen(false); }
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
    const first = controls[0]; const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  function fit() {
    if (!run || !viewport.current || run.members.length === 0) {
      setOffset({ x: 28, y: 28, scale: 1 });
      return;
    }
    const points = [rootPosition, ...positions.values()];
    const left = Math.min(...points.map(point => point.x));
    const top = 24;
    const right = Math.max(...points.map(point => point.x + 280));
    const bottom = Math.max(...points.map(point => point.y + 172));
    const width = right - left;
    const height = bottom - top;
    const availableWidth = viewport.current.clientWidth - 64;
    const availableHeight = viewport.current.clientHeight - 64;
    const scale = Math.min(1, Math.max(0.28, Math.min(availableWidth / width, availableHeight / height)));
    setOffset({
      x: (viewport.current.clientWidth - width * scale) / 2 - left * scale,
      y: Math.max(24, (viewport.current.clientHeight - height * scale) / 2) - top * scale,
      scale,
    });
  }

  useEffect(() => {
    if (!run || previousRun.current === run.runId) return;
    previousRun.current = run.runId;
    setSelectedSeq(null);
    setUnavailableChild(false);
    fit();
  }, [run?.runId]);

  function beginPan(event) {
    if (event.button !== 0 || event.target.closest('button,select')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { x: event.clientX, y: event.clientY, start: offset };
  }

  function movePan(event) {
    const current = gesture.current;
    if (!current) return;
    setOffset({ ...current.start, x: current.start.x + event.clientX - current.x, y: current.start.y + event.clientY - current.y });
  }

  function wheel(event) {
    event.preventDefault();
    if (!event.ctrlKey && !event.metaKey) {
      setOffset(current => ({ ...current, x: current.x - event.deltaX, y: current.y - event.deltaY }));
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    setOffset(current => {
      const scale = Math.max(0.28, Math.min(1.8, current.scale * Math.exp(-event.deltaY / 500)));
      return { scale, x: pointerX - (pointerX - current.x) * scale / current.scale, y: pointerY - (pointerY - current.y) * scale / current.scale };
    });
  }

  function openSelected() {
    if (selected) setUnavailableChild(!props.openChild(selected.childId));
  }

  function openExport() {
    setExportSelection(Object.fromEntries((run?.members ?? []).map(member => [member.seq, true])));
    setExportOpen(true);
  }

  function confirmExport() {
    const includedSeqs = (run?.members ?? []).filter(member => exportSelection[member.seq]).map(member => member.seq);
    const manifest = buildExportManifest(run, previews, props.orchestrator, includedSeqs);
    if (manifest) props.downloadManifest(run.runId, manifest);
    setExportOpen(false);
  }

  const t = props.t;
  return h('section', { className: 'ws-root', 'data-workflow-studio': true },
    h('header', { className: 'ws-header' },
      h('div', { className: 'ws-heading' },
        h('div', { className: 'ws-title-row' },
          h('h2', null, run?.name || t('title')),
          run && h('span', { className: `ws-status ws-status-${run.status}` }, statusText(run.status, t))),
        h('p', null, t('live'))),
      h('div', { className: 'ws-actions' },
        runs.length > 1 && h('select', {
          value: run?.runId ?? '', 'aria-label': t('latest'), onChange: event => setRequestedRun(event.target.value),
        }, runs.map((candidate, index) => h('option', { key: candidate.runId, value: candidate.runId },
          `${index + 1}. ${candidate.name} · ${statusText(candidate.status, t)}`))),
        run && h('button', { type: 'button', ref: exportTrigger, onClick: openExport }, t('export')),
        h('button', { type: 'button', onClick: fit }, t('fit')))),
    !run
      ? h('div', { className: 'ws-empty' },
          h('div', { className: 'ws-empty-icon', 'aria-hidden': true }, '⌘'),
          h('h3', null, t('empty')),
          h('p', null, t('emptyHelp')))
      : h('div', { className: 'ws-content' },
          h('div', {
            className: 'ws-canvas', ref: viewport, tabIndex: 0, onWheel: wheel,
            onPointerDown: beginPan, onPointerMove: movePan,
            onPointerUp: () => { gesture.current = null; }, onPointerCancel: () => { gesture.current = null; },
          },
            run.members.length === 0
              ? h('div', { className: 'ws-waiting' }, h('span', { className: 'ws-spinner' }), t('waiting'))
              : h('div', { className: 'ws-world', style: { transform: `translate(${offset.x}px, ${offset.y}px) scale(${offset.scale})` } },
                  h('svg', { className: 'ws-phase-links', width: 1, height: 1, 'aria-label': t('relation') },
                    h('defs', null, h('marker', { id: 'ws-arrow', markerWidth: 8, markerHeight: 8, refX: 7, refY: 4, orient: 'auto' },
                      h('path', { d: 'M0,0 L8,4 L0,8 Z', className: 'ws-arrow-head' }))),
                    run.members.map(member => {
                      const position = positions.get(member.seq);
                      const x1 = rootPosition.x + 280;
                      const y1 = rootPosition.y + 78;
                      const x2 = position.x;
                      const y2 = position.y + 78;
                      return h('path', { key: member.seq, className: 'ws-agent-link', markerEnd: 'url(#ws-arrow)',
                        d: `M ${x1} ${y1} C ${x1 + 54} ${y1}, ${x2 - 54} ${y2}, ${x2} ${y2}` });
                    })),
                  h('div', { className: 'ws-root-node', style: { left: rootPosition.x, top: rootPosition.y } },
                    h('span', { className: 'ws-node-kicker' }, t('orchestratorRole')),
                    h('strong', null, props.orchestrator.title),
                    h('span', { className: 'ws-node-id' }, props.orchestrator.id),
                    h('p', null, t('orchestratorHelp'))),
                  run.phases.map((phase, index) => h('div', { key: phase.key, className: 'ws-phase-label', style: { left: 430 + index * 360, top: 30 } },
                    h('span', { className: 'ws-phase-index' }, index + 1),
                    h('span', null, phaseName(phase.phase, t)),
                    h('small', null, `${phase.members.length} ${t('members')}`))),
                  run.members.map(member => {
                    const position = positions.get(member.seq);
                    const preview = previews[member.childId];
                    const runtime = [preview?.provider, preview?.model].filter(Boolean).join(' · ') || t('subagent');
                    const inputFallback = preview?.limited ? t('previewLimited') : t('loadingInput');
                    return h('button', {
                      type: 'button', key: member.seq,
                      className: `ws-node ${selected?.seq === member.seq ? 'ws-node-selected' : ''}`,
                      'data-status': member.status, style: { left: position.x, top: position.y },
                      onClick: event => { event.stopPropagation(); setSelectedSeq(member.seq); setUnavailableChild(false); },
                      onDoubleClick: event => { event.stopPropagation(); setUnavailableChild(!props.openChild(member.childId)); },
                    },
                      h('span', { className: 'ws-node-top' },
                        h('span', { className: 'ws-dot' }), h('span', null, statusText(member.status, t)),
                        h('span', { className: 'ws-runtime' }, runtime)),
                      h('strong', null, member.label || t('unnamed')),
                      h('span', { className: 'ws-io' }, h('b', null, t('input')), compact(preview?.input, inputFallback)),
                      h('span', { className: 'ws-io' }, h('b', null, t('output')), compact(preview?.output, member.status === 'running' ? t('generating') : t('noOutput'))),
                      preview?.files?.length > 0 && h('span', { className: 'ws-file-count' }, t('filesCount', { count: preview.files.length })),
                      h('span', { className: 'ws-progress' }, h('span', { className: 'ws-progress-fill' })));
                  })),
            h('div', { className: 'ws-run-summary', 'aria-label': t('runSummary') },
              h('span', null, `${run.members.length} ${t('members')}`),
              h('span', null, `${run.members.filter(member => member.status === 'completed').length} ${t('completed')}`),
              h('span', null, `${run.members.filter(member => member.status === 'failed').length} ${t('failed')}`),
              h('span', null, t('filesCount', { count: new Set(Object.values(previews).flatMap(preview => preview.files ?? [])).size }))),
            h('div', { className: 'ws-legend' }, t('relation')),
            h('div', { className: 'ws-controls' },
              h('button', { type: 'button', 'aria-label': t('zoomOut'), onClick: () => setOffset(value => ({ ...value, scale: Math.max(0.28, value.scale - 0.1) })) }, '−'),
              h('span', null, `${Math.round(offset.scale * 100)}%`),
              h('button', { type: 'button', 'aria-label': t('zoomIn'), onClick: () => setOffset(value => ({ ...value, scale: Math.min(1.8, value.scale + 0.1) })) }, '+'))),
          selected && h('aside', { className: 'ws-inspector' },
            h('div', { className: 'ws-inspector-head' },
              h('h3', null, t('details')),
              h('button', { type: 'button', onClick: () => { setSelectedSeq(null); setUnavailableChild(false); }, 'aria-label': t('close') }, '×')),
            h('span', { className: `ws-status ws-status-${selected.status}` }, statusText(selected.status, t)),
            h('h4', null, selected.label || t('unnamed')),
            h('dl', null,
              h('dt', null, t('phase')), h('dd', null, phaseName(selected.phase ?? null, t)),
              h('dt', null, t('runtime')), h('dd', null, [selectedPreview?.provider, selectedPreview?.model].filter(Boolean).join(' · ') || t('subagent')),
              h('dt', null, t('childSession')), h('dd', { className: 'ws-mono' }, selected.childId)),
            h('section', { className: 'ws-preview-section' }, h('h5', null, t('input')),
              h('pre', null, selectedPreview?.input || (selectedPreview?.limited ? t('previewLimited') : t('loadingInput')))),
            h('section', { className: 'ws-preview-section' }, h('h5', null, t('output')),
              h('pre', null, selectedPreview?.output || (selected.status === 'running' ? t('generating') : t('noOutput')))),
            h('section', { className: 'ws-preview-section' },
              h('h5', null, t('artifacts')),
              selectedPreview?.files?.length
                ? h('div', { className: 'ws-artifacts' }, selectedPreview.files.map(path => h('button', {
                    type: 'button', key: path, title: path, onClick: () => props.openFile(selected.childId, path),
                  }, h('span', { className: 'ws-artifact-kind' }, artifactKind(path).toUpperCase()), path)))
                : h('p', { className: 'ws-hint' }, t('noArtifacts'))),
            h('button', { type: 'button', className: 'ws-open-child', onClick: openSelected }, t('openChild')),
            unavailableChild && h('p', { className: 'ws-child-unavailable', role: 'status' }, t('childUnavailable')),
            h('p', { className: 'ws-hint' }, t('phaseHint')))),
          run && exportOpen && h('div', { className: 'ws-export-backdrop', role: 'presentation', onMouseDown: event => {
            if (event.target === event.currentTarget) setExportOpen(false);
          } }, h('section', { className: 'ws-export-dialog', ref: exportDialog, role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'ws-export-title', onKeyDown: exportKeyDown },
            h('div', { className: 'ws-export-head' },
              h('div', null, h('h3', { id: 'ws-export-title' }, t('exportTitle')), h('p', null, t('exportHelp'))),
              h('button', { type: 'button', onClick: () => setExportOpen(false), 'aria-label': t('close') }, '×')),
            h('div', { className: 'ws-export-warning' }, t('exportBoundary')),
            h('div', { className: 'ws-export-list' }, run.members.map(member => {
              const preview = previews[member.childId];
              return h('label', { key: member.seq, className: 'ws-export-agent' },
                h('input', { type: 'checkbox', checked: Boolean(exportSelection[member.seq]), onChange: event => setExportSelection(current => ({ ...current, [member.seq]: event.target.checked })) }),
                h('span', { className: 'ws-export-agent-copy' },
                  h('strong', null, member.label || t('unnamed')),
                  h('small', null, `${phaseName(member.phase ?? null, t)} · ${[preview?.provider, preview?.model].filter(Boolean).join(' · ') || t('subagent')}`)),
                h('span', { className: 'ws-export-count' }, t('filesCount', { count: preview?.files?.length ?? 0 })));
            })),
            h('div', { className: 'ws-export-actions' },
              h('button', { type: 'button', onClick: () => setExportOpen(false) }, t('cancelExport')),
              h('button', { type: 'button', className: 'ws-export-confirm', disabled: !run.members.some(member => exportSelection[member.seq]), onClick: confirmExport }, t('downloadManifest'))))));
}


const clientInject = ['slots', 'sessions', 'uiConversation', 'uiWorkspace', 'sidebarRight', 'locale'];

function sessionFileAddress(sessionId, path) {
  const encodedId = encodeURIComponent(sessionId);
  const encodedPath = path.replace(/\\/g, '/').replace(/^(?:\.\/)+/, '')
    .split('/').map(segment => encodeURIComponent(segment).replace(/%3A/gi, ':')).join('/');
  return `dsh-resource://file/session/${encodedId}/${encodedPath}`;
}

function watchChildren(ctx, parentSessionId, childIds, publish) {
  const previews = {};
  const releases = [];
  let disposed = false;
  const update = (childId, value) => {
    if (disposed) return;
    previews[childId] = value;
    publish({ ...previews });
  };
  for (const childId of childIds.slice(64)) update(childId, { ...EMPTY_CHILD_PREVIEW, limited: true });
  for (const childId of childIds.slice(0, 64)) {
    const address = ctx.sessions.subagentAddress(childId);
    if (!address || address.parentSessionId !== parentSessionId) {
      update(childId, { ...EMPTY_CHILD_PREVIEW, unavailable: true });
      continue;
    }
    const reference = ctx.sessions.retain(address, { source: 'controllerOperation' });
    let unsubscribe = () => {};
    releases.push(() => { unsubscribe(); reference.release(); });
    reference.ready.then((binding) => {
      if (disposed) return;
      const emit = () => update(childId, childPreview(binding.eventSource.getSnapshot().entries));
      unsubscribe = binding.eventSource.subscribe(emit);
      emit();
    }).catch(() => update(childId, { ...EMPTY_CHILD_PREVIEW, unavailable: true }));
  }
  return () => {
    disposed = true;
    for (const release of releases) release();
  };
}

/** Register the Workflow view between Chat and Trajectory. */
function applyClient(ctx) {
  ctx.effect(() => {
    const style = document.createElement('style');
    style.dataset.workflowStudio = 'true';
    style.textContent = STUDIO_CSS;
    document.head.appendChild(style);
    return () => style.remove();
  });
  ctx.effect(() => ctx.locale.register('workflowStudio', { zh, en }));
  const t = ctx.locale.bind('workflowStudio');
  ctx.uiConversation.events.register(studioDefinition);
  ctx.uiConversation.views.register({
    target: 'workflow-studio',
    create: createStudioBuilder,
    isActive: snapshot => snapshot.runs.length > 0,
  });
  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'workflow-studio',
    order: 5,
    locale: 'workflowStudio',
    label: () => t('tab'),
    inject: (sessionId) => {
      const binding = ctx.sessions.binding(sessionId);
      if (!binding) throw new Error(`Workflow Studio: session "${sessionId}" is unavailable`);
      const target = ctx.uiConversation.binding(binding).target('workflow-studio');
      const summary = ctx.sessions.list.getSnapshot().byId[sessionId];
      return {
        hooks: {
          workflowStudio: {
            getSnapshot: () => target.getSnapshot() ?? EMPTY_STUDIO_SNAPSHOT,
            subscribe: listener => target.subscribe(listener),
          },
        },
        orchestrator: {
          id: sessionId,
          title: summary?.projectionValues?.title || t('orchestrator'),
        },
        watchChildren: (childIds, publish) => watchChildren(ctx, sessionId, childIds, publish),
        openChild: (childId) => {
          const address = ctx.sessions.subagentAddress(childId);
          if (!address || address.parentSessionId !== sessionId) return false;
          ctx.uiWorkspace.openSession(address);
          return true;
        },
        openFile: (childId, path) => {
          ctx.sidebarRight.openResource(sessionFileAddress(childId, path));
        },
        downloadManifest: (runId, manifest) => {
          const payload = JSON.stringify({ ...manifest, exportedAt: new Date().toISOString() }, null, 2);
          const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = exportFileName(runId);
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          URL.revokeObjectURL(url);
        },
      };
    },
  }, StudioView));
}

return {apply:applyClient,inject:clientInject};
}});
