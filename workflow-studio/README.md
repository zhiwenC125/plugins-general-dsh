# dsh-workflow-studio

DeepSeek Harness 原生 `workflow` 流程的实时画布视图。

插件不会创建第二套工作流协议，也不注册模型工具。它读取 Harness 已经写入会话日志的 `tool-workflow/run-start`、`agent-start`、`agent-end` 与 `run-end` 事件，把同一份持久化事实投影为可回放、可实时更新的画布。

## 界面位置

插件向原生 Conversation 注册 `workflow-studio` 视图，顺序为：

```text
对话 → 工作流 → 轨迹
```

“对话”和“轨迹”保持官方实现；工作流是独立的中间标签页。

## 画布语义

- 每次官方 `workflow` 工具运行对应一个可选择的运行记录。
- 当前会话的主 Agent 显示为“编排 Agent”：它负责生成 workflow 脚本；Workflow Runtime 负责执行脚本，并通过 `agent()` 启动 subagent。
- Harness 报告的 phase 横向排列为阶段列。
- 同一 phase 内的 Agent 纵向排列，表示它们属于同一进度分组。
- 编排 Agent 与每个 subagent 之间的连线表示 DSH 原生父子执行关系。
- Agent 卡片随持久化事件实时切换运行中、已完成、失败、已取消或已中断状态。
- Agent 卡片从子会话实时读取 provider/model、原始任务输入和最终文本输出。
- 点击卡片可以查看完整输入、输出和该子会话成功写入或编辑的文件；点击文件可在 DSH 右侧预览。
- 双击卡片直接打开对应子会话。
- 历史刷新和实时追加使用同一投影，因此重连后的画布与运行时画布一致。

官方事件没有记录严格的 Agent 间依赖边。`parallel()` / `pipeline()` 的脚本调用结构也没有进入持久化事件；phase 只表示进度分组。因此画布只绘制可以证明的“调用方 Agent → workflow 子 Agent”关系，不会根据时间或脚本文本猜测 DAG。

子 Agent 本来就在当前 workspace 中执行，文件产物会保留在它实际写入的位置。插件不会默认复制到 `dshOutput/`：复制会改变工作区、污染 Git 状态，而且 alpha.4 对并行 Agent 的文件归属没有完整持久化协议。后续可以把 `dshOutput/` 实现为用户主动触发的导出功能，生成每个 Agent 的 input/output 清单并复制用户选择的文件，而不是影响正常执行。

## 开发

从项目根目录运行：

```sh
npm run build
npm run test:workflow
npm start
```

`npm run build` 会从 `src/` 确定性生成 `lib/client.js`。React 由 DSH 浏览器运行时提供，不需要为本插件单独安装依赖。
