# 文字版检验案例（复制粘贴给 Agent 即可）

核心原则：**agent 数量由脚本作者（模型）决定，Harness 只兜底上限，画布插件只做投影。**
所以验收用「自洽不变量」，不写死数量。

---

## 主检验提示词（自由结构版，推荐）

```text
请用 workflow 工具执行一次 workflow 插件检验工作流，验证 workflow 工具与「工作流」画布是否正常工作。

脚本要求（agent 的数量与阶段结构由你自己决定，只要覆盖这些 hook）：
- 至少 3 次 phase() 划分阶段；
- 用 parallel() 并发跑一组 agent；
- 用 pipeline() 跑一组多阶段条目；
- 至少 1 个 agent 带 label；
- 至少 1 个 agent 带 schema，返回结构化对象；
- 至少 1 个 agent 写一个文件到工作区，用来验证画布的文件预览；
- 用 log() 叙述进度，脚本最后 return 一个 JSON 对象。

跑完后按「自洽不变量」逐项报告，不要拿固定数量当判据。记 N = agent-start 条数，P = 脚本里 phase() 的调用数：
1. run-start 恰好 1 条、run-end 恰好 1 条，且 stopReason = completed；
2. agent-start 条数 == agent-end 条数 == N，且每个 start 的 seq 都有唯一配对；
3. 工具返回的 agentsStarted == N；
4. 「工作流」标签页出现 1 条运行记录，阶段列数 == P，子 Agent 卡片数 == N；同一 phase 的卡片同列纵向排列，不同 phase 横向成列；
5. 若所有 agent-end.outcome = completed，则所有卡片显示「已完成」，编排 Agent 也显示「已完成」；
6. 有文件产出的那张卡片能列出该文件，并能在右侧预览。

最后汇报：本次 N 和 P 分别是多少、以上不变量是否全部成立、workflow 插件是否工作正常。
```

---

## 固定结构版（需要可复现对比时用）

```text
请读取 workflow-smoke-test/ 下的 meta.json、args.json、script.js，用 workflow 工具跑一遍，然后按 README.md 第 2 节的自洽不变量逐项报告通过/不通过。该脚本固定为 3 个 phase、8 个 agent——这属于脚本自身的选择，不是 Harness 的要求。
```

---

## 极简版（只做快速冒烟）

```text
用 workflow 工具跑一个两阶段工作流：第一阶段用 parallel() 并发若干 agent，第二阶段用 1 个 agent 汇总，数量你自己定。跑完后告诉我：agentsStarted 是多少、agent-start 与 agent-end 条数是否相等、事件链 run-start→agent-start→agent-end→run-end 是否完整、「工作流」标签页有没有出现对应卡片。
```
