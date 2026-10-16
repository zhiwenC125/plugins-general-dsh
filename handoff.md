# Workflow Studio 开发交接

最后更新：2026-10-17

## 1. 项目目标

2026-10-17 后续：已增加 `apps/revolution/` 独立 Electron 宿主、DSH alpha5 npm runtime、`revolution-brand` 下游插件及 GitHub Actions。使用与验证边界见 `REVOLUTION_DESKTOP.md`。原 `deepseek-harness/` alpha4 检出保持原状。Figma 已扩展 Settings、Plugins 和 Workflow 运行概览，并替换原创 RV 图标。

本项目基于 DeepSeek Harness（DSH）开发一个 Workflow 可视化界面。它位于原生会话的“对话”和“轨迹”之间，以画布形式实时展示当前会话调用官方 `workflow` 工具后产生的执行过程。

当前方向是“忠实显示 DSH 已经执行并持久化的事实”，而不是在插件里实现另一套工作流引擎。

## 2. 当前基线

- 应用仓库分支：`main`
- 本文档建立前的功能提交：`81e0851`（`Visualize native DSH workflow execution`）
- DSH 版本：`0.2.1-alpha.4`
- 本地上游源码：`deepseek-harness/`
- 上游分支：`master`
- 上游提交：`86a402200d`
- `deepseek-harness/`、`.dsh-smoke/` 和 `.pnpm-store/` 不提交到本仓库。

## 3. 已经实现

### 启动与构建

所有常用命令都可以在本项目根目录执行，不需要先进入 `deepseek-harness/`：

```sh
npm run setup
npm run build
npm run build:harness
npm start
npm run version:dsh
npm run test:workflow
```

- `npm run setup` 使用锁定版本的 pnpm 安装上游依赖，不要求全局安装 pnpm。
- `npm run build` 从 `plugins/workflow-studio/src/` 生成 `plugins/workflow-studio/lib/client.js`。
- `npm run build:harness` 仅在 DSH 上游源码发生变化后需要执行。
- `npm start` 通过根目录的 `dsh-studio` 启动本地 DSH Web 界面。

### Workflow 画布

- 注册了独立的“工作流”标签页，顺序为“对话 → 工作流 → 轨迹”。
- 读取 DSH 原生持久化事件并实时投影：
  - `tool-workflow/run-start`
  - `tool-workflow/agent-start`
  - `tool-workflow/agent-end`
  - `tool-workflow/run-end`
- 显示当前会话的调用方 Agent，界面名称为“编排 Agent”。
- 显示所有被本次 Workflow 启动的子 Agent。
- phase 横向分列，同一 phase 的子 Agent 纵向排列。
- 用连线表示“调用方 Agent → 子 Agent”的 DSH 原生父子执行关系。
- Agent 卡片显示状态、进度条、provider/model、任务输入、最终文本输出和文件数量。
- 单击卡片打开详情面板，查看完整输入、输出和识别到的文件产物。
- 单击文件可使用 DSH 右侧资源面板预览。
- 双击卡片可打开对应子 Agent 会话。
- 历史日志重放与实时事件追加使用同一个投影模型。
- 为避免同时保留过多子会话，单次界面最多实时观察 64 个子会话；超出部分会标记为受限。

### 输入、输出与文件识别

- 输入来自子会话中 `data.source.kind === "user"` 的 `user/message`。
- `runtime-context` 和 `time-context` 等运行时注入不会被误当作用户任务输入。
- 输出取子会话最后一条 `assistant/message`。
- provider/model 取自 `request/header` 中的配置。
- 文件只从成功的 `write`、`edit`、`str_replace_editor` 工具调用及其结果中提取，避免把只读工具返回的路径误判为产物。

### 导出清单（第一阶段）

- Workflow 顶栏新增“导出清单”。
- 用户可选择要纳入的 Agent，并下载 `revolution.workflow-export/v1` JSON manifest。
- manifest 包含 run、phase、子会话、provider/model、输入、输出与候选文件路径。
- 此阶段不会复制文件、推断 Agent 间依赖或自动标记最终产物，保持 alpha.4/alpha.5 事实边界。
- `REVOLUTION_EXPLORATION.md` 记录 alpha.4/alpha.5 差异、Revolution 架构建议与后续开发顺序。

### 验证状态

- `npm run build` 通过。
- 生成文件 `plugins/workflow-studio/lib/client.js` 通过 Node 语法检查。
- `npm run test:workflow` 当前共有 7 项测试，全部通过。
- 已使用真实 alpha.4 会话在浏览器中验证画布、phase、卡片输入输出、详情面板和父子连线。
- `workflow-smoke-test/` 保存了可重复使用的端到端检验场景和验收清单。

## 4. DSH 术语与事实边界

### 谁进行编排

当前会话的 Agent/模型生成 Workflow JavaScript，脚本中的 `agent()` 调用决定启动哪些子 Agent；Workflow Runtime 负责执行脚本、并发控制、生命周期和事件记录。Runtime 不是一个独立 Agent，也不应在画布里伪装成 Agent 节点。

因此，界面中的“编排 Agent”准确含义是“调用 `workflow` 的当前会话 Agent”，不是 Workflow Runtime。

### 当前连线代表什么

alpha.4 可以可靠证明：

```text
调用方 Agent → 本次 Workflow → 子 Agent
```

目前的连线只表示这种父子执行/调用关系。

alpha.4 没有在持久化事件里记录 `parallel()`、`pipeline()` 的完整结构，也没有记录“A 的输出成为 B 的输入”这样的数据依赖边。`phase` 只是进度分组，不构成严格的执行依赖。

所以目前不能可靠绘制：

```text
需求 → Agent A → Agent B → Agent C → 最终结果
```

不要根据时间先后、标签或 Workflow 脚本文本猜测这些边，否则刷新后可能得到错误关系。

## 5. 尚未开发但已经确认的想法

### A. 真正的 Agent DAG 与数据流

目标是显示输入如何经过 Agent A、B、C 转换，并标记每条边携带的输出或中间产物。

可靠实现需要先扩展 DSH Runtime 的持久化协议，建议在运行时记录：

- 节点稳定 ID，而不仅是显示 label。
- 每个节点的直接依赖节点 ID。
- 输入来源和输出去向。
- `parallel()` / `pipeline()` 展开后的运行拓扑。
- 中间值或 artifact 的稳定引用，而不是只保存文本快照。

只有这些数据成为官方持久化事件后，Workflow Studio 才应绘制 Agent A → Agent B 的 DAG 边。该功能需要修改 DSH 上游，不只是修改前端插件。

### B. 用户主动导出到 `dshOutput/`

计划增加“导出本次 Workflow”按钮，由用户主动触发，而不是每次运行自动写入项目。建议结构：

```text
dshOutput/<workflow-run-id>/
├── agents/
│   ├── 01-<agent-label>/
│   │   ├── input.md
│   │   ├── output.md
│   │   ├── metadata.json
│   │   └── files/
│   └── ...
└── summary/
    ├── workflow.json
    └── files/
```

建议第一版流程：

1. 用户点击导出。
2. 界面展示本次运行、Agent 和候选文件清单。
3. 用户确认导出位置与要复制的文件。
4. 写入每个 Agent 的输入、输出和元数据。
5. 将用户选定的最终产物放入 `summary/`。

当前没有实现该功能。不能默认把所有工作区变化复制到 `dshOutput/`，原因包括：

- 自动写入会污染项目和 Git 状态。
- alpha.4 对并发 Agent 的文件归属记录不完整。
- alpha.4 没有原生标记哪个文件是“最终产物”。
- 同一个文件可能被多个 Agent 依次修改。

### C. 产物体验后续改进

- 在详情面板中区分文本、JSON、图片和其他文件类型。
- 为 JSON 提供格式化预览，为图片提供缩略图。
- 展示文件由哪个工具调用创建或修改。
- 在 Runtime 协议完善后，展示中间产物沿 DAG 边的流转。
- 为失败 Agent 展示更明确的错误摘要和重试入口。

## 6. 建议的后续优先级

1. 先设计并确认 DSH Runtime 的 DAG/Artifact 事件协议。
2. 在上游 Runtime 中实现并测试新的持久化事件。
3. 扩展 `plugins/workflow-studio/src/projection.js`，投影节点依赖与 artifact 引用。
4. 扩展 `layout.js` 和 `view.js`，绘制真实 DAG 边和数据流。
5. 最后实现用户主动触发的 `dshOutput/` 导出，避免在协议不完整时形成错误文件归属。

如果暂时不修改 DSH 上游，可以先做导出功能的“清单与用户确认”版本，但不要自动推断真正的 Agent 间依赖。

## 7. 关键文件

- `WORKFLOW_COMPATIBILITY.md`：DSH 原生生命周期投影与 Nexus 持久化 DAG 的双范式兼容、adapter 边界及公司侧 AI 迁移清单。
- `plugins/README.md`：项目插件目录约定。
- `plugins/workflow-studio/src/client.js`：DSH 客户端注入、子会话观察、打开会话和文件预览。
- `plugins/workflow-studio/src/projection.js`：把官方 Workflow 事件投影成画布状态。
- `plugins/workflow-studio/src/child-preview.js`：提取子 Agent 输入、输出、模型和文件。
- `plugins/workflow-studio/src/layout.js`：编排 Agent、phase 和子 Agent 的布局。
- `plugins/workflow-studio/src/view.js`：React 画布、卡片和详情面板。
- `plugins/workflow-studio/src/style.css`：画布与卡片样式。
- `plugins/workflow-studio/src/locales.js`：中英文界面文本。
- `plugins/workflow-studio/scripts/build.mjs`：生成浏览器端 bundle。
- `plugins/workflow-studio/tests/`：投影和视图辅助逻辑测试。
- `workflow-smoke-test/`：真实 Workflow 端到端测试案例。
- `dsh-studio`：从项目根目录启动本地 DSH 的入口。

## 8. 修改后的最低验证流程

```sh
npm run build
node --check plugins/workflow-studio/lib/client.js
npm run test:workflow
git diff --check
```

若修改了 DSH 上游源码，再额外运行：

```sh
npm run build:harness
npm start
```

在浏览器中至少验证：标签顺序、历史 Workflow 重放、运行中状态、完成/失败状态、卡片详情、文件预览和双击进入子会话。

## 9. 开发注意事项

- `plugins/workflow-studio/lib/client.js` 是构建产物，但当前仓库会提交它；修改 `src/` 后务必重新运行 `npm run build`。
- 不要把 `.dsh-smoke/` 提交到 Git，它可能包含本地配置或凭据。
- 不要把 `deepseek-harness/` 作为本仓库源码提交；它是被忽略的上游检出目录。
- 不要恢复已经移除的插件内 DAG runner。Workflow Studio 当前定位是 DSH 官方 Workflow 的只读可视化层。
- 新增连线前，先确认其含义能够由持久化事件证明，并保证刷新和历史重放得到相同结果。
