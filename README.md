# ai-studio

基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的二次开发集合。

## 目录

- [`workflow-studio/`](workflow-studio/) — `dsh-workflow-studio` 插件：原生「Agent 工作流」画布与 DAG 运行器，把目标拆成可追踪的子 Agent 节点，在会话里可视化编辑、审查并执行。详见 [workflow-studio/README.md](workflow-studio/README.md)。
- [`dsh-studio`](dsh-studio) — 启动脚本，使用本地 `.dsh-smoke` web profile 拉起 DeepSeek Harness。

## 开发说明

`workflow-studio` 要求 Node.js >= 22.19，构建与测试无需第三方依赖：

```sh
cd workflow-studio
node scripts/build.mjs       # 从 src 生成 lib/client.js
node --test tests/*.test.js  # 运行全部测试
```

> 注意：`deepseek-harness/`（上游源码）、`.dsh-smoke/`（含凭据）、`.pnpm-store/` 均通过 `.gitignore` 排除，不参与提交。
