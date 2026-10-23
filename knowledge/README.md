# Revolution 并列知识库

`knowledge/catalog.json` 给 GitHub 仓库中的 Markdown 文章分配稳定 ID。**Obsidian、个人飞书普通文档、个人飞书 Wiki 都接收完整的同一文章集合**；它们没有按草稿、协作、正式版分工。GitHub 保存 Markdown 原文和目录，供另一台电脑克隆后导入 Revolution 或公司 DSH 平台。公司账号与个人账号是不同身份；此处的飞书接入只配置个人账号。

当前首批为 `docs/knowledge/` 中的 5 篇文章。新增文章时，在 GitHub 仓库写入 Markdown，并把 `id`、`title`、`source` 加入 `knowledge/catalog.json`。ID 一经发布不要复用。每个目标保存独立的 URL 和哈希；同步不会悄悄覆盖在目标处发生的编辑。可从任意一个目标拉取修改到 GitHub 工作树，再推送到另外两个目标；若 GitHub 与该目标都改了同一篇，命令报冲突，由人选择版本。

## 本地使用

```sh
npm run kb -- check
npm run kb -- search workflow
npm run kb -- status
npm run kb -- sync-obsidian --vault '/path/to/Obsidian-vault' --dry-run
npm run kb -- sync-obsidian --vault '/path/to/Obsidian-vault'
npm run kb -- pull-obsidian --vault '/path/to/Obsidian-vault'
npm run kb -- export --out '/path/to/new-portable-bundle'
```

本机已验证的 iCloud Obsidian vault 位于 `~/Library/Mobile Documents/com~apple~CloudDocs/Obsidian`，Revolution 文章会写入其中的 `Revolution Knowledge/`。iOS/iPadOS 需要 Obsidian 官方要求的 iCloud `Obsidian` 目录；同步还需额外备份。[Obsidian 官方指南](https://obsidian.md/help/Getting%20started/Sync%20your%20notes%20across%20devices)

## 个人飞书连接

账号持有人可按 [个人飞书与机器人接入清单](../docs/CONNECTOR-SETUP.md) 完成应用、文档目录、Wiki 空间和授权准备。

先确认个人飞书账号可创建或授权开放平台应用，并取得当前用户的 `user_access_token`、普通文档文件夹 token 和 Wiki 空间 ID。**不要把令牌写入命令、仓库或本文件**；通过进程环境或系统密钥管理器注入。CLI 不存令牌，只在 `~/.revolution/knowledge/state.json` 记录文档 ID、URL 与上次同步哈希。

```sh
export FEISHU_USER_ACCESS_TOKEN='从个人账号授权获得的临时令牌'
export FEISHU_DOC_FOLDER_TOKEN='个人飞书普通文档目录 token'
export FEISHU_WIKI_SPACE_ID='个人飞书 Wiki 空间 ID'

npm run kb -- sync-docs --dry-run
npm run kb -- sync-wiki --dry-run
npm run kb -- sync-all --vault '/path/to/Obsidian-vault'
npm run kb -- pull-docs
npm run kb -- pull-wiki
```

`sync-all` 先检查三个目标已有内容，再逐个写入。飞书普通文档与 Wiki 各创建一份完整文章，按原 Markdown 行写成飞书文本块，确保可读与可还原；目前不会把 Markdown 标题、表格转成飞书原生富文本样式。同步前会读回已有块并比对上次发布哈希；新增或手工编辑过的富文本块会触发冲突。真实飞书 API 写入仍需个人账号授权验收。[创建云文档](https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document/create)、[创建文档块](https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document-block/create)、[创建 Wiki 节点](https://open.feishu.cn/document/server-docs/docs/wiki-v2/space-node/create)

`pull-docs`、`pull-wiki` 和 `pull-obsidian` 每次只从一个目标拉取到 GitHub 工作树。确认差异后再运行另外两个 `sync` 命令，并提交 Git；不要同时在三个地方编辑同一篇后强制覆盖。飞书 API 操作可能部分成功；状态文件会逐篇保存进度，重复执行可续传。离线 iCloud 同步也可能延迟，请在另一台设备打开前确认文件已下载。

## GitHub 与公司复用

`git diff -- docs/knowledge knowledge/catalog.json` 审阅变更，再提交到用户指定的个人仓库 `zhiwenC125/plugins-general-dsh`。公司电脑只克隆该仓库并选择获准复用的个人原创文章、结构和同步代码；公司的知识数据和凭据保留在公司环境，不回写个人 iCloud、个人飞书或个人 GitHub。此工作区 `origin` 仍指向 `zhiwenC125/ai-studio`，目标仓库已配置为 `revolution` remote，推送时须明确指定 `revolution`。`export` 可生成不含令牌和个人飞书文档 ID 的可移植包。

## 验证

```sh
npm run test:knowledge
npm run kb -- check
```

测试覆盖 Obsidian 写入与冲突、飞书普通文档/Wiki 双份内容、原文更新、远端改动拉取和路径穿越校验；飞书请求通过模拟 API 验证，不能替代个人账号的真实权限与接口验收。
