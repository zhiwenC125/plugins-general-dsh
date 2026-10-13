import { PLAN_KIND, RUN_KIND, validatePlan } from './graph.js';

/** Read only the plugin's versioned tool result; malformed data remains a generic native tool card. */
export function studioResult(event) {
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
export const studioDefinition = {
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
export function createStudioBuilder() {
  const nodes = new Map();
  const snapshot = () => [...nodes.values()].sort((a, b) => a.anchorSeq - b.anchorSeq);
  return { empty: [], replace({ nodes: rows }) { nodes.clear(); rows.forEach(n => nodes.set(n.key, n)); return snapshot(); }, apply({ upserts }) { upserts.forEach(n => nodes.set(n.key, n)); return snapshot(); } };
}
