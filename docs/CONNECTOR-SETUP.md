# 个人飞书知识库与消息入口接入清单

更新：2026-10-24。本清单只用于**自己注册的个人飞书账号**试验；公司发放的飞书工作账号是另一身份。个人原创、获准复用的文章可通过个人 GitHub 导入公司 DSH 平台，公司资料及凭据不得回流个人服务。

## 现在需要你在个人飞书完成的操作

1. 使用个人账号登录[飞书开放平台开发者后台](https://open.feishu.cn/app)，确认能否创建应用。新建一个仅用于个人试验的应用；若界面要求组织管理员审批或账号不能创建应用，只记录限制，不要在公司账号代建。
2. 在个人飞书云文档创建专用文件夹，例如 `Revolution Knowledge`；在个人飞书知识库创建专用知识空间。两处都用于保存**同一批完整文章**。记下文件夹 URL 和 Wiki 空间设置页 URL；现有 CLI 从中取得 folder token 和 space ID，但不要把链接或 ID 放进公开 issue。
3. 在应用「权限管理」中，按[创建云文档](https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document/create)、[读写文档块](https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document-block/create)、[创建 Wiki 节点](https://open.feishu.cn/document/server-docs/docs/wiki-v2/space-node/create)各接口页显示的**当前用户身份**权限申请最小范围。还需要目标文件夹和知识空间本身允许该用户编辑；API 权限与资源权限是两层。权限名以控制台和接口页实时显示为准。
4. 在应用「安全设置」登记 OAuth 回调地址，并用该**个人账号**完成用户授权，取得临时 `user_access_token`。当前 CLI 只读取进程环境变量，尚未实现 OAuth 登录与自动刷新；可先在飞书官方 API 调试台验证授权。令牌到期后需重新获取。[飞书访问凭证与权限错误说明](https://open.feishu.cn/document/server-docs/api-call-guide/generic-error-code)
5. 在自己电脑的终端或受保护的本地密钥管理器配置 `FEISHU_USER_ACCESS_TOKEN`、`FEISHU_DOC_FOLDER_TOKEN`、`FEISHU_WIKI_SPACE_ID`，再按[知识库使用说明](../knowledge/README.md)运行 `sync-docs --dry-run`、`sync-wiki --dry-run`，确认范围后分别同步并读回。**不要通过聊天、GitHub、截图、录屏或日志发送 App Secret、令牌、回调密钥。**

只需向我反馈三项非密钥结果：个人账号能否创建应用、能否创建 Wiki 空间、上述两条 dry-run 是否通过及错误码。拿到这些结果后才能完成真实飞书 API 验收；代码当前仅通过模拟 API 测试。

## 飞书机器人

在同一个试验应用启用「机器人」能力，申请接收消息、回复/发送消息所需权限并发布个人测试版本。用个人账号将机器人加入测试会话，在事件订阅中配置消息事件。[官方机器人概览](https://open.feishu.cn/document/client-docs/bot-v3/bot-overview)

本地联调可考虑[官方长连接接收事件](https://open.feishu.cn/document/ukTMukTMukTM/uYDNxYjL2QTM24iN0EjN/event-subscription-configure-)；该方式目前仅支持企业自建应用，须先确认个人账号应用类型是否适用。面向所有 Revolution 用户时，个人应用凭据不能作为全体用户的共享凭据：后续需要可跨租户授权的应用方案，或允许每个用户/租户配置自己的应用，并将授权与会话隔离。

## 微信机器人

当前先开发平台无关的消息接口，**现在无需为个人微信号申请机器人密钥**。要实际收发微信消息，需要选定官方入口与对应账号：公众号适合面向公众号关注者；微信客服适合客服会话；企业微信自建应用适合组织内员工。普通个人微信号任意好友/群聊自动收发不作为全用户接入方案。

确定入口后，由账号持有人在对应官方管理后台启用开发能力、配置消息/事件接收地址与校验信息，并核对该账号可用的接口及回复限制。公众号的开发入口是[微信公众平台](https://mp.weixin.qq.com/)，不是仅注册[微信开放平台](https://open.weixin.qq.com/)账号就能收消息。实际回调需一个可被平台访问的 HTTPS 服务；Revolution 本机的 `127.0.0.1` 地址不能直接填写为公网回调。账号类型与权限确定后再实现该平台的签名校验、消息收发和多用户授权流程。

## 交付边界

目前仓库有三处并列知识同步代码和机器人通用事件路由；飞书、微信真实机器人回调、回复发送、OAuth 自动刷新及 DSH 任务队列桥接尚待实现。任何平台密钥都应保存在用户设备安全存储或专用服务端密钥库，不进入仓库与个人知识文章。
