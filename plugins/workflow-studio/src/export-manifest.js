function stringValue(value) {
  return typeof value === 'string' ? value : '';
}

function uniqueFiles(files) {
  return [...new Set(Array.isArray(files) ? files.filter(file => typeof file === 'string' && file) : [])];
}

/** Build a deterministic, downstream-only export manifest from persisted Workflow facts. */
export function buildExportManifest(run, previews, orchestrator, includedSeqs) {
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

export function exportFileName(runId) {
  const safe = String(runId || 'workflow').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return `workflow-${safe || 'workflow'}.json`;
}
