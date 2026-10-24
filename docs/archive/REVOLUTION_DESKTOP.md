# Revolution 本地使用与发行

## 当前交付

Revolution `0.1.4-preview.4` 锁定 DeepSeek Harness **0.2.1-rc.2**，包含 Web UI、Workflow Studio、品牌、个人知识自动召回、飞书身份绑定和私聊研发机器人。它不依赖本仓库忽略的 `deepseek-harness/` 或 `.dsh-smoke/`。2026-10-25 已完成真实飞书 `/当前`、`/项目`、`/会话` 往返验收；已发布的旧安装包不会自动升级。

0.1.0 macOS 安装包存在包内签名完整性问题，不再推荐。0.1.1 起改用 ad-hoc 签名和签名/窗口加载检查，但没有 Developer ID 或 Apple 公证，仍可能被 Gatekeeper 拦截。发放与人工验收见 [内测指南](../BETA_TESTING.md)。

默认数据位于 `~/.revolution`，通过 `REVOLUTION_HOME` 可指定其他目录。首次启动创建专用 `revolution` profile；原有 DSH 设置不会被复制。API、模型、插件、权限、会话与定时任务继续由 DSH 原生服务管理。

从 0.1.1 升级时，先备份 `~/.revolution` 并在副本 profile 验证自己的模型、插件和会话。DSH 0.2.1-rc.1 的上游升级说明提到 Web/桌面优先使用已保存凭据、Azure 提供商命名调整，以及部分会话恢复和设置行为修复；已有自定义提供商或旧会话的用户需要单独回归。Revolution 没有替用户迁移旧的外部 DSH profile。[DSH 官方发布说明](https://github.com/deepseek-ai/deepseek-harness/releases)

## 使用

已经生成的 macOS Apple Silicon 预览包位于 `dist/`。打开 `Revolution.app`，或通过 DMG 安装。此版未签名、未公证；macOS 可能要求用户在系统设置中允许打开。请先复制到应用程序目录，不要在只读 DMG 中长期运行。

从源码运行：

```sh
npm run setup:revolution
npm run start:revolution
```

浏览器版：

```sh
npm run web:revolution
```

终端会显示带一次性本地授权 token 的地址。服务绑定 `127.0.0.1`，使用后端内置鉴权。桌面包包含独立 Node 24，渲染进程禁用 Node integration。

## 配置自己的 API

1. 打开左下角账号菜单 → 设置 → 模型。
2. 在 DeepSeek 提供商中输入自己的 API Key。
3. 需要自定义地址时展开“自定义设置”；其他协议使用“添加模型提供商”。
4. 保存后，在会话输入框选择模型并发送任务。

API Key 通过 DSH 凭据服务保存；不填入仓库、构建参数或 GitHub Secrets。当前只验证了设置页和运行时启动，未使用用户 Key 发起计费模型调用。

左侧“插件”保留原生插件管理、内置插件配置和实验性开关；“自动化任务”保留原生定时任务。Workflow 标签在会话内呈现原生运行记录；没有 Workflow 的新会话不会显示虚构运行。

## UI 与品牌

- Figma：[Revolution UI](https://www.figma.com/design/J3MYi2TF0UFcnzS86kZ2u3)。最新 `02 · Revolution / Interactive v0.1` 包含十八个核心流程页面、八个主组件与点击跳转。原页保留早期探索。
- 实际应用复用 DSH 原生布局与设置逻辑；Figma 中新增设置样式是后续视觉目标，不能把设计截图当成已经逐像素实现的页面。
- `plugins/revolution-brand/` 通过官方品牌 slots 替换 sidebar 和 hero 标识，并通过 ThemeRuntime 覆盖 light/dark token。
- 应用图标为原创 R/V 联字：黑色底、米白 R、荧光绿 V。会话空状态使用原创光影拳头矢量。
- Workflow 增加运行概览、文件类型标签、键盘可操作导出弹窗和减少动效支持。

## 验证

```sh
npm run build
npm run build:brand
npm run test:workflow
node scripts/prepare-desktop.mjs
node scripts/smoke-runtime.mjs
npm --prefix apps/revolution run package:dir
node scripts/smoke-runtime.mjs dist/mac-arm64/Revolution.app/Contents/Resources/app/runtime.mjs
```

若源码位于 iCloud Drive，Finder 可能在打包过程中给 `.app` 添加扩展属性，使 macOS `codesign` 报 `resource fork, Finder information, or similar detritus not allowed`。此时可把**构建输出**放在本机临时目录，再对该目录中的 `.app` 运行包内 smoke 与签名检查：

```sh
npm --prefix apps/revolution run package:dir -- --config.directories.output=/private/tmp/revolution-build
node scripts/smoke-runtime.mjs /private/tmp/revolution-build/mac-arm64/Revolution.app/Contents/Resources/app/runtime.mjs
node scripts/verify-mac.mjs /private/tmp/revolution-build/mac-arm64/Revolution.app
```

smoke 测试启动全新临时 profile，验证内置服务的 HTTP 鉴权握手以及两个客户端插件的 boot roster，结束后清理测试数据。它不发送模型请求。

## GitHub CI/CD

推荐 GitHub Actions + GitHub Releases。公开仓库的标准 GitHub-hosted runner 免费；私有仓库受所属账户免费分钟和存储额度限制。费用规则见 [GitHub 官方说明](https://docs.github.com/en/actions/concepts/billing-and-usage)。代码签名和 Apple 公证不包含在 GitHub 免费构建中。

工作流：

- `.github/workflows/ci.yml`：PR 和 main push 运行无依赖插件构建、语法与投影测试，检查 bundle 是否与源文件一致。
- `.github/workflows/release.yml`：手动触发或推送 `revolution-v*` tag，在 macOS ARM64、Windows x64、Linux x64 上锁定安装、打包和验证包内运行时。
- 手动构建仅上传三天有效的 artifacts；tag 构建在三平台成功后创建 **draft Release**，由仓库维护者审阅后公开。
- 只用内置 `GITHUB_TOKEN`，发布 job 才获得 `contents: write`。不需要 API Key、COS、Vercel 或自建服务器。
- PR 不进行昂贵的多平台打包；并发检查自动取消旧任务。

操作步骤与免费边界见 [CI/CD 教程](../knowledge/01-ci-cd.md)。分支 CI 自动检查；手动构建生成三平台临时安装包；匹配版本的 tag 才建立草稿 Release。远端运行状态以 GitHub Actions 为准，不能仅凭 YAML 存在就声称已通过。Windows/Linux 需由对应 Runner 验证。

如果仓库保持私有，请在 GitHub Billing 中设置付费用量预算，避免额度耗尽后继续计费。公开仓库标准 Runner 可作为接近零成本的首选方案。Artifacts 只保留三天，正式安装包放 Releases。

## 尚待完成

- Figma 设置视觉逐项落地；当前设置和插件使用完整原生 DSH UI。
- 图片缩略图、JSON 内容格式化与 diff 深度预览；本轮仅完成文件类型分类与原生预览入口。
- 原生桌面深度集成：目录选择、自动更新、签名、公证、平台菜单本地化。
- 真实 API 与工具执行回归（需要用户选择提供商和凭据）。
- Runtime DAG/Artifact 协议修改继续暂缓。

## Mac 固定预览版入口

本机联调使用 `npm run package:preview:mac`。脚本在 `/private/tmp` 中构建、执行 runtime 与登录窗口 smoke test 及签名验证，然后将唯一的当前预览版放到 `~/Applications/Revolution Preview.app`。旧版备份在 `~/Library/Application Support/Revolution Preview Builds/previous.app`，不会与当前版一起出现在 Applications。预览版 Finder 版本号为 `0.1.4-preview.4`，窗口标题为 `Revolution Preview · Feishu R4`。

启动前退出其他 Revolution 窗口；同一用户资料使用单实例锁，旧实例仍运行时打开新包只会激活旧窗口。首次使用需要在独立登录窗口完成飞书授权；本机资料绑定首次登录的飞书应用和账号，退出后须以同一身份重新登录。进入工作区后，在侧栏底部核对「飞书机器人在线」，或在「设置 → 飞书与知识库」查看详细状态。不要从 `/private/tmp` 的构建目录启动测试版。

## 统一机器人 R4 开发候选

源码版本 `0.1.4-preview.4` 增加统一机器人中转协议。本机固定预览版已安装 R4，但因尚无中转服务地址，当前包使用现有个人机器人模式；上一个 R3 安装包保存在 `~/Library/Application Support/Revolution Preview Builds/previous.app`。服务端部署与飞书配置见 [中转服务说明](../../services/revolution-relay/README.md)。构建时提供 `REVOLUTION_RELAY_URL=https://<域名>`，桌面包会内置该公开地址；不提供时保留每人自建飞书应用的个人模式。实际面向其他人发布仍需服务器、域名、飞书应用配置、跨电脑验收和安装包信任检查。
