# 本轮交付验收 · 2026-10-17

## 远端真实运行

[三平台预览构建](https://github.com/zhiwenC125/plugins-general-dsh/actions/runs/38946301625)：success。

- macOS ARM64：打包、包内 DSH 后端 HTTP 与插件注册、校验和、artifact 上传通过。
- Windows x64：同上通过。
- Linux x64：同上通过。
- 非 tag 分支运行，publish job 跳过，**没有发布正式 Release**。

运行使用提交 `3ac78d69b6dc3efa87e5538ab455bcc82f8804f3`。后续 `f9058bb` 仅整理 Figma 脚本与审计，没有修改桌面运行代码；其[轻量 CI](https://github.com/zhiwenC125/plugins-general-dsh/actions/runs/38946571259)通过。

在运行页面底部下载 `revolution-macOS-ARM64`、`revolution-Windows-X64` 或 `revolution-Linux-X64`。这是有三天有效期的临时 artifact，不是永久下载链接。每个平台包含安装包及 SHA256SUMS 文本。

## 本地与设计验收

Workflow 单元测试 7 项通过；源码版和打包后的 macOS 后端 smoke 均通过。更新的本机预览包位于 `dist/next/`，旧包未覆盖。

Figma：18 页全部可从首页到达，245 处导航 reaction、8 个主组件、225 个实例，按钮/导航具备 Variant Sets。主页、Workflow、API 设置截图已检查；页面 auto-layout 边界无溢出。

## 尚未代表完成的内容

这些检查不等于三平台真实 GUI 全流程测试，不包含付费 API 推理、签名/公证、自动更新、API Key 安全审计或正式发布。Jev 仍为研究方案，未接入运行时。Figma 中的演示状态不等于相应业务功能已经开发。

所有交付在[草稿 PR #1](https://github.com/zhiwenC125/plugins-general-dsh/pull/1)，未合并 main。原工作区、用户的 prompt-business 修改、iCloud 的 ` 2` 副本和原私人照片均未被删除；私人照片没有上传。
