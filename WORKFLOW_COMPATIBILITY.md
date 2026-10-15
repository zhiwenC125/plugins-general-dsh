# DSH / Nexus Workflow 兼容与迁移约定

本文面向后续维护者以及公司环境中读取本仓库的 AI。目标是在无法共享公司源码的情况下，明确 Nexus Workflow 应如何兼容不同 DSH alpha 版本，以及如何把公司已有的持久化 DAG 接入当前画布。

## 结论先行

1. DSH `0.1.x-alpha.1/.2` 与 `0.2.1-alpha.1/.2` 的官方持久化 Workflow 记录都不是完整 Agent DAG。
2. 这些版本记录运行、子 Agent 生命周期、phase 和 child session，但没有持久化节点依赖边、值的来源/去向或 artifact 流转。
3. Nexus 自己增加持久化 DAG 事件并不是错误，也不违背 DSH 的事件驱动哲学；它属于 Nexus 拥有的扩展协议。
4. 正确做法不是让 UI 直接判断 DSH 版本，而是让不同事件协议经过 adapter 投影到同一个规范化视图模型。
5. 任何边必须来自持久化事实。禁止根据时间顺序、phase、label 或脚本文本猜测 Agent A → Agent B。

## 1. 已核实的 DSH 版本事实

本仓库通过本地 DSH Git 历史核对了以下 tag：

- `dsh-v0.1.2-alpha.1`
- `dsh-v0.1.2-alpha.2`
- `dsh-v0.1.7-alpha.1`
- `dsh-v0.1.7-alpha.2`
- `dsh-v0.2.1-alpha.1`
- `dsh-v0.2.1-alpha.2`

这些版本的 `tool-workflow` 持久化记录均以四类事件为核心：

- `tool-workflow/run-start`
- `tool-workflow/agent-start`
- `tool-workflow/agent-end`
- `tool-workflow/run-end`

其中 Agent start 的有效事实主要是：

```text
runId, seq, label, phase?, childId
```

没有以下字段或等价信息：

```text
dependsOn, sourceNodeId, targetNodeId, inputRef, outputRef, artifactRef
```

`parallel()` 和 `pipeline()` 是脚本执行组合器。即使 `pipeline()` 在内存中把前一 stage 的返回值传给下一 stage，官方持久化事件也没有把这条数据依赖保存为可重放的 DAG edge。`phase` 的官方语义是进度词汇/分组，不施加执行结构。

如果公司使用的“alpha1/alpha2”属于其他 release line，请公司侧 AI 用本文末尾的核对清单再次检查；不要只根据版本简称做判断。

## 2. 两种受支持的 Workflow 范式

### 范式 A：DSH 原生生命周期投影

数据源是 DSH 官方 `tool-workflow/*` 持久化事件。

可显示：

- Workflow run。
- 调用方 Agent。
- 子 Agent 与 child session。
- phase 分组。
- Agent 状态。
- 从子会话读取的输入、最终输出和可识别文件。
- “调用方 Agent → 子 Agent”的父子调用边。

不可声称：

- Agent A 的输出必然是 Agent B 的输入。
- phase 之间存在严格依赖。
- `seq` 相邻就代表数据流。
- 某文件一定属于某个 Agent 或一定是最终产物。

### 范式 B：Nexus 持久化 DAG / 数据流

数据源是 Nexus 自己定义并写入 Session 的版本化领域事件。只要这些事件具备稳定语义、能够重放并保持顺序/幂等，便是合理的 DSH 扩展。

Nexus 可额外显示：

- Agent/步骤节点之间的真实依赖边。
- 一个节点的哪些输出被用作另一个节点的哪些输入。
- artifact 的产生、版本和消费关系。
- 最终结果由哪些节点与 artifact 汇聚而成。

Nexus 事件必须使用自己的命名空间，例如 `nexus-workflow/v1/*`，不要复用并篡改官方 `tool-workflow/*` 的字段语义。

## 3. 统一的规范化视图模型

UI 不应直接消费两种协议。每种协议先经过 adapter，输出同一个规范化模型：

```ts
interface WorkflowViewModel {
  protocol: {
    family: 'dsh-native' | 'nexus-dag'
    version: string
    capabilities: Array<'lifecycle' | 'phase' | 'dependency-edges' | 'data-flow' | 'artifacts'>
  }
  runs: WorkflowRunView[]
}

interface WorkflowRunView {
  id: string
  name: string
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'interrupted'
  orchestrator?: { id: string; label: string }
  nodes: WorkflowNodeView[]
  edges: WorkflowEdgeView[]
  artifacts: WorkflowArtifactView[]
}

interface WorkflowNodeView {
  id: string
  kind: 'orchestrator' | 'agent' | 'step'
  label: string
  phase?: string
  childSessionId?: string
  status: string
  inputRefs: string[]
  outputRefs: string[]
}

interface WorkflowEdgeView {
  id: string
  from: string
  to: string
  kind: 'invokes' | 'depends-on' | 'data-flow'
  payloadRefs?: string[]
  evidence: { eventType: string; eventId?: string }
}

interface WorkflowArtifactView {
  id: string
  producerNodeId?: string
  uri: string
  mediaType?: string
  role: 'intermediate' | 'final' | 'unknown'
}
```

核心约束：

- DSH adapter 只产生 `invokes` 边，除非未来官方事件明确增加依赖证据。
- Nexus adapter 可以产生 `depends-on` 和 `data-flow` 边，但每条边必须带持久化事件证据。
- UI 根据 `capabilities` 开关功能，不根据 `alpha.1`、`alpha.2`、`alpha.4` 字符串写条件分支。
- 未知信息用空数组或 `unknown` 表达，不能用推测填充。

## 4. Nexus 建议事件协议

如果公司已有协议，优先写 adapter，不要为了与本文示例一致而破坏已有历史。若需要升级，可参考下列最小事件族：

```text
nexus-workflow/v1/run-start
nexus-workflow/v1/node-start
nexus-workflow/v1/node-end
nexus-workflow/v1/edge-declared
nexus-workflow/v1/artifact-produced
nexus-workflow/v1/artifact-consumed
nexus-workflow/v1/run-end
```

建议公共 envelope：

```json
{
  "schemaVersion": 1,
  "eventId": "stable-unique-id",
  "runId": "run-id",
  "occurredAt": "2026-10-16T00:00:00.000Z",
  "type": "nexus-workflow/v1/edge-declared",
  "data": {}
}
```

建议依赖边数据：

```json
{
  "edgeId": "edge-a-b",
  "fromNodeId": "agent-a",
  "toNodeId": "agent-b",
  "kind": "data-flow",
  "payloadRefs": ["value:a:final", "artifact:report-json"]
}
```

建议 artifact 数据至少包含：

```json
{
  "artifactId": "artifact:report-json",
  "producerNodeId": "agent-a",
  "uri": "workspace://reports/result.json",
  "mediaType": "application/json",
  "role": "intermediate"
}
```

协议设计要求：

- `eventId`、`runId`、`nodeId`、`edgeId`、`artifactId` 稳定且不依赖显示名称。
- 事件 append-only，可从零完整重放。
- 重复投递幂等；乱序策略明确。
- 终态不可被普通旧事件倒退。
- schemaVersion 明确，升级通过新 adapter 或迁移器处理。
- 事件只保存可公开到该 Session 的引用或摘要，不绕过公司的信息安全边界。

## 5. 公司侧 AI 的迁移任务

公司侧能够拉取本仓库但不能向外提供公司源码时，请让公司 AI 执行以下步骤：

1. 阅读本文件、根目录 `handoff.md` 与 `plugins/workflow-studio/README.md`。
2. 确认公司 DSH 的精确完整版本，不接受“alpha1/alpha2”简称。
3. 搜索公司事件注册和追加位置，列出所有 Nexus Workflow 事件及字段。
4. 检查事件是否真实持久化在 Session，而非仅存在于内存 event bus。
5. 检查从历史 Session 重放是否能得到与实时运行完全相同的节点和边。
6. 将现有公司事件映射到本文的规范化视图模型；优先增加 adapter，避免重写 UI。
7. 若历史协议缺少 `schemaVersion`，先建立 legacy adapter，再定义新版事件，避免破坏旧会话。
8. 将安全敏感 payload 留在公司环境，仅在模型中保留 ID、类型、受控 URI 或摘要。
9. 补充契约测试：同一事件序列的实时追加与全量重放输出必须深度相等。
10. 对无法由事件证明的边降级为“不显示”，不要猜测。

## 6. 公司侧版本核对命令

在公司仓库中可使用以下只读命令定位事实：

```sh
git describe --tags --always
rg -n "tool-workflow/|nexus-workflow/|agent-start|edge-declared|dependsOn|artifact" .
rg -n "SessionEventMap|session.append|append\(" packages plugins src
```

重点查看：

- Workflow tool 的 Session event 类型声明。
- 写入持久化 Session 的 `append` 调用。
- live event bus 与 durable Session event 是否被混为一谈。
- 投影器是否使用稳定 ID 去重。
- 历史重放是否依赖当时已经不存在的内存对象。

## 7. 本仓库后续实现入口

当前 DSH adapter 位于：

- `plugins/workflow-studio/src/projection.js`
- `plugins/workflow-studio/src/child-preview.js`

后续建议新增：

```text
plugins/workflow-studio/src/adapters/dsh-native.js
plugins/workflow-studio/src/adapters/nexus-dag.js
plugins/workflow-studio/src/model.js
```

迁移时先把现有投影逻辑移动到 `dsh-native` adapter，保持行为不变；然后在公司仓库实现 `nexus-dag` adapter。不要在公开仓库中写入公司专属事件内容、内部路径、业务数据或凭据。

## 8. 验收标准

- 相同持久化事件序列在实时执行和历史重放后得到相同画布。
- DSH 原生模式只显示父子调用边。
- Nexus 模式只显示有持久化证据的 DAG/数据流边。
- 未知或不支持的事件版本 fail closed：保留基础视图并隐藏无证据能力。
- 协议升级不会破坏旧 Session 的读取。
- UI 组件不包含针对具体 alpha 版本的业务判断。
- 导出 `dshOutput/` 时引用规范化节点与 artifact ID，而不是通过文件修改时间猜归属。
