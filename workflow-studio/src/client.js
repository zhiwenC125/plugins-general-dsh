import { studioDefinition, createStudioBuilder } from './projection.js';
import { zh, en } from './locales.js';

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
