import { randomUUID } from 'node:crypto';
import { graphWaves, nodePrompt, runName } from './graph.js';

/** Explicit adapters for the installed rc.2 and checkout alpha.2 public subagent APIs. */
export async function startChild(subagents, provider, request) {
  if (typeof subagents.startActivation === 'function') {
    const { signal, label, ...rest } = request;
    const child = await subagents.startActivation({ provider, label, request: rest, signal, delivery: 'caller' });
    return { id: child.childId, result: child.result, dispose: () => child.dispose() };
  }
  if (typeof subagents.start === 'function') return subagents.start(provider, request);
  throw new Error('Unsupported DSH subagent API: expected startActivation or start');
}

/** Run a bounded DAG, stop dependent work on failure, and settle every child before returning. */
export async function runGraph({ plan, parent, signal, subagents, provider, maxParallel, skillsByNode, trackChild = () => () => {} }) {
  const runId = randomUUID();
  const controller = new AbortController();
  const combined = AbortSignal.any([signal, controller.signal]);
  const outputs = Object.create(null);
  const errors = [];
  let sequence = 0;
  let recordError;
  const append = (type, data) => {
    if (recordError) throw recordError;
    try { parent.session.append(type, { runId, ...data }); }
    catch (error) { recordError = error; controller.abort(error); throw error; }
  };
  combined.throwIfAborted();
  append('tool-workflow/run-start', { name: runName(plan) });
  const execute = async node => {
    combined.throwIfAborted();
    let child, seq, untrack, outcome = 'failed';
    try {
      child = await startChild(subagents, provider, {
        parent, signal: combined, label: `[${node.id}] ${node.label}`,
        prompt: [{ type: 'text', text: nodePrompt(plan, node, outputs, skillsByNode[node.id]) }],
        toolFilter: { allow: node.tools },
      });
      seq = ++sequence;
      untrack = trackChild(child.id, node.id, info => {
        if (recordError) return;
        try { parent.session.append('tool-workflow/agent-progress', { runId, seq, phase: node.id, calls: info.calls, lastTool: info.name, isError: info.isError }); }
        catch (error) { recordError = error; controller.abort(error); }
      });
      append('tool-workflow/agent-start', { seq, label: `[${node.id}] ${node.label}`, phase: node.id, childId: child.id });
      const result = await child.result;
      if (result.stopReason !== 'completed') throw new Error(`${node.label}: ${result.stopReason}${result.diagnostic ? ` — ${result.diagnostic}` : ''}`);
      const text = result.output.filter(b => b.type === 'text').map(b => b.text).join('\n');
      if (!text.trim()) throw new Error(`${node.label}: no textual deliverable returned`);
      outputs[node.id] = { childId: child.id, text };
      outcome = 'completed';
    } catch (error) {
      outcome = combined.aborted ? 'cancelled' : 'failed';
      errors.push(`${node.id}: ${error instanceof Error ? error.message : String(error)}`);
      controller.abort(error);
    } finally {
      if (child) {
        try { await child.dispose(); }
        catch (error) { outcome = 'failed'; errors.push(`${node.id}: cleanup failed: ${String(error)}`); controller.abort(error); }
      }
      untrack?.();
      if (seq !== undefined && !recordError) append('tool-workflow/agent-end', { seq, outcome });
    }
  };
  try {
    for (const wave of graphWaves(plan)) {
      for (let offset = 0; offset < wave.length; offset += maxParallel) {
        if (combined.aborted) break;
        const settled = await Promise.allSettled(wave.slice(offset, offset + maxParallel).map(execute));
        for (const item of settled) if (item.status === 'rejected') {
          errors.push(String(item.reason)); controller.abort(item.reason);
        }
      }
      if (combined.aborted) break;
    }
  } finally {
    if (recordError) throw new Error(`Workflow recording failed; execution stopped: ${String(recordError)}`);
    append('tool-workflow/run-end', { stopReason: signal.aborted ? 'cancelled' : errors.length ? 'error' : 'completed' });
  }
  return { runId, status: signal.aborted ? 'cancelled' : errors.length ? 'failed' : 'completed', outputs, errors };
}
