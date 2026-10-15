/** Status vocabulary shared by run and member cards. */
export const RUNNING = 'running';

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
export function workflowPhases(members) {
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
export const studioDefinition = {
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

export const EMPTY_STUDIO_SNAPSHOT = Object.freeze({ runs: [] });

/** Incremental target builder for workflow runs. */
export function createStudioBuilder() {
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
