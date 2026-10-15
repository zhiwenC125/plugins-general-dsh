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
export function childPreview(entries) {
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

export const EMPTY_CHILD_PREVIEW = EMPTY;
