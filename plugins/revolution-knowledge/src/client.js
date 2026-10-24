const h = React.createElement;
async function api(path, body) {
  const response = await fetch('/revolution/knowledge' + path, { credentials: 'same-origin', ...(body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json', 'x-revolution-request': 'knowledge' }, body: JSON.stringify(body) }) });
  const value = await response.json(); if (!response.ok) throw new Error(value.error || '请求失败'); return value;
}
function KnowledgePanel() {
  const [state, setState] = React.useState(null), [config, setConfig] = React.useState(null);
  const [error, setError] = React.useState(''), [busy, setBusy] = React.useState(false), [result, setResult] = React.useState(null);
  const [query, setQuery] = React.useState(''), [url, setUrl] = React.useState('');
  const [article, setArticle] = React.useState({ id: '', title: '', content: '' });
  const [spaces, setSpaces] = React.useState([]);
  const [app, setApp] = React.useState({ appId: '', secret: '' });
  const reload = async () => { const s = await api('/status'); setState(s); setConfig(c => c ?? s.config); return s; };
  React.useEffect(() => { let live = true; api('/status').then(s => { if (live) { setState(s); setConfig(s.config); } }).catch(e => live && setError(e.message)); return () => { live = false; }; }, []);
  const pending = ['starting', 'waiting'].includes(state?.auth?.attempt?.status);
  React.useEffect(() => { if (!pending) return; let live = true; const timer = setInterval(() => api('/status').then(s => live && setState(s)).catch(e => live && setError(e.message)), 2000); return () => { live = false; clearInterval(timer); }; }, [pending]);
  const run = async action => { setBusy(true); setError(''); try { const r = await action(); setResult(r); await reload(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const button = (text, fn) => h('button', { type: 'button', disabled: busy, onClick: () => run(fn) }, text);
  const input = (label, value, onChange, type = 'text') => h('label', { className: 'rev-kb-field' }, label, h('input', { type, value, onChange: e => onChange(e.target.value) }));
  if (!state || !config) return h('div', { className: 'rev-kb' }, error || '正在打开知识库…');
  const attempt = state.auth.attempt;
  return h('main', { className: 'rev-kb' },
    h('h1', null, '知识库与飞书'), h('p', null, '让 Revolution 查阅你的知识、引用来源，并把同一套文章同步到 Obsidian、飞书云文档和 Wiki。'),
    error && h('p', { role: 'alert', className: 'rev-kb-error' }, error),
    h('section', null, h('h2', null, '连接飞书'),
      h('p', null, state.auth.connected ? `已连接：${state.auth.name || state.auth.accountId}` : '登录并授权后可读取你的飞书文档。'),
      h('div', { className: 'rev-kb-actions' },
        button(state.auth.configured ? '登录飞书 / 重新授权' : '连接飞书（创建个人应用）', () => api('/login', { createApp: !state.auth.configured })),
        state.auth.configured && button('授权文档同步写入', () => api('/login', { write: true })),
        button('刷新状态', () => reload()),
        state.auth.configured && button('断开飞书', () => api('/logout', {}))),
      pending && h('p', { role: 'status' }, '请完成飞书页面上的确认；首次连接可能分为创建应用和用户授权两步。'),
      attempt?.url && h('a', { href: attempt.url, target: '_blank', rel: 'noreferrer' }, '打开飞书授权页面 ↗'),
      pending && button('取消登录', () => api('/cancel-login', {})),
      attempt?.status === 'complete' && h('p', { role: 'status' }, '授权流程已完成。'),
      attempt?.status === 'error' && h('p', { role: 'alert' }, attempt.message),
      h('details', null, h('summary', null, '使用已有飞书应用'),
        input('App ID', app.appId, v => setApp({ ...app, appId: v })), input('App Secret（仅本机保存）', app.secret, v => setApp({ ...app, secret: v }), 'password'),
        button('连接已有应用', async () => { const r = await api('/app', app); setApp({ appId: '', secret: '' }); return r; })),
      h('p', { className: 'rev-kb-muted' }, '登录授权和 DeepSeek 模型登录各自管理。飞书登录不会提供模型额度；用户授权不会扩大原有文档访问权限。')),
    h('section', null, h('h2', null, '三个并列知识副本'),
      ...[['root', 'Markdown 原文目录（含 knowledge/catalog.json）'], ['vault', 'Obsidian 库完整路径'], ['folderToken', '飞书普通文档文件夹链接或标识'], ['spaceId', 'Wiki 空间设置页链接或空间 ID']].map(([key, label]) => input(label, config[key] || '', v => setConfig({ ...config, [key]: v }))),
      h('div', { className: 'rev-kb-actions' }, button('保存连接位置', () => api('/configure', config)), button('选择可访问 Wiki 空间', async () => { const r = await api('/spaces', {}); setSpaces(r.items || []); return { spaces: (r.items || []).length, more: !!r.has_more }; })),
      spaces.length > 0 && h('label', { className: 'rev-kb-field' }, '选择 Wiki 空间后保存连接位置', h('select', { value: config.spaceId, onChange: e => setConfig({ ...config, spaceId: e.target.value }) }, h('option', { value: '' }, '请选择'), ...spaces.map(s => h('option', { key: s.space_id, value: s.space_id }, s.name || s.space_id)))),
      h('p', { className: 'rev-kb-muted' }, '已有 GitHub 知识仓库可填写为原文目录。新用户默认使用自己的空库；可移植的 Markdown 与清单可自行提交 GitHub。'),
      ...[['obsidian', 'Obsidian'], ['docs', '飞书普通文档'], ['wiki', '飞书 Wiki']].map(([target, label]) => h('div', { key: target, className: 'rev-kb-actions' }, h('strong', null, label),
        button('预览同步', () => api('/sync', { target, dryRun: true })),
        button('同步写入', () => api('/sync', { target, dryRun: false })),
        button('拉回远端修改', () => api('/sync', { target, direction: 'pull', dryRun: false })))),
      h('details', null, h('summary', null, '从旧版命令行迁移'), h('p', null, '先保存原来的 Markdown 目录、Obsidian 路径和飞书目标，再迁移旧同步记录。系统会读回验证，成功后复用已有文档。'), button('迁移旧同步记录', () => api('/import-legacy', {}))),
      h('details', null, h('summary', null, '切换账号后的映射重置'), h('p', null, '重置会解除当前库与飞书文章的关联，下次同步会新建文章。远端文档保留。'), button('清除飞书映射', () => { if (!window.confirm('解除全部飞书映射？下次同步可能创建重复文章。')) return { cancelled: true }; return api('/reset-mappings', {}); }))),
    h('section', null, h('h2', null, '检索与阅读'), input('搜索知识', query, setQuery), button('检索', () => api('/search', { query })),
      input('飞书 docx / Wiki 文档链接', url, setUrl), button('读取飞书原文', () => api('/remote-read', { url })),
      h('p', { className: 'rev-kb-muted' }, '也可直接在 Revolution 对话中提问，模型可调用知识检索和飞书读取工具。'),
      ...state.articles.map(a => h('div', { key: a.id, className: 'rev-kb-actions' }, h('span', null, a.title), button('阅读 / 编辑', async () => { const v = await api('/article?id=' + encodeURIComponent(a.id)); setArticle({ ...v, expectedHash: v.hash }); return { opened: v.title }; }),
        h('small', null, ['obsidian', 'feishuDocs', 'feishuWiki'].map(k => `${k}: ${a.mirrors[k]?.hash === a.hash ? '已记录同步' : a.mirrors[k] ? '待同步' : '未关联'}`).join(' · '))))),
    h('section', null, h('h2', null, '新建或编辑文章'),
      input('文章 ID（英文小写与短横线）', article.id, v => setArticle({ ...article, id: v, expectedHash: undefined })), input('标题', article.title, v => setArticle({ ...article, title: v })),
      h('textarea', { 'aria-label': 'Markdown 正文', rows: 10, value: article.content, onChange: e => setArticle({ ...article, content: e.target.value }) }),
      button('生成待确认草稿', () => api('/propose', article)),
      ...state.drafts.map(d => h('details', { key: d.draftId }, h('summary', null, `待确认：${d.title}`), h('pre', null, d.content), button('保存到知识原文', () => api('/approve', { draftId: d.draftId })), button('放弃', () => api('/discard', { draftId: d.draftId }))))),
    result && h('section', null, h('h2', null, '操作结果'), h('pre', { 'aria-live': 'polite' }, JSON.stringify(result, null, 2))));
}
function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement('style');
    style.textContent = '.rev-kb{padding:28px;max-width:1100px;margin:auto;overflow:auto;height:100%;box-sizing:border-box;color:var(--dsw-alias-text-primary,inherit)}.rev-kb section{border:1px solid #8884;border-radius:12px;padding:20px;margin:20px 0}.rev-kb h1{font-size:26px}.rev-kb h2{font-size:19px;margin-bottom:12px}.rev-kb p{margin:10px 0;line-height:1.6}.rev-kb-field{display:flex;flex-direction:column;gap:6px;margin:12px 0}.rev-kb input,.rev-kb textarea{padding:9px;border:1px solid #8887;border-radius:6px;background:transparent;color:inherit;width:100%;box-sizing:border-box}.rev-kb button{padding:8px 12px;border:1px solid #8887;border-radius:6px;cursor:pointer;background:var(--dsw-alias-bg-layer-2,#eee);color:inherit}.rev-kb button:disabled{opacity:.5}.rev-kb-actions{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:12px 0}.rev-kb pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:420px;overflow:auto;font-size:13px}.rev-kb-error{color:#c33}.rev-kb-muted{opacity:.7;font-size:13px}.rev-kb a{text-decoration:underline}.rev-kb summary{cursor:pointer;margin:12px 0}';
    document.head.appendChild(style); return () => style.remove();
  });
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'revolution-knowledge', inject: () => ({}) }, KnowledgePanel));
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: 'revolution-knowledge', order: 2, label: () => '知识库' }, () => h('span', { 'aria-hidden': true }, '▤')));
  ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'revolution-feishu', order: 25, label: () => '飞书与知识库', inject: () => ({}) }, KnowledgePanel));
}
