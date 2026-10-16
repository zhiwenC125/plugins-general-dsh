# Revolution：DSH alpha.4 / alpha.5 洞察与产品开发探索

核对日期：2026-10-17

## 1. 版本结论

- `0.2.1-alpha.4`：`86a402200d95fecef4529d969836f1fe13c6cb0d`
- `0.2.1-alpha.5`：`1517a4dbca0a2789ff1d41ba439600f8547d23fa`
- alpha.5 当前同时是远端 `master` 与最新 tag。
- alpha.4 → alpha.5 没有修改 Workflow Runtime 的事件结构；`packages/workflow/` 的变化只有版本号。因此当前 Workflow Studio 对 `run-start`、`agent-start`、`agent-end`、`run-end` 的投影边界仍然成立。

alpha.5 主要是产品壳和稳定性迭代：

1. 模型选择器新增 provider-aware label slot，并修复菜单越界。
2. 终端发现改为按 session 共享，恢复和列表状态更稳。
3. 插件变化后刷新 skill slash menu。
4. Account notice 支持通用字段、队列堆叠与高度平滑过渡。
5. 修复右侧栏折叠后 PageUp 引起的 frame 位移。
6. 调整 PTC 指令组合，避免依靠脆弱的 prose replacement。
7. 加强 Windows runner、签名、发布资格和 COS 发布防护。

这些变化值得升级，但不会自动提供真实 Agent DAG 或 artifact lineage。

## 2. alpha.4 已有但当前产品尚未充分利用的能力

| 能力 | Workflow / UI 当前缺口 | Revolution 建议 |
|---|---|---|
| Desktop host 与 macOS / Windows 打包 | 当前主要从 Web smoke profile 启动 | 复用 `apps/desktop` 做正式桌面宿主，先保留 Web 作为调试和远程入口 |
| Theme runtime 与字体设置 | Workflow Studio 只消费少量 alias token | 建立 Revolution theme/brand 插件，统一桌面、Web、Workflow、设置页和启动页 |
| Slot / plugin 架构 | 目前只注入一个 Workflow tab | 将模型标签、工作流动作、artifact inspector、会话动作都做成独立 slot 扩展 |
| 右侧资源与 deliverables | 目前只能点击路径打开文件 | 增加类型识别、缩略图、JSON 格式化、diff 与最终产物人工确认 |
| Goal / Plan / Schedule | 没有形成跨会话工作台 | 在首页加入 Goals、Scheduled runs、最近 Workflow 和待确认动作 |
| Approval / Questions | Workflow 画布只显示执行事实 | 将等待批准、等待用户回答作为一等状态，但仍以持久化事件为依据 |
| Skills / plugin manager | 能力发现隐藏在设置与 slash menu | 在 Composer 增加可搜索的 capability palette，并显示当前会话可用能力 |
| Session / subagent / workspace | 子 Agent 只在卡片和详情出现 | 增加会话固定、筛选、跨窗口打开和 artifact 聚合，不推断不存在的依赖边 |
| Native model selection | provider/model 信息只读展示 | 复用 alpha.5 provider-aware label slot，清晰区分 provider、model、reasoning 档位 |
| Terminal inventory | Workflow 产物与终端上下文割裂 | 右侧上下文面板显示本会话终端与活动目录，避免重复创建终端 |

## 3. Revolution 推荐技术路线

采用“DSH 上游内核 + Revolution 下游产品层”，暂不改 Workflow Runtime 协议。

```text
DeepSeek Harness upstream
├── agent/session/tool/workflow runtime
├── web + desktop host
└── official persistence facts

Revolution downstream
├── brand/theme package（REV 图标、人物标识、产品文案）
├── workflow-studio plugin（画布、详情、导出清单）
├── workspace home（Goals / Runs / Artifacts / Schedules）
├── product profile（默认插件、模型、权限与布局）
└── desktop packaging overlay（应用名、bundle id、icons、更新渠道）
```

### 为什么不是重写一个新前端

DSH 已经提供 session binding、事件投影、资源协议、右侧栏、插件、桌面 host、模型与工具生命周期。重新实现会制造第二套协议和大量兼容成本。Revolution 应把差异集中在品牌、信息架构、组件、插件组合与发行配置。

### 仓库建议

1. 继续把 `deepseek-harness/` 当作可更新的上游检出，不提交到当前仓库。
2. 当前仓库提交 Revolution 自有插件、主题、品牌资产、patch manifest、测试与发行脚本。
3. 用明确的 `DSH_VERSION` / commit pin 升级上游；每次升级运行兼容测试。
4. 只有当正式打包必须修改 `apps/desktop` 的产品字符串、bundle id 或图标时，增加最小、可重放的 downstream patch；不把业务功能混入上游目录。

## 4. UI 设计逻辑

参考 `open-claude-ui` 的是交互原则，不复制 Claude 品牌：

- 三栏工作区：会话导航 / 主工作区 / Run context 与 Artifacts。
- 低对比 Surface 0–3、细边框、轻阴影；Revolution accent 使用 signal coral。
- Composer 保持底部稳定，模型和 reasoning 放在顶部上下文区域。
- Workflow 以“编排 Agent → 子 Agent”的可证实执行关系为主，不画猜测的数据依赖。
- Agent 卡片只展示快速扫描信息；完整输入、输出、runtime 和文件进入右侧详情。
- 运行中、成功、失败、等待用户等状态要有颜色、文本和形状三重编码。
- 键盘、CJK IME、流式滚动锁定、窄窗口压缩和 reduced-motion 是桌面产品的基础要求。

品牌使用：

- 应用图标：只使用 `REV` 三字母，保证 dock / taskbar 小尺寸可辨认。
- 应用内人物标识：替换 DSH 鲸鱼，作为 orchestrator / Revolution identity 使用。
- 原图只作为离散品牌资产，不作为整屏背景或不可编辑 UI。

## 5. 开发顺序

### Phase 1：可验证的下游能力

- [x] Figma 主工作区与 REV app icon 探索。
- [x] Workflow 导出清单与 Agent 选择确认。
- [ ] Artifact 类型识别、图片缩略图、JSON 格式化和 diff 预览。
- [x] Revolution theme / branding 插件。
- [ ] alpha.5 兼容升级与真实会话回归。

### Phase 2：产品壳

- [ ] Revolution home：Recent sessions、Goals、Runs、Artifacts、Schedules。
- [ ] 自有启动页、设置页信息架构和 capability palette。
- [x] Web 与桌面共用独立 Revolution profile（DSH alpha5 npm 版）。
- [x] 桌面 app 名称、bundle id 与原创 RV 图标资源；签名尚未配置。

### Phase 3：协议准备完成后

- [ ] DSH Runtime 持久化稳定 node ID、dependency IDs、input/output refs、artifact refs。
- [ ] Workflow Studio 绘制真实 Agent DAG 与 artifact lineage。
- [ ] 用户确认后复制到 `dshOutput/<run-id>/`，而不是自动污染工作区。

## 6. 当前导出 manifest 边界

`revolution.workflow-export/v1` 记录：run、phase、Agent、子会话、provider/model、输入、输出和候选文件路径。

它明确声明：

- `agentDependenciesInferred: false`
- `filesCopied: false`
- `finalArtifactsInferred: false`

因此可在不修改上游协议的前提下先完成审核和确认体验，未来再把已确认清单交给受控的 host-side copier。
