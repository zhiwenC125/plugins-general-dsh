import { EMPTY_STUDIO_SNAPSHOT, studioDefinition, createStudioBuilder } from './projection.js';
import { zh, en } from './locales.js';
import { childPreview, EMPTY_CHILD_PREVIEW } from './child-preview.js';
import { exportFileName } from './export-manifest.js';

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
