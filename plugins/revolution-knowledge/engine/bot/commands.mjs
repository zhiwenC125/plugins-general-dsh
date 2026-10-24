// Commands are handled before the model sees a message. Only IDs returned by
// the current user's authorized project/session listings may be selected.
export function parseBotCommand(text) {
  const match = text.trim().match(/^\/(当前|项目|会话|新建项目|新建任务|停止|结果|模型)(?:\s+(.+))?$/u);
  return match ? { name: match[1], id: match[2]?.trim() ?? null } : null;
}

export async function handleBotCommand(command, binding, deps) {
  const { listProjects, listSessions, updateBinding, createProject, createTask, stopSession, readResult, listModels, selectModel } = deps;
  if (command.name === '当前') {
    return { status: 'command', text: `当前项目：${binding.projectId ?? '未选择'}\n当前会话：${binding.sessionId ?? '未选择'}\n/项目、/会话、/新建项目 名称、/新建任务 名称、/结果、/停止、/模型` };
  }
  if (command.name === '新建项目') {
    if (!command.id) return { status: 'command', text: '用法：/新建项目 项目名称' };
    if (!createProject || !updateBinding) return { status: 'unsupported' };
    const project = await createProject(binding, command.id);
    await updateBinding(binding, { projectId: project.id, workspaceId: project.id, sessionId: null });
    return { status: 'command', text: `已新建项目：${project.name}（${project.id}）。用 /新建任务 名称 创建会话。` };
  }
  if (command.name === '新建任务') {
    if (!binding.projectId) return { status: 'command', text: '请先用 /项目 选择项目。' };
    if (!command.id) return { status: 'command', text: '用法：/新建任务 任务名称' };
    if (!createTask || !updateBinding) return { status: 'unsupported' };
    const task = await createTask(binding, command.id);
    await updateBinding(binding, { sessionId: task.id });
    return { status: 'command', text: `已新建任务会话：${task.title}（${task.id}）。发送下一条消息即可开始执行。` };
  }
  if (command.name === '停止') {
    if (!binding.sessionId) return { status: 'command', text: '请先选择会话。' };
    if (!stopSession) return { status: 'unsupported' };
    await stopSession(binding);
    return { status: 'command', text: `已请求停止会话 ${binding.sessionId} 的当前执行。已排队消息仍会保留。` };
  }
  if (command.name === '结果') {
    if (!binding.sessionId) return { status: 'command', text: '请先选择会话。' };
    if (!readResult) return { status: 'unsupported' };
    return { status: 'command', text: await readResult(binding) };
  }
  if (command.name === '模型') {
    if (!binding.sessionId) return { status: 'command', text: '请先选择会话。' };
    if (!listModels || !selectModel) return { status: 'unsupported' };
    const models = await listModels(binding);
    if (!command.id) return { status: 'command', text: models.length ? `可用模型：\n${models.map(m => `${m.provider}/${m.id}  ${m.name}`).join('\n').slice(0, 10000)}\n用 /模型 提供商/模型ID 选择。` : '当前没有可用模型，请在 Revolution 设置中配置。' };
    const selected = models.find(m => `${m.provider}/${m.id}` === command.id);
    if (!selected) return { status: 'denied' };
    await selectModel(binding, selected);
    return { status: 'command', text: `会话 ${binding.sessionId} 已选择 ${selected.provider}/${selected.id}，下次请求生效。` };
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
