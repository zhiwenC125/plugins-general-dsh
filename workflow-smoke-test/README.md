# Workflow 插件检验案例（smoke test）

本案例用于端到端检验 DeepSeek Harness 的 `workflow` 工具 + `dsh-workflow-studio` 画布插件是否正常工作。

## 先明确：谁决定 Agent 数量

这决定了验收标准该怎么写。

| 角色 | 决定 Agent 数量吗 | 说明 |
| --- | --- | --- |
| 写 workflow 脚本的**模型 / Agent** | **是** | `agent()` 调用次数、`parallel()` 数组长度、`pipeline()` 的 items × stages，全部由脚本体决定 |
| **workflow runtime**（`workflow-ptc`） | 否，只设上限 | 并发上限默认 `min(16, availableParallelism() - 2)`；单次运行总数上限默认 `1000`；`parallel()` / `pipeline()` 单次条目上限默认 `4096`；同步超时默认 `5000ms`。均为 `Config`，可从 `cordis.yml` 调整 |
| **dsh-workflow-studio 插件** | 否，完全不参与 | 只读会话日志中 `tool-workflow/*` 四类事件做投影，不干预执行 |

结论：**跑几个 Agent 是脚本作者的选择，Harness 只兜底，插件只管显示。**
因此验收标准不能写死数量，只能写自洽不变量（见下文第 2 节）。

## 文件

- [`script.js`](script.js) — 脚本体（纯 JS，无 `export const meta`）。
- [`meta.json`](meta.json) — workflow 身份（name / description / phases）。
- [`args.json`](args.json) — 传入脚本的 `args` 全局对象。
- [`prompt.md`](prompt.md) — 可直接粘贴给 Agent 的文字版检验提示词。

参考脚本覆盖了 workflow 脚本引擎的全部 hook：

| Hook | 在参考脚本中的位置 | 期望（结构性） |
| --- | --- | --- |
| `phase(title)` | `Discover` / `Build` / `Verify` | 每个 phase 对应画布一个阶段列，横向排列 |
| `log(message)` | 各阶段开始 / 结束 | 运行过程中有进度叙述（调试可见） |
| `parallel(thunks)` | `Discover` 阶段 | 同一 phase 内并发的 agent 卡片纵向排列 |
| `pipeline(items, ...stages)` | `Build` 阶段 | 同一 phase 内多阶段条目纵向排列 |
| `agent(prompt, {label})` | 每个 agent | 卡片标题显示对应 label |
| `agent(prompt, {schema})` | `verify-verdict` | 结构化输出校验通过，返回对象 |
| `args` | `args.smokeTestName` | 脚本能读到传入参数并写进返回值 |

## 前置条件

在项目根目录完成构建并启动（见根目录 `README.md`）：

```sh
npm run build     # 构建 Workflow Studio 插件（生成 lib/client.js）
npm start         # 启动 Web 界面
```

确认出现「工作流」标签页，顺序为：**对话 → 工作流 → 轨迹**。

## 运行方式

在 DSH 对话里让 Agent 调用 `workflow` 工具：

- `script` = [`script.js`](script.js) 全文
- `meta` = [`meta.json`](meta.json) 内容
- `args` = [`args.json`](args.json) 内容

等价的一次工具调用（把 `"<script.js 全文>"` 换成脚本内容）：

```json
{
  "script": "<script.js 全文>",
  "meta": { "name": "workflow-plugin-smoke", "description": "...", "phases": [ { "title": "Discover" }, { "title": "Build" }, { "title": "Verify" } ] },
  "args": { "smokeTestName": "workflow-plugin-smoke" }
}
```

> 默认前台运行；也可加 `"run_in_background": true`，返回 `jobId` 后用 `job_output` 查看。

## 期望结果与验收清单

记 **N** = 本次运行脚本实际调用的 `agent()` 次数，**P** = 脚本实际调用的 `phase()` 次数。
N 和 P 由脚本决定；检验时先读出实际值，再核对下面的不变量。

### 1. 工具返回值（形式）

```json
{
  "kind": "foreground",
  "runId": "<run-id>",
  "agentsStarted": <N>,
  "result": { "...": "脚本 return 的 JSON 对象" }
}
```

关键在于 `agentsStarted` 等于**脚本实际发起的 agent 数**，而不是等于某个预设数字。

### 2. 自洽不变量（真正的判据）

- [ ] 会话日志中 `tool-workflow/run-start` 恰好 1 条、`run-end` 恰好 1 条。
- [ ] `tool-workflow/agent-start` 恰好 N 条，`tool-workflow/agent-end` 恰好 N 条。
- [ ] 工具返回的 `agentsStarted` == N == `agent-start` 条数。
- [ ] 每个 `agent-start.seq` 有且仅有一个同 `seq` 的 `agent-end` 配对。
- [ ] `run-end.stopReason == "completed"`。
- [ ] 「工作流」标签页出现 1 条运行记录，名称为 `meta.name`。
- [ ] 画布子 Agent 卡片数 == N；阶段列数 == P。
- [ ] 同一 phase 的卡片落在同一列、纵向排列；不同 phase 横向成列。
- [ ] 若所有 `agent-end.outcome == "completed"`，则所有卡片显示「已完成」，编排 Agent 也显示「已完成」。
- [ ] 每张卡片显示该子会话的 provider / model、输入与最终输出。
- [ ] 编排 Agent 与每个子 Agent 之间有连线。
- [ ] 点击卡片可查看完整输入、输出与文件；点击文件可在右侧预览。
- [ ] 双击卡片能打开对应子会话。

### 3. 参考脚本的具体值

[`script.js`](script.js) 是**固定结构**版本：P = 3、N = 8（2 个 `parallel` + 2×2 `pipeline` + 2 个 verify）。
这只是这个脚本自己的选择，不是 Harness 的要求。若改用 [`prompt.md`](prompt.md) 里的自由结构版（由 Agent 自己决定数量），把 N、P 换成实际值即可，其余不变量不变。

### 4. 文件产物

运行后工作区应出现 [`smoke-result.md`](smoke-result.md)，标题为 `Workflow Smoke Test Result`，含 `Headlines` 小节。

## 判据

- **通过**：第 2 节的不变量全部成立。
- **不通过**：任一条不变量被破坏——例如事件缺失、`agent-start` 与 `agent-end` 数量不等、卡片数 ≠ N、阶段列数 ≠ P、状态卡在「运行中」。
- **注意**：N 不等于某个预设值**不算失败**，数量本来就是脚本决定的。

## 调试提示

画布读取的是会话日志里的四类持久化事件，出问题时可先在轨迹里核对：

- `tool-workflow/run-start` → `{ runId, name }`
- `tool-workflow/agent-start` → `{ runId, seq, label, phase?, childId }`
- `tool-workflow/agent-end` → `{ runId, seq, outcome }`
- `tool-workflow/run-end` → `{ runId, stopReason }`

只要这四类事件完整且自洽，画布投影就应成立；若事件正常而画布仍为空，问题在插件的 `lib/client.js` 构建 / 注入，而不是 workflow 执行本身。
