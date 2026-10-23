# 个人飞书知识库与消息入口接入清单

更新：2026-10-24。本清单只用于**自己注册的个人飞书账号**试验；公司发放的飞书工作账号是另一身份。个人原创、获准复用的文章可通过个人 GitHub 导入公司 DSH 平台，公司资料及凭据不得回流个人服务。

## 现在需要你在个人飞书完成的操作

1. 使用个人账号登录[飞书开放平台开发者后台](https://open.feishu.cn/app)，确认能否创建应用。新建一个仅用于个人试验的应用；若界面要求组织管理员审批或账号不能创建应用，只记录限制，不要在公司账号代建。
2. 在个人飞书云文档创建专用文件夹，例如 `Revolution Knowledge`。再打开「云文档 → 知识库 → 新建知识库」，创建同名的飞书 Wiki 知识库；这里指飞书云文档的 Wiki，**不是飞书 aily 的知识空间**。[飞书官方知识库操作](https://www.feishu.cn/hc/zh-CN/articles/807073676453-%E9%A3%9E%E4%B9%A6%E7%9F%A5%E8%AF%86%E5%BA%93-%E6%9E%84%E5%BB%BA%E4%BC%81%E4%B8%9A%E4%B8%8E%E4%B8%AA%E4%BA%BA%E7%9A%84%E4%B8%93%E5%B1%9E%E6%99%BA%E5%BA%93) 两处都用于保存**同一批完整文章**。记下文件夹 URL 和 Wiki 知识库设置页 URL；现有 CLI 从中取得 folder token 和 space ID，但不要把链接或 ID 放进公开 issue。
3. 在应用「权限管理」中，按[创建云文档](https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document/create)、[读写文档块](https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document-block/create)、[创建 Wiki 节点](https://open.feishu.cn/document/server-docs/docs/wiki-v2/space-node/create)各接口页显示的**当前用户身份**权限申请最小范围。还需要目标文件夹和知识空间本身允许该用户编辑；API 权限与资源权限是两层。权限名以控制台和接口页实时显示为准。
   2026-10-24 个人账号实测：普通文档 5 篇已创建并读回；Wiki 创建返回 `99991679`，提示当前用户身份至少需要 `wiki:node:create` 或 `wiki:wiki` 之一。优先申请范围较小的 `wiki:node:create`，发布应用新版本后重新完成用户授权并获取新令牌；现有令牌不会自动增加新权限。
4. 在应用「安全设置」登记 OAuth 回调地址，并用该**个人账号**完成用户授权，取得临时 `user_access_token`。当前 CLI 只读取进程环境变量，尚未实现 OAuth 登录与自动刷新；可先在飞书官方 API 调试台验证授权。令牌到期后需重新获取。[飞书访问凭证与权限错误说明](https://open.feishu.cn/document/server-docs/api-call-guide/generic-error-code)
5. 在本机配置 `FEISHU_DOC_FOLDER_TOKEN` 与 `FEISHU_WIKI_SPACE_ID` 后可先运行 dry-run；首次未关联远端文档时无需用户令牌。真实同步前还须通过个人账号授权取得 `FEISHU_USER_ACCESS_TOKEN`。首次 dry-run 只列出待创建的文章，**不验证飞书 API 权限**；确认是个人试验目录后，执行真实同步，程序会读回核对。**不要通过聊天、GitHub、截图、录屏或日志发送 App Secret、令牌、回调密钥。**

在电脑终端进入本仓库目录后运行：

```sh
npm run kb -- doctor
npm run kb -- sync-docs --dry-run
npm run kb -- sync-wiki --dry-run
```

`doctor` 显示 `configured` / `missing`，并检查令牌是否误填了整行命令、带有 `Bearer` 前缀或已过期；它不会显示令牌值，也不能在线验证授权。个人账号的普通文档文件夹与 Wiki 空间已创建，两个目标 ID 已确认符合飞书 URL 格式。本地 dry-run 均规划创建 5 篇；此时无需 `FEISHU_USER_ACCESS_TOKEN`，但如已有远端关联记录，dry-run 为核对远端内容仍需要它。首次真实同步可分别运行 `npm run kb -- sync-docs`、`npm run kb -- sync-wiki`，程序会创建文档并读回。只有这一步才会实际验证 API 与资源权限。目标 ID 与令牌只放在本机，不写入仓库。

若两个真实同步均返回 `99991668 Invalid access token`，先重新获取个人账号的有效令牌。**逐条执行**下面的命令：运行 `read` 后等待终端出现提示，再粘贴令牌并按回车；不要把后续命令和令牌一起整段粘贴，否则 `read` 可能读到下一行命令。不要在终端输入 `Bearer`。

```zsh
unset FEISHU_USER_ACCESS_TOKEN
read -rs 'FEISHU_USER_ACCESS_TOKEN?粘贴新 user_access_token（输入不显示）: '
printf '\n'
export FEISHU_USER_ACCESS_TOKEN
npm run kb -- doctor
```

只有 `doctor` 显示 `configured` 后，再运行真实同步。`configured` 仍只代表本地格式检查通过；如平台继续报 `99991668`，应在飞书 API 调试台重新获取令牌并检查是否在同一个人账号身份下授权。

个人飞书普通文档已通过真实 API 创建、写入并读回 5 篇文章；Wiki 仍待补齐用户身份权限后验收。只反馈非密钥结果或错误码，不要分享令牌。

## 飞书机器人

在同一个试验应用启用「机器人」能力，申请接收消息、回复/发送消息所需权限并发布个人测试版本。用个人账号将机器人加入测试会话，在事件订阅中配置消息事件。[官方机器人概览](https://open.feishu.cn/document/client-docs/bot-v3/bot-overview)

本地联调可考虑[官方长连接接收事件](https://open.feishu.cn/document/ukTMukTMukTM/uYDNxYjL2QTM24iN0EjN/event-subscription-configure-)；该方式目前仅支持企业自建应用，须先确认个人账号应用类型是否适用。面向所有 Revolution 用户时，个人应用凭据不能作为全体用户的共享凭据：后续需要可跨租户授权的应用方案，或允许每个用户/租户配置自己的应用，并将授权与会话隔离。

## 微信机器人

已在[微信对话开放平台](https://chatbot.weixin.qq.com/)创建 `Revolution-Bot`。当前控制台截图左侧是「配置 → 任务技能」，首页下方「应用接入 → 开放 API」；旧资料中的「高级技能」并非当前菜单名称。用户提供的[官方 Token 接口页](https://developers.weixin.qq.com/doc/aispeech/confapi/dialog/token.html)用于开放 API 凭证流程，不能单独确定微信消息回调与回复的字段。须继续核对「接入指引」中回调/消息相关章节、签名与加密、回复格式。另一个截图中的「知识助理」是独立界面，不能据此推断 `Revolution-Bot` 的接入协议。平台无关的消息路由已实现；不根据旧文章猜测当下的请求格式、签名或回复协议。普通个人微信号任意好友/群聊自动收发不作为全用户接入方案。

微信对话开放平台机器人如果需要绑定公众号或小程序，应在其控制台按当前说明完成渠道绑定；若要让平台调用 Revolution，还需一个它能访问的服务地址，本机 `127.0.0.1` 不能作为公网回调。拿到该平台当前接口规范后，再实现对应的鉴权、请求映射、回复格式和多用户授权流程。不要把机器人密钥发布到 GitHub。

## 交付边界

目前仓库有三处并列知识同步代码和机器人通用事件路由；飞书、微信真实机器人回调、回复发送、OAuth 自动刷新及 DSH 任务队列桥接尚待实现。任何平台密钥都应保存在用户设备安全存储或专用服务端密钥库，不进入仓库与个人知识文章。
