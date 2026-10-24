# Revolution 统一飞书机器人中转服务（单组织试点）

本目录提供可部署的第一阶段：一个飞书自建应用和一个服务端长连接接收私聊消息；每台 Revolution 桌面客户端通过 HTTPS 登录并轮询自己的消息。飞书 App Secret 只在服务端保存。服务端按该应用下的 `open_id` 路由消息，桌面端仍由各自的 DSH profile 保存项目、会话和模型配置。

## 部署

1. 准备一台能访问飞书开放平台的服务器和指向它的域名。在飞书开发者后台创建**企业自建应用**，启用应用机器人；添加 `im.message.receive_v1` 事件及单聊消息读取、机器人发送权限，并选择长连接接收事件。把应用可用范围与版本发布给试点用户。飞书后台实际权限名称与审批结果以当时页面为准。
2. 在应用的网页登录设置中登记精确回调地址 `https://<域名>/v1/oauth/callback`。该地址必须与授权请求中的 `redirect_uri` 一致。确认登录身份所需的用户信息权限已获批准。
3. 在本目录复制 `.env.example` 为 `.env`，填入域名、App ID、App Secret。`.env` 不要提交到 Git 或发给桌面用户。
4. 在本目录运行 `docker compose up -d --build`。Caddy 自动为域名配置 HTTPS；开放 80/443，保证 DNS 指向这台服务器。检查 `https://<域名>/health` 返回 `{"ok":true}`。
5. 在桌面构建环境设置 `REVOLUTION_RELAY_URL=https://<域名>`，运行 `npm run package:revolution`。构建脚本把**公开服务地址**写入应用包，不写入 App Secret。测试者安装后点“使用飞书登录并连接机器人”，在飞书授权页完成登录，将页面显示的 8 位一次性确认码填回 Revolution，再启用机器人。

本机开发可直接以环境变量运行 `node services/revolution-relay/server.mjs`，并以 `REVOLUTION_RELAY_URL=http://127.0.0.1:8787` 启动源码版桌面；线上构建必须使用 HTTPS。

## 当前边界

- 这是**单组织、自建应用试点**。飞书官方说明，同一应用的多条长连接随机接收事件，因此只有中转服务连接飞书；桌面客户端不能同时以相同 App ID 各自消费事件。目标用户若使用不同组织或飞书个人版账号，应申请飞书商店应用；商店应用面向各租户及个人版用户，但需按其流程改用服务端事件订阅、租户凭据管理和应用审核，不能直接复用这套自建应用长连接。
- 每个飞书身份当前只允许一台在线电脑；在另一台电脑完成授权会撤销旧设备会话。电脑关闭或离线时，机器人直接回复离线提示。服务进程重启后设备会话失效，需要重新登录；此试点还没有持久会话存储、队列和多副本调度。
- 统一登录已覆盖桌面入口与机器人路由。飞书文档/Wiki 读写仍需独立用户授权；统一中转模式的 UI 暂时不提供该入口。模型账号、API Key 与调用额度由每个安装者自行配置。
- 没有现成域名与飞书应用配置时，无法完成真实 OAuth、机器人发布、外部电脑安装和手机消息的端到端验收。正式面向所有人发放前还需要服务监控、数据库、备份、限流和应用发行审核。

本地协议测试：`npm --prefix services/revolution-relay test`。它验证配对、账号隔离、消息路由、回复归属、撤销和模拟 HTTP 回调；不接触真实飞书账号。

官方依据：[飞书长连接的集群分发和自建应用限制](https://open.feishu.cn/document/ukTMukTMukTM/uYDNxYjL2QTM24iN0EjN/event-subscription-configure-) · [飞书应用登录流程](https://open.feishu.cn/document/client-docs/build-login-free-system-) · [商店应用与个人版用户](https://open.feishu.cn/document/home/app-types-introduction/robots-web-applications-and-mini-programs) · [机器人能力](https://open.feishu.cn/document/client-docs/bot-v3/bot-overview)
