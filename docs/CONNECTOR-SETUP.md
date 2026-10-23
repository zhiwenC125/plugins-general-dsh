# 个人飞书知识库与消息入口接入清单

更新：2026-10-24。本清单只用于**自己注册的个人飞书账号**试验；公司发放的飞书工作账号是另一身份。个人原创、获准复用的文章可通过个人 GitHub 导入公司 DSH 平台，公司资料及凭据不得回流个人服务。

## 现在需要你在个人飞书完成的操作

1. 使用个人账号登录[飞书开放平台开发者后台](https://open.feishu.cn/app)，确认能否创建应用。新建一个仅用于个人试验的应用；若界面要求组织管理员审批或账号不能创建应用，只记录限制，不要在公司账号代建。
2. 在个人飞书云文档创建专用文件夹，例如 `Revolution Knowledge`。再打开「云文档 → 知识库 → 新建知识库」，创建同名的飞书 Wiki 知识库；这里指飞书云文档的 Wiki，**不是飞书 aily 的知识空间**。[飞书官方知识库操作](https://www.feishu.cn/hc/zh-CN/articles/807073676453-%E9%A3%9E%E4%B9%A6%E7%9F%A5%E8%AF%86%E5%BA%93-%E6%9E%84%E5%BB%BA%E4%BC%81%E4%B8%9A%E4%B8%8E%E4%B8%AA%E4%BA%BA%E7%9A%84%E4%B8%93%E5%B1%9E%E6%99%BA%E5%BA%93) 两处都用于保存**同一批完整文章**。记下文件夹 URL 和 Wiki 知识库设置页 URL；现有 CLI 从中取得 folder token 和 space ID，但不要把链接或 ID 放进公开 issue。
3. 在应用「权限管理」中，按[创建云文档](https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document/create)、[读写文档块](https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document-block/create)、[创建 Wiki 节点](https://open.feishu.cn/document/server-docs/docs/wiki-v2/space-node/create)各接口页显示的**当前用户身份**权限申请最小范围。还需要目标文件夹和知识空间本身允许该用户编辑；API 权限与资源权限是两层。权限名以控制台和接口页实时显示为准。
4. 在应用「安全设置」登记 OAuth 回调地址，并用该**个人账号**完成用户授权，取得临时 `user_access_token`。当前 CLI 只读取进程环境变量，尚未实现 OAuth 登录与自动刷新；可先在飞书官方 API 调试台验证授权。令牌到期后需重新获取。[飞书访问凭证与权限错误说明](https://open.feishu.cn/document/server-docs/api-call-guide/generic-error-code)
5. 在自己电脑的终端或受保护的本地密钥管理器配置 `FEISHU_USER_ACCESS_TOKEN`、`FEISHU_DOC_FOLDER_TOKEN`、`FEISHU_WIKI_SPACE_ID`，再按下方命令查看本地配置与试运行结果。首次 dry-run 只列出待创建的文章，**不验证飞书 API 权限**；确认是个人试验目录后，执行真实同步，程序会读回核对。**不要通过聊天、GitHub、截图、录屏或日志发送 App Secret、令牌、回调密钥。**

在电脑终端进入本仓库目录后运行：

```sh
npm run kb -- doctor
npm run kb -- sync-docs --dry-run
npm run kb -- sync-wiki --dry-run
```

`doctor` 显示 `configured` / `missing`，不显示密钥值。dry-run 成功时显示 5 篇的 `create` / `current` / `update`；失败时终端会显示 `code <数字>` 和错误说明。首次真实同步可分别运行 `npm run kb -- sync-docs`、`npm run kb -- sync-wiki`；这两条会向个人飞书创建文档并读回，需先确认目录与空间完全属于个人试验账号。

只需向我反馈非密钥结果：个人账号能否创建 Wiki 空间、`doctor` 三项是否都为 `configured`、上述两条 dry-run 的状态或错误码。个人账号创建应用已确认可用；真实飞书 API 仍待首次同步验收，代码当前仅通过模拟 API 测试。

## 飞书机器人

在同一个试验应用启用「机器人」能力，申请接收消息、回复/发送消息所需权限并发布个人测试版本。用个人账号将机器人加入测试会话，在事件订阅中配置消息事件。[官方机器人概览](https://open.feishu.cn/document/client-docs/bot-v3/bot-overview)

本地联调可考虑[官方长连接接收事件](https://open.feishu.cn/document/ukTMukTMukTM/uYDNxYjL2QTM24iN0EjN/event-subscription-configure-)；该方式目前仅支持企业自建应用，须先确认个人账号应用类型是否适用。面向所有 Revolution 用户时，个人应用凭据不能作为全体用户的共享凭据：后续需要可跨租户授权的应用方案，或允许每个用户/租户配置自己的应用，并将授权与会话隔离。

## 微信机器人

已选定[微信对话开放平台](https://chatbot.weixin.qq.com/)创建机器人。先在该平台建立个人试验机器人，并查看当前控制台提供的「开发接口／高级技能／渠道接入」文档与示例。请提供**官方接口文档链接或遮盖密钥后的字段与回调示例**，以确认它如何把请求转发到 Revolution，以及支持哪些微信渠道。平台无关的消息路由已实现；不根据旧文章猜测当下的请求格式、签名或回复协议。普通个人微信号任意好友/群聊自动收发不作为全用户接入方案。

微信对话开放平台机器人如果需要绑定公众号或小程序，应在其控制台按当前说明完成渠道绑定；若要让平台调用 Revolution，还需一个它能访问的服务地址，本机 `127.0.0.1` 不能作为公网回调。拿到该平台当前接口规范后，再实现对应的鉴权、请求映射、回复格式和多用户授权流程。不要把机器人密钥发布到 GitHub。

## 交付边界

目前仓库有三处并列知识同步代码和机器人通用事件路由；飞书、微信真实机器人回调、回复发送、OAuth 自动刷新及 DSH 任务队列桥接尚待实现。任何平台密钥都应保存在用户设备安全存储或专用服务端密钥库，不进入仓库与个人知识文章。
