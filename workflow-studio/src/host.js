import { validatePlan, PLAN_KIND, RUN_KIND } from './graph.js';
import { runGraph } from './runner.js';

export const name = 'workflow-studio';
export const inject = ['tools', 'subagents', 'skills', 'systemPrompt'];
const textOutput = {
  schema: { type: 'string' },
  render: (_args, value) => [{ type: 'text', text: value }],
  presentationMeta: (_args, value) => JSON.parse(value),
};
const planParameter = { type: 'object', additionalProperties: false, properties: { plan: { type: 'string', description: 'JSON workflow: {version:1,id,revision,title,input,nodes:[{id,label,role,task,skills:string[],tools:string[],output}],edges:[{from,to}]}. tools is an exact allowlist; [] means no tools. Use catalog names, not guessed names.' } }, required: ['plan'] };
const forbiddenDelegation = new Set(['workflow_studio_run', 'workflow', 'subagent', 'spawn_agent', 'fork_agent']);

/** Parse a GitHub issue or pull-request URL into its API path parts. */
export function parseGithubUrl(url) {
  const match = /github\.com\/([^/]+)\/([^/]+)\/(issues|pull)\/(\d+)/.exec(String(url ?? ''));
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, ''), kind: match[3], number: match[4] };
}

/** Turn a source text into a platform-development project brief for the workflow initial input. */
export function platformBrief(text, label) {
  return [
    `# 工作流初始输入（${label}）`,
    `\n${text}`,
    '\n## 平台/产品目标',
    '\n## 涉及模块与服务边界',
    '\n## 关键接口与数据',
    '\n## 验收标准',
    '\n## 待澄清问题',
  ].join('\n');
}

/** Register native tools; the bundle's browser half contributes the canvas view. */
export function apply(ctx, config = {}) {
  const { provider = 'spawn', maxParallel = 3, maxNodes = 24 } = config;
  if (typeof provider !== 'string' || !provider || !Number.isSafeInteger(maxParallel) || maxParallel < 1 || maxParallel > 16 || !Number.isSafeInteger(maxNodes) || maxNodes < 1 || maxNodes > 100) throw new Error('workflow-studio: invalid provider/maxParallel/maxNodes configuration');
  ctx.systemPrompt.section({
    name: 'workflow-studio:canvas-first',
    order: ctx.systemPrompt.getSectionOrder('TOOL_WORKFLOW'),
    text: 'Workflow Studio is the active agent workflow interface. For a work request, discover real capabilities with workflow_studio_catalog and immediately publish a minimal useful DAG with workflow_studio_plan before doing substantive work or writing a long proposal. Do not ask whether to create an agent workflow. If requirements are incomplete, publish a clarification agent node first and refine the graph as the conversation proceeds. Keep the canvas current by publishing revisions. When the user requests implementation or execution, publishing the graph is part of that request: proceed with workflow_studio_run without an extra plan-approval round. For requests limited to planning, publish without running. Respect normal tool permissions and ask before actions outside the user request. This policy applies to the orchestrator with workflow_studio_plan available; worker agents perform only their assigned node task.',
  });
  const active = new Set();
  const childObservers = new Map();
  ctx.on('tools/result', (exec, result) => {
    const observe = childObservers.get(exec.agent?.id);
    if (observe) observe({ name: exec.name, callId: exec.callId, isError: result.isError === true, arguments: JSON.stringify(exec.arguments).slice(0, 8000), content: (result.content ?? []).filter(b => b.type === 'text').map(b => b.text).join('\n').slice(0, 12000), summaryOnly: true });
  });
  ctx.effect(() => () => {
    for (const run of active) run.controller.abort(new Error('Workflow Studio unloaded'));
    return Promise.allSettled([...active].map(run => run.done));
  });
  async function catalog(exec) {
    if (!exec.agent) throw new Error('Workflow Studio requires an agent session');
    const directory = ctx.get('workingDirectory');
    const cwd = directory ? await directory.ensure(exec.agent, exec.signal) : exec.agent.session.header.cwd;
    const lookup = { cwd, scope: exec.agent, signal: exec.signal };
    const skills = (await ctx.skills.list(lookup) ?? []).filter(s => s.invocation?.modelInvocable !== false);
    const tools = (ctx.tools.schemas(exec.agent) ?? []).map(t => t.name).filter(n => !forbiddenDelegation.has(n));
    const providers = ctx.subagents.list() ?? [];
    if (!providers.length) throw new Error('Workflow Studio: no subagent providers are available in this profile');
    return { lookup, skills, tools, providers };
  }
  async function prepare(args, exec, loadBodies) {
    if (!args || typeof args.plan !== 'string') throw new Error('plan must be a JSON string');
    const plan = validatePlan(JSON.parse(args.plan), maxNodes);
    const available = await catalog(exec);
    if (!available.providers.includes(provider)) throw new Error(`Missing subagent provider: ${provider}`);
    const skillsByNode = Object.create(null);
    for (const node of plan.nodes) {
      for (const tool of node.tools) if (!available.tools.includes(tool)) throw new Error(`${node.label}: unavailable or disallowed tool: ${tool}`);
      skillsByNode[node.id] = [];
      for (const name of node.skills) {
        if (!available.skills.some(s => s.name === name)) throw new Error(`${node.label}: unavailable skill: ${name}`);
        if (loadBodies) {
          const skill = await ctx.skills.get(name, available.lookup);
          if (!skill || skill.invocation?.modelInvocable === false) throw new Error(`Skill no longer available: ${name}`);
          skillsByNode[node.id].push(skill);
        }
      }
    }
    return { plan, skillsByNode };
  }
  ctx.tools.register({
    name: 'workflow_studio_catalog', description: 'List real skill and tool names available for composing Workflow Studio agent nodes. Call before creating a plan; never invent installed integrations.',
    parameters: { type: 'object', properties: {}, additionalProperties: false }, output: { ...textOutput, presentationMeta: undefined },
    async execute(_args, exec) { const c = await catalog(exec); return JSON.stringify({ skills: c.skills.map(s => ({ name: s.name, description: s.description })), tools: c.tools, providers: c.providers }); },
  });
  ctx.tools.register({
    name: 'workflow_studio_plan', description: 'Validate and publish an editable DAG plan to the Workflow canvas, without executing it. Compose agents from roles, actual skills and exact tool allowlists. Increment revision when editing an existing graph. Publish early during the conversation, before substantive work; refine the graph incrementally. Do not ask whether to create a workflow. Discover capabilities with workflow_studio_catalog first.',
    parameters: planParameter, output: textOutput,
    async execute(args, exec) { const { plan } = await prepare(args, exec, false); return JSON.stringify({ kind: PLAN_KIND, plan }); },
    presentCall: () => ({ card: 'generic', title: 'Workflow Studio · Plan' }),
  });
  ctx.tools.register({
    name: 'workflow_studio_edit', description: 'Patch one node of an existing Workflow Studio plan (task, role, expected output, skills, or tools), bump the revision, and republish it to the canvas without executing. Use after the user refines a single agent through node-level chat; re-run afterwards to propagate the change downstream.',
    parameters: { type: 'object', additionalProperties: false, properties: { plan: { type: 'string', description: 'Current plan JSON exactly as last published.' }, nodeId: { type: 'string' }, task: { type: 'string' }, role: { type: 'string' }, output: { type: 'string' }, skills: { type: 'array', items: { type: 'string' } }, tools: { type: 'array', items: { type: 'string' } } }, required: ['plan', 'nodeId'] },
    output: textOutput,
    async execute(args, _exec) {
      const current = validatePlan(JSON.parse(args.plan), maxNodes);
      if (!current.nodes.some(n => n.id === args.nodeId)) throw new Error(`Unknown node: ${args.nodeId}`);
      const patch = {};
      if (typeof args.task === 'string' && args.task.trim()) patch.task = args.task.trim();
      if (typeof args.role === 'string' && args.role.trim()) patch.role = args.role.trim();
      if (typeof args.output === 'string' && args.output.trim()) patch.output = args.output.trim();
      if (Array.isArray(args.skills)) patch.skills = [...new Set(args.skills.map(s => String(s)))];
      if (Array.isArray(args.tools)) patch.tools = [...new Set(args.tools.map(s => String(s)))];
      const plan = validatePlan({ ...current, revision: current.revision + 1, nodes: current.nodes.map(n => n.id === args.nodeId ? { ...n, ...patch } : n) }, maxNodes);
      return JSON.stringify({ kind: PLAN_KIND, plan });
    },
    presentCall: () => ({ card: 'generic', title: 'Workflow Studio · Edit' }),
  });
  ctx.tools.register({
    name: 'workflow_studio_ingest', description: 'Turn one requirement source into the workflow initial input (project brief). source=text is the default for a natural-language platform-development request; supply its content directly. source=github fetches a public issue or pull request from its URL and turns the title plus body into the brief.',
    parameters: { type: 'object', additionalProperties: false, properties: { source: { type: 'string', enum: ['text', 'github'] }, content: { type: 'string', description: 'Natural-language requirement; required for source=text.' }, reference: { type: 'string', description: 'GitHub issue or PR URL; required for source=github.' } }, required: ['source'] },
    output: textOutput,
    async execute(args, _exec) {
      const source = String(args.source);
      if (source === 'github') {
        const reference = String(args.reference ?? '').trim();
        const parsed = parseGithubUrl(reference);
        if (!parsed) throw new Error('GitHub reference must be an issue or PR URL: https://github.com/<owner>/<repo>/issues/<n> or /pull/<n>');
        let brief;
        try {
          const response = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/issues/${parsed.number}`, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'dsh-workflow-studio' } });
          if (!response.ok) throw new Error(`GitHub API ${response.status}`);
          const issue = await response.json();
          brief = platformBrief(`# ${issue.title ?? '未命名需求'}\n${issue.body ?? ''}\n\n（来自 ${parsed.owner}/${parsed.repo}#${parsed.number}）`, 'GitHub 需求');
        } catch (error) {
          brief = platformBrief(`GitHub 远程内容获取失败：${String(error instanceof Error ? error.message : error)}。请改用 web 工具获取后，以 source=text 传入 content。`, 'GitHub 需求');
        }
        return JSON.stringify({ kind: 'workflow-studio-ingest', source: 'github', reference, brief });
      }
      const content = typeof args.content === 'string' && args.content.trim() ? args.content.trim() : '';
      if (!content) throw new Error('source=text requires content (a natural-language requirement)');
      return JSON.stringify({ kind: 'workflow-studio-ingest', source: 'text', brief: platformBrief(content, '平台化开发诉求') });
    },
    presentCall: () => ({ card: 'generic', title: 'Workflow Studio · Ingest' }),
  });
  ctx.tools.register({
    name: 'workflow_studio_run', description: 'Execute the published Workflow Studio DAG when the user requests work or execution. Do not require an extra confirmation solely for creating or running the graph. Planning-only requests do not authorize execution. Loads each skill into the child logged prompt, enforces the node tool allowlist, passes direct upstream outputs, and stops on failure. Runs in foreground; user Stop cancels children. Stay within the user-requested scope. Never automatically retry a failed node with side effects.',
    parameters: planParameter, output: textOutput,
    async execute(args, exec) {
      const { plan, skillsByNode } = await prepare(args, exec, true);
      if (exec.parent) throw new Error('Run workflow_studio_run as a native top-level tool call so its complete run is visible and replayable. Switch this session to Native tools.');
      const controller = new AbortController();
      const traces = Object.create(null);
      const run = { controller, done: undefined };
      run.done = runGraph({ plan, skillsByNode, parent: exec.agent, signal: AbortSignal.any([exec.signal, controller.signal]), subagents: ctx.subagents, provider, maxParallel, trackChild: (childId, nodeId, onCall) => {
        traces[nodeId] = [];
        childObservers.set(childId, value => { if (traces[nodeId].length < 200) traces[nodeId].push(value); onCall?.({ calls: traces[nodeId].length, name: value.name, isError: value.isError }); });
        return () => childObservers.delete(childId);
      } });
      active.add(run);
      try { return JSON.stringify({ kind: RUN_KIND, plan, ...await run.done, traces, traceNote: 'Summaries: at most 200 calls/node, 8000 input chars and 12000 output chars/call; full authoritative trace remains in child sessions. Capture starts after child publication.' }); }
      finally { active.delete(run); }
    },
    presentCall: () => ({ card: 'generic', title: 'Workflow Studio · Run' }),
  });
}
