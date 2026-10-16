// Run through use_figma after defining FIST_SVG from assets/revolution-fist.svg.
// Uses REV Color/Metrics collections from the original Revolution design.
const pageName = '02 · Revolution / Interactive v0.1';
let page = figma.root.children.find(p => p.name === pageName);
if (page && page.children.length) throw new Error('Prototype already exists; inspect returned IDs before updating.');
if (!page) { page = figma.createPage(); page.name = pageName; }
await figma.setCurrentPageAsync(page);
await Promise.all([
  figma.loadFontAsync({ family: 'Geist', style: 'Regular' }),
  figma.loadFontAsync({ family: 'Geist', style: 'SemiBold' }),
  figma.loadFontAsync({ family: 'Noto Sans SC', style: 'Regular' }),
  figma.loadFontAsync({ family: 'Noto Sans SC', style: 'Medium' }),
]);
const V = Object.fromEntries((await figma.variables.getLocalVariablesAsync()).map(v => [v.name, v]));
const color = (await figma.variables.getLocalVariableCollectionsAsync()).find(c => c.name === 'REV · Color');
const dark = color.modes.find(m => m.name === 'Dark').modeId;
const light = color.modes.find(m => m.name === 'Light').modeId;
const ids = [page.id]; const links = []; const screens = {}; const comps = {};
const styles = Object.fromEntries((await figma.getLocalTextStylesAsync()).map(s => [s.name, s]));
for (const [name, size, weight] of [['Body', 14, 'Regular'], ['Label', 12, 'Regular'], ['Heading', 22, 'Medium']]) {
  const s = figma.createTextStyle(); s.name = 'REV/CN/' + name;
  s.fontName = { family: 'Noto Sans SC', style: weight }; s.fontSize = size; s.lineHeight = { unit: 'PERCENT', value: 155 };
  styles[s.name] = s;
}
function track(n) { ids.push(n.id); return n; }
function paint(n, name) { n.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', V[name])]; }
function round(n, name = 'radius/md') { for (const p of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(p, V[name]); }
function box(parent, name, direction, w, h, fill) {
  const n = track(figma.createAutoLayout(direction)); parent.appendChild(n); n.name = name; n.resize(w, h);
  n.primaryAxisSizingMode = 'FIXED'; n.counterAxisSizingMode = 'FIXED';
  n.fills = []; if (fill) paint(n, fill); return n;
}
function padding(n, value = 20, gap = 'space/3') {
  n.paddingTop = value; n.paddingBottom = value; n.paddingLeft = value; n.paddingRight = value;
  n.setBoundVariable('itemSpacing', V[gap]);
}
function text(parent, value, size = 14, muted = false, width) {
  const n = track(figma.createText()); parent.appendChild(n); n.name = value.slice(0, 32);
  const cn = /[\u3400-\u9fff]/.test(value);
  n.fontName = { family: cn ? 'Noto Sans SC' : 'Geist', style: cn ? (size >= 20 ? 'Medium' : 'Regular') : (size >= 18 ? 'SemiBold' : 'Regular') };
  n.fontSize = size; n.lineHeight = { unit: 'PERCENT', value: 155 }; n.characters = value;
  paint(n, muted ? 'color/text/secondary' : 'color/text/primary');
  if (cn && size === 14) n.textStyleId = styles['REV/CN/Body'].id;
  if (width) { n.textAutoResize = 'HEIGHT'; n.resize(width, n.height); } return n;
}
function flex(parent) { const n = box(parent, 'Flexible space', 'VERTICAL', 1, 1); n.layoutGrow = 1; return n; }
function mainComponent(name, w, h, fill = 'color/bg/surface') {
  const n = track(figma.createComponent()); n.name = name; n.layoutMode = 'HORIZONTAL'; n.resize(w, h);
  n.primaryAxisSizingMode = 'FIXED'; n.counterAxisSizingMode = 'FIXED'; n.counterAxisAlignItems = 'CENTER';
  n.primaryAxisAlignItems = 'CENTER'; n.setExplicitVariableModeForCollection(color, dark); paint(n, fill); round(n);
  n.description = 'Revolution v0.1 reusable ' + name; return n;
}
function labelledComponent(name, w, h, fill) {
  const n = mainComponent(name, w, h, fill); const label = text(n, 'Label', 14);
  const key = n.addComponentProperty('Label', 'TEXT', 'Label'); label.componentPropertyReferences = { characters: key };
  return { n, key };
}
for (const [name, fill] of [['Primary', 'color/bg/selected'], ['Secondary', 'color/bg/elevated'], ['Disabled', 'color/bg/elevated']]) {
  comps['Button/' + name] = labelledComponent('Button/' + name, 152, 42, fill);
  if (name === 'Disabled') comps['Button/' + name].n.opacity = 0.4;
}
for (const state of ['Default', 'Selected']) comps['Nav/' + state] = labelledComponent('Nav/' + state, 216, 38, state === 'Selected' ? 'color/bg/selected' : 'color/bg/sidebar');
comps.Field = labelledComponent('Field/Default', 632, 44, 'color/bg/base');
comps.Badge = labelledComponent('Badge', 110, 28, 'color/bg/selected');
const card = mainComponent('AgentCard', 244, 184); card.layoutMode = 'VERTICAL'; padding(card, 16); card.primaryAxisAlignItems = 'MIN'; card.counterAxisAlignItems = 'MIN';
const role = text(card, 'Research Agent', 18); const roleKey = card.addComponentProperty('Role', 'TEXT', 'Research Agent'); role.componentPropertyReferences = { characters: roleKey };
const state = text(card, 'RUNNING', 12, true); const stateKey = card.addComponentProperty('State', 'TEXT', 'RUNNING'); state.componentPropertyReferences = { characters: stateKey };
const task = text(card, '读取官方信息并保存研究报告。', 14, true, 212); const taskKey = card.addComponentProperty('Task', 'TEXT', '读取官方信息并保存研究报告。'); task.componentPropertyReferences = { characters: taskKey };
text(card, 'DeepSeek · reasoner', 12, true); comps.Agent = { n: card, roleKey, stateKey, taskKey };
let compY = 5800;
for (const c of Object.values(comps)) { c.n.x = 100; c.n.y = compY; compY += c.n.height + 28; }
function instance(parent, name, label, destination, width) {
  const c = comps[name]; const i = track(c.n.createInstance()); parent.appendChild(i);
  if (label) i.setProperties({ [c.key]: label }); if (width) i.resize(width, i.height);
  if (destination) links.push({ node: i, destination, label }); return i;
}
function button(parent, label, destination, kind = 'Secondary', width) { return instance(parent, 'Button/' + kind, label, destination, width); }
function actionText(parent, label, destination, size = 14) { const t = text(parent, label, size); if (destination) links.push({ node: t, destination, label }); return t; }
const navigation = [['新会话', 'home'], ['对话', 'chat'], ['Workflow', 'workflow'], ['产物', 'artifacts'], ['自动化任务', 'schedules'], ['插件', 'plugins'], ['Skills / MCP', 'skills'], ['设置', 'general']];
function screen(key, title, index, active) {
  const r = box(page, `REV / ${key} / ${title}`, 'HORIZONTAL', 1440, 960, 'color/bg/base');
  r.x = 100 + (index % 4) * 1560; r.y = 100 + Math.floor(index / 4) * 1080;
  r.setExplicitVariableModeForCollection(color, dark); screens[key] = r;
  const nav = box(r, 'Navigation', 'VERTICAL', 248, 960, 'color/bg/sidebar'); padding(nav, 16); nav.itemSpacing = 10;
  text(nav, 'REVOLUTION', 20); text(nav, 'Agent workspace', 12, true);
  for (const [label, dest] of navigation) instance(nav, 'Nav/' + (active === dest ? 'Selected' : 'Default'), label, dest);
  text(nav, '最近会话', 12, true); actionText(nav, 'Revolution 产品研究', 'chat'); actionText(nav, 'DSH 工作流实验', 'workflow');
  flex(nav); text(nav, '本地工作区  ·  alpha5', 12, true);
  const m = box(r, 'Main', 'VERTICAL', 1192, 960);
  const top = box(m, 'Toolbar', 'HORIZONTAL', 1192, 66, 'color/bg/surface'); padding(top, 18); top.counterAxisAlignItems = 'CENTER'; text(top, title, 18); flex(top); button(top, '模型与 API', 'models');
  const body = box(m, 'Content', 'VERTICAL', 1192, 894); padding(body, 32, 'space/5');
  return { r, body, top };
}
function panel(parent, name, w = 1128, h = 150) { const p = box(parent, name, 'VERTICAL', w, h, 'color/bg/surface'); padding(p); round(p, 'radius/lg'); return p; }
function composer(parent, destination = 'workflow') {
  const p = box(parent, 'Composer', 'VERTICAL', 1128, 128, 'color/bg/elevated'); padding(p, 18); round(p, 'radius/xl');
  text(p, '描述你的任务，/ 调用指令，@ 引用文件', 14, true);
  const row = box(p, 'Composer actions', 'HORIZONTAL', 1092, 42); row.counterAxisAlignItems = 'CENTER';
  button(row, '＋ 附件', 'artifacts'); flex(row); button(row, 'DeepSeek Reasoner', 'models', 'Secondary', 184); button(row, '发送任务', destination, 'Primary');
}
function tabs(parent, active) {
  const row = box(parent, 'Conversation tabs', 'HORIZONTAL', 1128, 42); row.itemSpacing = 12;
  for (const [label, dest] of [['对话', 'chat'], ['Workflow', 'workflow'], ['轨迹', 'trajectory']]) button(row, label, dest, active === dest ? 'Primary' : 'Secondary');
}
const home = screen('home', 'Revolution', 0, 'home');
flex(home.body);
const hero = box(home.body, 'Hero', 'HORIZONTAL', 1128, 154); hero.primaryAxisAlignItems = 'CENTER'; hero.counterAxisAlignItems = 'CENTER'; hero.itemSpacing = 20;
const fist = track(figma.createNodeFromSvg(FIST_SVG)); hero.appendChild(fist); fist.resize(142, 142);
text(hero, '编写自之史章', 36); text(home.body, '从一次提问开始，让想法成为可以交付的成果。', 16, true);
composer(home.body); const shortcuts = box(home.body, 'Quick starts', 'HORIZONTAL', 1128, 42); shortcuts.itemSpacing = 12;
button(shortcuts, '研究与比较', 'chat'); button(shortcuts, '多 Agent 协作', 'workflow'); button(shortcuts, '连接自己的 API', 'models'); flex(home.body);
const chat = screen('chat', 'Revolution 产品研究', 1, 'chat'); tabs(chat.body, 'chat');
const user = panel(chat.body, 'User message', 1128, 112); text(user, '请研究 DSH alpha5，并形成产品方案与开发建议。', 16);
const response = panel(chat.body, 'Assistant response', 1128, 278); text(response, 'Revolution', 20); text(response, '我会先核对官方变更，再把研究和界面工作分解给子 Agent。', 16, false, 1080); text(response, '研究 Agent 正在读取版本差异；设计 Agent 正在准备界面方案。', 14, true, 1080); button(response, '查看 Workflow 执行', 'workflow', 'Primary');
flex(chat.body); composer(chat.body);
const workflow = screen('workflow', 'Workflow · 产品研究', 2, 'workflow'); tabs(workflow.body, 'workflow');
const stats = box(workflow.body, 'Run summary', 'HORIZONTAL', 1128, 76); stats.itemSpacing = 16;
for (const s of ['3 个 Agent', '1 个运行中', '2 个文件产物']) { const p = panel(stats, s, 365, 76); text(p, s, 18); }
const orch = panel(workflow.body, 'Orchestrator', 1128, 108); text(orch, '编排 Agent · DeepSeek Reasoner', 20); text(orch, '研究 → 汇总 → 审阅交付。画布显示 DSH 已记录的执行事实。', 14, true);
text(workflow.body, 'PHASE 01    研究与设计', 12, true);
const grid = box(workflow.body, 'Agent grid', 'HORIZONTAL', 1128, 184); grid.itemSpacing = 20;
for (const [name, status] of [['版本研究', 'COMPLETED'], ['UI 设计', 'RUNNING'], ['方案审阅', 'WAITING']]) { const i = track(card.createInstance()); grid.appendChild(i); i.setProperties({ [roleKey]: name, [stateKey]: status }); links.push({ node: i, destination: 'detail', label: name }); }
const controls = box(workflow.body, 'Workflow controls', 'HORIZONTAL', 1128, 42); controls.itemSpacing = 12; button(controls, '导出清单', 'export', 'Primary'); button(controls, '查看失败示例', 'failed'); button(controls, '查看产物', 'artifacts');
const detail = screen('detail', 'Agent 详情 · 版本研究', 3, 'workflow');
const d = panel(detail.body, 'Agent metadata', 1128, 156); text(d, '版本研究  ·  已完成', 22); text(d, 'DeepSeek / reasoner  ·  子会话 child-214-a', 14, true); button(d, '打开子会话', 'chat');
const inp = panel(detail.body, 'Input', 1128, 128); text(inp, '输入', 18); text(inp, '比较 alpha4 与 alpha5 的功能变化，核对 Workflow 协议。', 14);
const out = panel(detail.body, 'Output', 1128, 168); text(out, '输出', 18); text(out, '已完成官方变更核对。Workflow 生命周期协议保持兼容，重点变化位于模型菜单、终端与插件体验。', 14, false, 1080); button(out, '打开 alpha5-analysis.md', 'artifacts'); button(detail.body, '返回 Workflow', 'workflow', 'Primary');
const failed = screen('failed', 'Workflow · 需要处理', 4, 'workflow'); tabs(failed.body, 'workflow');
const fail = panel(failed.body, 'Failure summary', 1128, 252); text(fail, 'UI 设计 Agent 未能完成', 24); text(fail, '提供商返回限流错误。运行记录与已有产物仍然保留。', 16, true, 1080); text(fail, '你可以查看子会话中的错误，调整模型后发送新的重试请求。', 14, true, 1080); button(fail, '查看子会话', 'detail'); button(failed.body, '调整模型', 'models', 'Primary'); button(failed.body, '返回执行记录', 'workflow');
const exp = screen('export', '导出 Workflow 清单', 5, 'workflow');
text(exp.body, '选择本次交付包含的 Agent', 24); text(exp.body, '清单记录输入、输出和候选文件路径。', 14, true);
for (const name of ['☑ 版本研究  ·  alpha5-analysis.md', '☑ UI 设计  ·  revolution.fig', '☑ 方案审阅  ·  summary.md']) { const p = panel(exp.body, name, 1128, 70); text(p, name, 16); }
const er = box(exp.body, 'Export actions', 'HORIZONTAL', 1128, 42); er.itemSpacing = 12; button(er, '取消', 'workflow'); button(er, '下载 manifest', 'exported', 'Primary');
const done = screen('exported', '清单已准备好', 6, 'workflow'); const ready = panel(done.body, 'Export complete', 1128, 260); text(ready, '✓ Workflow manifest', 28); text(ready, 'workflow-run-214.json', 18); text(ready, '原型演示到此完成。实际应用会通过浏览器下载 JSON 文件。', 14, true, 1080); button(ready, '返回 Workflow', 'workflow', 'Primary');
const artifacts = screen('artifacts', '文件产物', 7, 'artifacts'); text(artifacts.body, '本次运行的产物', 24);
for (const [name, tag] of [['alpha5-analysis.md', 'MARKDOWN'], ['workflow-run-214.json', 'JSON'], ['revolution-ui.fig', 'DESIGN']]) { const p = panel(artifacts.body, name, 1128, 106); actionText(p, name, 'artifactPreview', 18); text(p, tag + ' · 来源：已记录的文件写入', 12, true); }
const preview = screen('artifactPreview', '产物预览 · alpha5-analysis.md', 8, 'artifacts'); const pv = panel(preview.body, 'Document preview', 1128, 600); text(pv, 'DSH alpha5 研究报告', 28); text(pv, '模型菜单、插件发现与终端体验', 20); text(pv, 'Workflow 画布展示父子执行关系。报告与文件产物能够从子会话中追溯。', 16, false, 1050); button(preview.body, '返回产物列表', 'artifacts');
const trajectory = screen('trajectory', '执行轨迹', 9, 'workflow'); tabs(trajectory.body, 'trajectory');
for (const line of ['01  user/message  ·  研究 DSH alpha5', '02  tool-workflow/run-start', '03  tool-workflow/agent-start  ·  版本研究', '04  tool-workflow/agent-end  ·  已完成', '05  tool-workflow/agent-start  ·  UI 设计']) { const p = panel(trajectory.body, line, 1128, 70); text(p, line, 14); }
const general = screen('general', '设置 · 通用', 10, 'general');
const gp = panel(general.body, 'Appearance', 1128, 218); text(gp, '外观与工作方式', 24); text(gp, '跟随系统  ·  中文  ·  工作区内修改', 16, true); const gr = box(gp, 'Settings tabs', 'HORIZONTAL', 1088, 42); gr.itemSpacing = 12; button(gr, '模型与 API', 'models', 'Primary'); button(gr, '插件配置', 'plugins'); button(gr, '浅色预览', 'light');
const prefs = panel(general.body, 'Preferences', 1128, 206); text(prefs, 'Agent 循环与权限', 22); text(prefs, '工具呈现、子 Agent 数量与模型均由 DSH 原生配置管理。', 14, true, 1080); button(prefs, '打开内置插件', 'plugins');
const models = screen('models', '设置 · 模型与 API', 11, 'general'); const form = panel(models.body, 'Provider form', 1128, 550); text(form, 'DeepSeek API', 24);
for (const [label, value] of [['API endpoint', 'https://api.deepseek.com'], ['API key', '••••••••••••••••••••'], ['默认模型', 'deepseek-reasoner']]) { text(form, label, 12, true); instance(form, 'Field', value); }
const buttons = box(form, 'Provider actions', 'HORIZONTAL', 1088, 42); buttons.itemSpacing = 12; button(buttons, '保存配置', 'saved', 'Primary'); button(buttons, '取消', 'general'); text(models.body, '原型中的密钥为占位符；实际配置通过本地凭据服务保存。', 13, true);
const saved = screen('saved', '模型配置已保存', 12, 'general'); const sp = panel(saved.body, 'Saved state', 1128, 250); text(sp, '✓ 配置已保存', 28); text(sp, '现在可以在会话模型菜单中选择你的模型。', 16, true); button(sp, '开始新会话', 'home', 'Primary'); button(sp, '继续配置', 'models');
const plugins = screen('plugins', '插件与能力', 13, 'plugins');
for (const [name, desc] of [['内置插件', '子智能体 · 网页搜索 · Agent 循环 · 终端'], ['Skills / MCP', '管理工具连接和可复用指令'], ['实验性能力', '按需启用开发者工具与语音等能力']]) { const p = panel(plugins.body, name, 1128, 156); text(p, name, 22); text(p, desc, 14, true); button(p, name === 'Skills / MCP' ? '管理能力' : '查看配置', name === 'Skills / MCP' ? 'skills' : 'general'); }
text(plugins.body, '应用内嵌的 Workflow Studio 保持原有设置可见性。', 12, true);
const skills = screen('skills', 'Skills 与 MCP', 14, 'plugins'); for (const name of ['文件与工作区', '浏览器研究', '自定义 Skill', 'MCP Server']) { const p = panel(skills.body, name, 1128, 160); text(p, name, 20); text(p, '通过原生插件与配置连接能力，在 / 菜单中使用。', 14, true); button(p, '查看配置', 'plugins'); }
const schedules = screen('schedules', '自动化任务', 15, 'schedules'); const schedule = panel(schedules.body, 'Schedule item', 1128, 182); text(schedule, '每周产品研究', 24); text(schedule, '周一 09:00  ·  关联会话：DSH 工作流实验', 14, true); button(schedule, '打开关联会话', 'chat'); button(schedules.body, '新建任务', 'scheduleEdit', 'Primary');
const scheduleEdit = screen('scheduleEdit', '新建自动化任务', 16, 'schedules'); const sf = panel(scheduleEdit.body, 'Schedule form', 1128, 350); text(sf, '任务设置', 24); instance(sf, 'Field', '每周产品研究'); instance(sf, 'Field', '每周一 09:00'); text(sf, '在关联会话中定期检查官方发布信息。', 14, true); button(sf, '保存任务', 'schedules', 'Primary'); button(sf, '取消', 'schedules');
const lightScreen = screen('light', '设置 · 浅色外观', 17, 'general'); lightScreen.r.setExplicitVariableModeForCollection(color, light); const lp = panel(lightScreen.body, 'Light appearance', 1128, 260); text(lp, '浅色预览', 28); text(lp, '相同组件和变量，通过 Light/Dark 模式切换。', 16, true); button(lp, '返回深色', 'general', 'Primary');
for (const link of links) {
  const target = screens[link.destination]; if (!target) throw new Error('Missing destination ' + link.destination);
  let root = link.node; while (root.parent && root.parent !== page) root = root.parent;
  if (root === target) continue;
  await link.node.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: target.id, navigation: 'NAVIGATE', transition: { type: 'DISSOLVE', duration: 0.16, easing: { type: 'EASE_OUT' } }, resetScrollPosition: true }] }]);
}
page.flowStartingPoints = [{ nodeId: home.r.id, name: 'Revolution · 完整产品旅程' }];
const counts = Object.fromEntries(Object.entries(screens).map(([key, r]) => [key, { id: r.id, name: r.name, descendants: r.findAll(() => true).length, instances: r.findAllWithCriteria({ types: ['INSTANCE'] }).length }]));
return { createdNodeIds: ids, createdStyleIds: Object.values(styles).filter(s => s.name.startsWith('REV/CN/')).map(s => s.id), pageId: page.id, screens: counts, componentIds: Object.fromEntries(Object.entries(comps).map(([key, c]) => [key, c.n.id])), interactionCount: links.length, flowStart: home.r.id };
