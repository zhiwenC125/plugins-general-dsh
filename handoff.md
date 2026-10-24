# Revolution 开发交接

最后更新：2026-10-25

## 当前交付

当前桌面版本为 `0.1.4-preview.4`，运行时锁定 DeepSeek Harness `0.2.1-rc.2`。本轮已经打通个人飞书账号到本机 Revolution 的研发机器人闭环：

- 桌面启动前完成飞书身份授权，并把本机 profile 绑定到首次登录账号。
- 应用侧显示机器人名称、App ID、在线状态和断线状态。
- 飞书私聊可选择项目与 session、新建项目与任务、选择模型、读取结果和停止当前运行。
- 普通消息进入选定的 DSH session，完成后把真实文字结果返回飞书。
- 机器人只接受已绑定账号的私聊，消息 ID 去重；应用密钥和用户凭据不进入仓库。

2026-10-25 用户已在真实飞书私聊中确认 `/当前`、`/项目`、`/会话` 均能收到回复。自动测试覆盖完整命令路由、账号绑定、回复桥接和可选中转协议。

## 产品边界

当前默认方案是“每位用户安装自己的 Revolution，并授权自己的飞书应用”。电脑、Revolution 和网络需要保持在线。

`services/revolution-relay/` 保留统一机器人中转服务的可部署候选代码。它需要持续在线的 HTTPS 服务、域名和正式飞书应用配置；当前小项目没有这些基础设施，因此桌面构建不配置 `REVOLUTION_RELAY_URL`，继续使用个人模式。不要把 App Secret 打进公开安装包。

飞书聊天输入框上方的图形化项目、会话和模型选择器尚未实现；目前使用命令：

| 命令 | 功能 |
| --- | --- |
| `/当前` | 查看当前项目、会话和模型 |
| `/项目`、`/项目 <ID>` | 列出或选择项目 |
| `/会话`、`/会话 <ID>` | 列出或选择 session |
| `/新建项目 <名称>` | 创建并选择本机项目目录 |
| `/新建任务 <名称>` | 创建并选择 DSH session |
| `/模型`、`/模型 <提供商>/<模型ID>` | 列出或选择模型 |
| `/结果` | 返回 session 最近文字结果 |
| `/停止` | 取消 session 当前运行 |

## 关键目录

```text
apps/revolution/              Electron 桌面宿主、登录窗口和打包配置
plugins/revolution-knowledge/ 飞书身份、个人知识、机器人宿主及前端状态
integrations/bot/             命令解析、DSH 路由和飞书长连接
services/revolution-relay/    可选的统一机器人中转服务
plugins/workflow-studio/      DSH Workflow 事实投影
plugins/revolution-brand/     Revolution 品牌插件
scripts/                      构建、smoke、版本与签名检查
docs/                         产品、接入和历史设计文档
docs/archive/                 从根目录归档的专题文档
```

根目录只保留 `README.md` 与本交接文档作为项目入口。历史桌面指南和架构探索已经归档到 `docs/archive/`。Workflow 兼容约定也移到该目录，但沿用原有的“仅本地保存”规则，不进入公开提交。

## 构建与验证

安装依赖并准备桌面运行时：

```sh
npm run setup:revolution
```

常用检查：

```sh
npm run build
npm run build:brand
npm run build:knowledge
npm run test:workflow
npm run test:knowledge
npm run test:knowledge-app
npm run test:bot
npm run test:relay
node scripts/check-release.mjs
```

macOS Apple Silicon 固定预览版：

```sh
npm run package:preview:mac
```

脚本在 `/private/tmp` 构建，运行包内后端、登录窗口、签名 smoke，然后安装到：

```text
~/Applications/Revolution Preview.app
```

上一版保存在：

```text
~/Library/Application Support/Revolution Preview Builds/previous.app
```

打包前必须退出正在运行的 Revolution Preview。当前构建为 ad-hoc 签名，尚未 Developer ID 签名或 Apple 公证。

## 发布流程

- `.github/workflows/ci.yml` 负责插件构建、语法、机器人、中转服务和版本检查。
- `.github/workflows/release.yml` 负责 macOS ARM64、Windows x64、Linux x64 打包和包内 smoke。
- 手动运行工作流只生成临时 artifacts。
- `revolution-v<版本>` 标签构建成功后才创建 Draft Release，公开前仍需人工检查。
- Revolution 的 Git 远端是 `revolution`（`plugins-general-dsh.git`）；当前工作区的 `origin` 指向另一项目，不应用于 Revolution 合并或发布。

## 仍需继续

1. 把飞书命令升级为交互卡片或应用菜单，并显示运行中进度和长回复分页。
2. 继续验证 `/新建项目`、`/新建任务`、模型切换、真实模型回答和 `/停止` 的完整人工流程。
3. 完成 Developer ID 签名、公证、自动更新和 Intel Mac 策略。
4. 若未来具备服务器与域名，再开展统一机器人、跨组织发行和多人设备隔离；此前保持个人模式。
5. 继续按持久化事实显示 Workflow；不要根据时间或 phase 猜测 DAG 依赖。

## 文档入口

- [README](README.md)
- [飞书机器人目标与验收](docs/REVOLUTION-FEISHU-BOT-TARGET.md)
- [飞书接入清单](docs/CONNECTOR-SETUP.md)
- [桌面使用与发行归档](docs/archive/REVOLUTION_DESKTOP.md)
- [架构探索归档](docs/archive/REVOLUTION_EXPLORATION.md)
- [统一机器人中转服务](services/revolution-relay/README.md)
