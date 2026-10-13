# dsh-workflow-studio

DeepSeek Harness 的原生「Agent 工作流」画布与 DAG 运行器：把一个目标拆成若干可追踪的子 Agent 节点，在会话里可视化编辑、审查并执行，节点之间的上下游产物直接按图传递。

## 它解决什么

纯聊天界面难以表达「研发全流程的可视化与执行」：谁先做、谁依赖谁、每一步的产物和验收标准是什么。本插件把 Harness 的原生会话视图改为左侧工作流画布、右侧原生对话，不再新增独立工作流聊天页：

- 编排交给 DeepSeek Harness 决定，并且是自动的：你只给初始输入（用户诉求、飞书纪要、GitHub / Coding 需求等），第一次输入即由 DSH 判断需要几个 Agent、分别具备哪些能力，并生成 DAG，不需要人来决定是否产生 workflow。
- 画布上每个节点代表一个子 Agent，节点之间用有向边表示依赖；运行到哪个节点，哪个节点的小卡片就展开显示输入、输出与上下文。
- 卡片始终紧凑显示输入/输出，并带 ComfyUI 风格的进度条；点击任意节点可随时查看它的上下文、实际产物与工具调用轨迹。
- 对话收敛在画布右侧约三分之一的面板里：上方是「总领 + 执行流」的流式展开，下方是唯一输入框；输入框复用原生附件、模型选择、停止与审批能力，不再额外显示底部输入框。
- 执行按拓扑分层并行推进，任一节点失败会中止其下游工作，并在返回前清理所有子 Agent。

## 目录

- `src/graph.js` — 版本化 JSON 图校验、拓扑分层（`graphWaves`）、子节点提示词组装（`nodePrompt`）与示例草案（`samplePlan`）。同被 host 校验器和浏览器编辑器引用。
- `src/runner.js` — DAG 执行器：通过 DSH 子 Agent API 启动子节点，施加工具白名单，传递直接上游产物，失败即中止，保证清理与事件回放。
- `src/host.js` — Host 插件：注册 `workflow_studio_catalog`、`workflow_studio_ingest`、`workflow_studio_plan`、`workflow_studio_edit`、`workflow_studio_run` 五个原生工具。
- `src/projection.js` — 把工具结果与会话事件折叠为可回放的工作流/运行记录，供浏览器视图重建。
- `src/client.js` / `src/view.js` / `src/style.css` — 浏览器插件与画布 React 视图，右侧栏通过原生 Conversation 组件复用流式消息与输入。
- `src/locales.js` — 中英文案。
- `lib/client.js` — 由 `scripts/build.mjs` 生成的预构建浏览器包，React 由 DSH 注入，无网络依赖。
- `tests/` — 图校验、宿主工具、投影折叠、执行器与子 Agent 适配器测试。

## 开发

要求 Node.js >= 22.19。构建与测试不需要第三方依赖：

```sh
node scripts/build.mjs          # 从 src 生成 lib/client.js
node --test tests/*.test.js    # 运行全部测试
```

`lib/client.js` 由构建脚本确定性生成（相同源码产生相同内容），提交前请重新构建，使浏览器包与 `src` 保持一致。

## 安装到 DeepSeek Harness

把本包作为 profile 依赖安装即可，宿主会自动应用包级 patch 并发现客户端包，无需手写 `--patch`：

```sh
# 在 profile 目录内（例如 $DSH_HOME/profiles/web）执行：
pnpm add link:/绝对路径/workflow-studio
# 或使用 dsh 插件管理命令：
dsh plugin --profile web add link:/绝对路径/workflow-studio
```

安装后，`package.json` 的 `dsh.bundle.patch`（`cordis.patch.yml`）会自动把插件按包名 `dsh-workflow-studio` 插入（默认 `provider: spawn`、`maxParallel: 3`、`maxNodes: 24`）；`dsh.client` 元数据让宿主的 client module 扫描自动把 `lib/client.js` 注册进网页引导图。随后正常启动即可：

```sh
dsh --profile web
```

浏览器侧通过 `dsh.client.inject` 声明依赖（`ui-conversation`、`ui-session`、`ui-chat`、`locale`，并经由 `ui-conversation` 传递 `ui-workspace`、`ui-renderer`、会话控制器等）。

仅调试 Host 侧源码时，可用 `dev.patch.yml` 直接以绝对路径插入 `src/host.js`（不改动 profile 依赖）：

```sh
dsh --profile web --patch path/to/workflow-studio/dev.patch.yml
```

## 使用流程

1. 打开任意会话，在工作流右侧原生输入框描述目标，或粘贴需求 / 飞书纪要 / 仓库或 Coding 需求链接。
2. 自然语言诉求可直接作为输入；如果给的是 GitHub issue/PR 链接，DSH 会调用 `workflow_studio_ingest` 抓取标题与正文并规范成项目简报，再调用 `workflow_studio_catalog` 查询真实能力、`workflow_studio_plan` 生成并发布 DAG 到画布。
3. 在画布上查看生成的流程；点击任意节点展开上下文，或运行后查看实际输出与工具调用轨迹。
4. 明确要求实施或执行时，DSH 在发布图后继续执行，无需再次确认是否创建工作流；仅讨论方案时不执行。也可点「运行」或在输入框里要求运行，DSH 调用 `workflow_studio_run` 在前台执行；失败会停在失败节点，下游不执行。
5. 运行中可点选某个 Agent 查看详情，或在右侧总领对话中说明需要修改的节点；DSH 可调用 `workflow_studio_edit` 更新节点并提升版本，再重跑以传播变更。
6. 在「工作流」头部通过版本选择器查看历史计划与运行结果。

运行必须是原生（Native）顶层工具调用；嵌套 PTC 执行会被明确拒绝，以保证完整运行记录可见、可回放。

## 右侧原生聊天与画布定位

- 原生「对话」视图直接呈现画布与右侧栏，不再注册独立工作流标签页；「轨迹」继续使用宿主原布局。
- 原生消息与输入框始终只有一个实例：完整保留 Markdown、推理、工具、错误、附件、停止和权限交互。插件从会话头部的 session-scoped 插槽通过 React Portal 挂载左侧画布；聊天 DOM 和编辑器不重建、不移动，不复制消息。
- 首次出现图、进入画布或开始新交互时定位。消息增量和运行进度不触发重定位。适应画布保留用户拖动后的节点位置。
- 编排规则通过宿主 systemPrompt 注册：先发布最小流程，再边对话边修订；信息不足时先建立澄清节点，不必先完成长篇方案。
- 本地验证：`node --test tests/*.test.js`，包含首次发布定位、交互开始定位、流式修订保留视口、适应画布保留节点拖动位置。
