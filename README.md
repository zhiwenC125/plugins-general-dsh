# Plugins for General DSH

基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的二次开发集合。

## 目录

- [`plugins/`](plugins/) — 本项目的 DSH 插件集合。
- [`plugins/workflow-studio/`](plugins/workflow-studio/) — `dsh-workflow-studio` 插件：把 DeepSeek Harness 原生 `workflow` 运行实时投影为位于“对话”和“轨迹”之间的画布。详见 [plugins/workflow-studio/README.md](plugins/workflow-studio/README.md)。
- [`WORKFLOW_COMPATIBILITY.md`](WORKFLOW_COMPATIBILITY.md) — DSH 原生 Workflow 与 Nexus 持久化 DAG 两种范式的兼容及迁移约定。
- [`dsh-studio`](dsh-studio) — 启动脚本，使用 `deepseek-harness/` 源码和本地 `.dsh-smoke` web profile 拉起 DeepSeek Harness。

## 启动与构建

所有命令都从本项目根目录执行，不需要进入 `deepseek-harness/`：

```sh
npm run setup       # 首次使用或上游依赖变化后安装依赖
npm run build       # 构建 Workflow Studio
npm run build:harness # 仅在上游源码变化后构建 DeepSeek Harness
npm start           # 启动 Web 界面
npm run version:dsh # 查看当前 DSH 版本
```

## Workflow Studio 开发

`plugins/workflow-studio` 要求 Node.js >= 22.19，构建与测试无需第三方依赖：

```sh
npm run build
npm run test:workflow
```

> 注意：`deepseek-harness/`（上游源码）、`.dsh-smoke/`（含凭据）、`.pnpm-store/` 均通过 `.gitignore` 排除，不参与提交。

更新上游源码后，在项目根目录依次运行 `npm run setup`、`npm run build:harness` 和 `npm start`。日常修改 `plugins/workflow-studio/` 后只需运行 `npm run build`。根目录命令不要求全局安装 pnpm；首次 setup 会通过 npm 获取锁定的 pnpm 版本，后续命令使用 Harness 仓库内的本地 pnpm。
