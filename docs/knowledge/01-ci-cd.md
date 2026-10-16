# CI/CD：从一次改动到桌面安装包

## 先理解三个词

CI 是每次提交的自动检查。CD 在本项目是自动打包并准备草稿发布，不是静默更新用户电脑。Artifact 是某次运行的临时产物；Release 是你确认之后给用户下载的版本。

## 本仓库已实现

`.github/workflows/ci.yml`：PR、main、codex 分支提交或手动触发；Node 24 构建两个插件、语法检查、Workflow 测试、生成文件一致性与依赖版本检查。它不调用付费模型。

`.github/workflows/release.yml`：手动或 `revolution-v*` 标签触发；macOS ARM64、Windows x64、Linux x64 三个平台分别锁定安装依赖、准备品牌、打包、启动独立 DSH 后端检查 HTTP 与插件注册、计算 SHA256、上传安装包。标签构建全部通过才建立 **draft Release**。这不是完整的 GUI E2E，也未验证真实模型推理。

安全边界：普通任务 `contents: read`，只有发布 job 能写 Release；不使用 `pull_request_target`，不向 PR 暴露发布凭据。当前不需要个人 PAT、模型 Key 或签名密钥。绝不能把自己的 API Key 放入 YAML、安装包或 Git。

## 第一次运行（不发布）

1. 把包含这些文件的分支推到 GitHub，并查看 Actions → Revolution checks。
2. Workflow 文件需要先进入默认分支，Actions 页面才通常显示手动运行按钮。审核合并后，打开 Revolution desktop release → Run workflow，选择分支。
3. 三个平台通过后，在该运行底部 Artifacts 下载对应系统的 zip；解压外层后得到 DMG/ZIP、EXE 或 AppImage。Artifact 默认保留三天，不等于永久发布。
4. 检查同平台的 `SHA256SUMS-*.txt`。macOS 可运行 `shasum -a 256 <安装包>`，Windows PowerShell 用 `Get-FileHash <安装包> -Algorithm SHA256`。

手动运行不会建立 Release。若构建失败，先看第一个红色 step，不要靠重新运行掩盖依赖或打包错误。

在尚未合并默认分支、没有 Run workflow 按钮时，也可显式推送到 `codex/release-preview/任意名称` 分支触发预览构建。普通 codex 分支只跑轻量 CI；preview 分支会跑三平台打包，但不建立 Release。

## 发布一个版本

先修改 `apps/revolution/package.json` 的 version，再用 `npm --prefix apps/revolution install --package-lock-only --install-links` 同步锁文件。检查、提交、审核并合并。以下例子假定版本确实为 0.1.1：

```sh
git tag revolution-v0.1.1
git push origin revolution-v0.1.1
```

标签版本与 manifest/lock 不一致会失败。标签触发后，在 Releases 检查草稿，读安装说明、安装测试，最后手动 Publish。不要覆盖已发布标签；修复请发新版本。回滚是继续提供旧 Release，并修复后发新版本，不是删除用户本地数据。

## 免费的条件

截至 2026-10-17，[GitHub 官方说明](https://docs.github.com/en/billing/concepts/product-billing/github-actions)：公开仓库使用标准 GitHub-hosted runner 的计算免费；私有仓库有账号额度，超过会计费。不要启用 larger runner。缓存和 artifact 存储有独立限制，所以本项目短保留、重构建不按每个提交触发。请在 Billing 配置预算并定期清理旧产物；“免费计算”不等于所有服务永远免费。

当前是 **未签名预览版**：macOS 公证/Developer ID、Windows 签名和自动更新尚未实施。Apple 开发者服务可能产生费用。不要通过全局关闭系统安全机制来安装。正式分发前应补代码签名、许可证清单和跨平台 GUI 验收。

练习：故意让标签版本与 package 不同，观察校验失败；修复后先运行 CI，再手动打包。记录每个平台耗时、产物大小与失败位置。
