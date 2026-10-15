# Plugins

本目录集中存放本项目基于 DeepSeek Harness 开发的插件。每个插件使用独立子目录，包含自己的 `package.json`、源码、构建产物、测试和说明。

当前插件：

- [`workflow-studio/`](workflow-studio/)：DSH 原生 Workflow 的实时画布可视化。

新增插件时，不要把业务协议直接耦合进其他插件；跨插件共享的事件约定应先形成版本化契约。
