// Commands are handled before the model sees a message. Only IDs returned by
// the current user's authorized project/session listings may be selected.
export function parseBotCommand(text) {
  const match = text.trim().match(/^\/(当前|项目|会话)(?:\s+([^\s]+))?\s*$/u);
  return match ? { name: match[1], id: match[2] ?? null } : null;
}

export async function handleBotCommand(command, binding, deps) {
  const { listProjects, listSessions, updateBinding } = deps;
  if (command.name === '当前') {
    return { status: 'command', text: `当前项目：${binding.projectId ?? '未选择'}\n当前会话：${binding.sessionId ?? '未选择'}` };
  }
  if (command.name === '项目') {
    if (!listProjects || !updateBinding) return { status: 'unsupported' };
    const projects = await listProjects(binding.revolutionUserId, binding.workspaceId);
    if (!command.id) return { status: 'command', text: projects.length ? projects.map(p => `${p.id}  ${p.name}`).join('\n') : '没有可访问的项目。' };
    const selected = projects.find(p => p.id === command.id);
    if (!selected) return { status: 'denied' };
    await updateBinding(binding, { projectId: selected.id, sessionId: null });
    return { status: 'command', text: `已切换到项目：${selected.name}。会话已清空，请用 /会话 选择。` };
  }
  if (command.name === '会话') {
    if (!binding.projectId) return { status: 'command', text: '请先用 /项目 选择项目。' };
    if (!listSessions || !updateBinding) return { status: 'unsupported' };
    const sessions = await listSessions(binding.revolutionUserId, binding.workspaceId, binding.projectId);
    if (!command.id) return { status: 'command', text: sessions.length ? sessions.map(s => `${s.id}  ${s.title}`).join('\n') : '当前项目没有可访问的会话。' };
    const selected = sessions.find(s => s.id === command.id);
    if (!selected) return { status: 'denied' };
    await updateBinding(binding, { sessionId: selected.id });
    return { status: 'command', text: `已切换到会话：${selected.title}。` };
  }
  return { status: 'unsupported' };
}
