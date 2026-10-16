# Figma：页面、交互与组件复用

[设计文件](https://www.figma.com/design/J3MYi2TF0UFcnzS86kZ2u3) 的 `02 · Revolution / Interactive v0.1` 是本次完整核心流程原型；旧 `01 · Product` 保留早期探索，不能当作最新页面。

新页包括 18 个 screen：主页、对话、Workflow、Agent 详情、失败状态、导出确认、导出完成、产物列表、产物预览、轨迹、通用设置、模型/API、保存反馈、插件、Skills/MCP、自动化列表、自动化编辑、浅色外观。

## 怎么点

选择首页 `REV / home / Revolution` → Present / Play。左侧导航切换模块；发送任务进入示例 Workflow；Agent 卡进入详情；失败示例进入错误页；导出进入确认再进入完成；产物列表打开文件预览；会话 tab 切对话/Workflow/轨迹；设置进入模型/API、保存反馈或浅色预览；自动化新建后返回列表。

Figma 中使用真实 prototype reactions，不只是写在旁边的说明文字。当前页自己的导航项不绑定跳转，避免自跳转错误。

## 复用

共用 REV Color/Metrics 变量与明暗模式。Button、Nav、Field、Badge、AgentCard 是主组件，页面使用实例和文字属性。中文字体 Noto Sans SC，英文 Geist。光影拳头来自 `assets/revolution-fist.svg`，进入 Figma 后仍为可编辑矢量。

可重建脚本：`design/figma-revolution-prototype.js`，需通过 Figma 插件 API 执行并注入 `FIST_SVG`，不是浏览器脚本。已有页面非空时拒绝覆盖，以保护设计修改。

## 原型不等于已开发

Figma 的模型保存、失败重试、自动化编辑等展示交互意图，不调用真实 API、不存 Key、不启动任务。部分页面是后续产品设计，而不是宣称全部已接通。实际运行仍使用 DSH 原生设置与插件界面；本次不改变 Workflow Studio 在设置中的可见性。

验收练习：从主页走完发送→Workflow→Agent→导出→产物→设置→API→返回会话，记录每一步是否有明确反馈。新增业务组件时先改主组件，检查所有实例，再做代码映射。
