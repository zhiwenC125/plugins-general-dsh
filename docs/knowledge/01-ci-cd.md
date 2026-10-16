# CI/CD：从一次改动到桌面安装包

最后更新：2026-10-17。本篇包含本项目的配置说明，以及首次发布 `revolution-v0.1.0` 的实操复盘。

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

在 main 等普通分支上手动运行不会建立 Release。当前 publish 条件看的是运行 ref 是否为 `refs/tags/revolution-v*`，而不只是看是否手动触发。若构建失败，先看第一个红色 step，不要靠重新运行掩盖依赖或打包错误。

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

## 首次发布实操复盘：0.1.0

### 1. PR 是什么，合并去了哪里？

[PR #1](https://github.com/zhiwenC125/plugins-general-dsh/pull/1) 是 GitHub 的 Pull Request，与 GitLab 的 Merge Request（MR）用途相同：展示分支差异、运行检查、接受审核，再将代码合入目标分支。

本次来源分支为 `codex/revolution-desktop-cicd`，目标为 **main，不是 master**。用户完成合并后，页面显示紫色 Merged；合并提交为 `9c6cda3`。评论用于说明和讨论，不会执行合并。此次实际为 merge commit；Squash and merge 是另一种可选择的合并方式，不是本次已执行的方式。

合并 main 不等于公开发布，也不会仅因为合并就触发本项目的三平台重构建。

### 2. 为什么本地 pull 被拒绝？

本轮代码此前通过独立临时 Git 索引提交到 PR，本地仍保留开发文件，未切换或清理用户工作区。因此执行：

```sh
git switch main
git pull --ff-only origin main
```

出现两类保护提示：`local changes ... would be overwritten`（已跟踪文件有修改）和 `untracked working tree files would be overwritten`（未跟踪文件与新提交路径重叠）。Git 中止操作，没有丢失文件。`--ff-only` 只限制分支更新方式，不会自动处理脏工作区。

本次处理不是通用的一键清理命令，而是先逐文件核对：

- 44 个本地开发文件与远端合并内容完全一致。
- `workflow-smoke-test/prompt-business.md` 存在用户自己的修改。
- 原照片及带 ` 2` 的副本仅在本地存在。

只对那 44 个重复文件执行带明确路径的 stash（包括其中的未跟踪文件），保留备份 `revolution-pre-sync-identical-files-2026-10-17`；其余文件不动。随后 `git merge --ff-only origin/main` 更新本地 main，并通过 SHA256 校验确认原先 55 个修改/未跟踪文件内容均未改变。七项测试与版本检查通过。

**经验：先对比，再备份，再同步，再验证。** 不要为消除报错而执行 `git reset --hard` 或 `git clean -fd`。本次 stash 内是远端已有的重复内容，不需要 `git stash pop`，否则可能重新制造重叠。以后遇到其他内容冲突，必须重新判断，不能照搬这次的文件数量或路径。

同步后 git status 仍显示用户修改和本地文件是正常现象，不代表同步失败，也不应该顺手全部加入公开仓库。

### 3. 创建标签，真正触发发布流水线

确认 HEAD 为准备发布的已合并提交，应用与锁文件版本均为 `0.1.0` 后，用户执行：

```sh
git tag revolution-v0.1.0
git push origin revolution-v0.1.0
```

`git tag` 只在本地标记提交；`git push` 将标签上传，输出 `[new tag]` 表示成功。这个标签标记的是提交中的文件，不包含尚未提交的工作区修改。

推送时的 `This repository moved` 是旧远程地址的重定向提示，本次推送成功，并非错误。仓库现地址为 `https://github.com/zhiwenC125/plugins-general-dsh.git`；如以后要修正本地地址，可单独执行 `git remote set-url origin https://github.com/zhiwenC125/plugins-general-dsh.git`，但它不是发布必需步骤，也不自动同步代码。本次教学没有执行该修改。

标签已存在时应停下来检查，不要删除或强推已发布标签。后续版本应更新 manifest/lock 并使用新版本标签。

### 4. 为什么预览构建的 publish 是灰色？

当前配置的关键条件：

```yaml
publish:
  if: startsWith(github.ref, 'refs/tags/revolution-v')
  needs: desktop
```

| 运行来源 | 三平台打包 | publish |
| --- | --- | --- |
| 普通 main 提交 | 不触发 release workflow，仅轻量 CI | 不运行 |
| main 分支手动运行 release workflow | 运行 | 跳过 |
| `codex/release-preview/**` 分支推送 | 运行 | 跳过 |
| `revolution-v*` 标签推送 | 运行 | 三平台成功后创建草稿 |

灰色的 Skipped 是条件不满足，不是失败。对原来的预览分支运行点击 Re-run all jobs，不会把来源变成标签，所以 publish 仍会跳过。需要查看一条新的、由版本标签触发的运行。

publish 这个 job 名称容易引起误解：本项目实际执行 `gh release create ... --draft`，它只创建带附件的草稿，**不是立即公开发布**。

### 5. 检查草稿与附件

本次用户确认了 Draft、标签 `revolution-v0.1.0` 和提交 `9c6cda3`。展开 Assets 后共有九个条目：

| 文件 | 用途 |
| --- | --- |
| `Revolution-0.1.0-arm64.dmg` | macOS Apple Silicon 安装包 |
| `Revolution-0.1.0-arm64-mac.zip` | macOS Apple Silicon 应用压缩包 |
| `Revolution.Setup.0.1.0.exe` | Windows x64 安装程序 |
| `Revolution-0.1.0.AppImage` | Linux x64 应用 |
| 三份 `SHA256SUMS-*.txt` | 各平台安装包的校验和 |
| Source code ZIP、tar.gz | GitHub 生成的源码归档，不是安装包 |

Actions Artifacts 是临时构建附件，本项目保留三天；**Release Assets 不受这个三天设置控制**，不要混为一谈。草稿不会作为公开 Release 展示，但公开仓库的代码和已经推送的 tag 并不会因此变成私有。

发布前应下载、核验并安装测试。构建和后端 smoke 通过，不等于用户已完成 GUI、真实 API 推理或代码签名验收；本轮教学截图没有提供这些手工测试的完整证据。

### 6. 由草稿公开为 Pre-release

用户点击铅笔进入编辑页，完成以下设置：

1. 保持已有标签 `revolution-v0.1.0`。
2. 标题改为 `Revolution 0.1.0 Preview`。
3. 保留未签名、API 配置和本地数据的说明。
4. 在 Release label 中选择 **Pre-release**。
5. 点击 **Publish release**。

随后截图显示 Pre-release，不再是 Draft，证明这个预览版本已公开发布。Pre-release 表示非生产就绪，**不是私人或隐藏状态**。公开发布会公开现有安装包，不重新打包、不修改代码，也不向用户电脑自动安装更新。

## “关闭与开启”：撤回、重新公开与停用流水线

### 不要混淆三个操作

- 编辑标题或选择 None：不是撤回；取消 Pre-release 反而会变为普通发布。
- 停用 Actions workflow：影响之后的自动化触发，不会撤回已有 Release。
- 将 Release 转为草稿：尝试撤回该 Release 的公开展示与下载，不会收回已经下载的文件，也不会退出用户本机应用。

### 网页入口与 CLI

本次实际编辑页面只有 **Update release**，没有 Convert to draft。不要继续寻找不存在的按钮，也不要把删除 Release 当成必要步骤。

[GitHub CLI 官方手册](https://cli.github.com/manual/gh_release_edit) 提供 `--draft` 参数。下面是待验证的操作指南，**本轮用户在执行前停止了练习，不能记录为已撤回成功**。具体可行性受权限、Release 状态及不可变发布等限制影响，执行报错应先检查原因，不应直接删除重建。

先确认 GitHub CLI 登录状态：

```sh
gh auth status
```

如未安装、未登录或 token 失效，先解决 CLI 环境/授权；Git push 成功不代表 gh 的认证也有效。不要把 token 粘贴进聊天、文档或仓库。

确实要撤回公开状态时，才执行：

```sh
gh release edit revolution-v0.1.0 \
  --repo zhiwenC125/plugins-general-dsh \
  --draft=true
```

成功后可用以下只读命令核实，并通过未登录窗口检查公开页面：

```sh
gh release view revolution-v0.1.0 \
  --repo zhiwenC125/plugins-general-dsh \
  --json tagName,isDraft,isPrerelease,url
```

期望 `isDraft` 为 true。若仍可见或 API 拒绝修改，应停止，不能将命令执行过视为已撤回。

重新公开时，可在草稿页点击 Publish release，或明确执行：

```sh
gh release edit revolution-v0.1.0 \
  --repo zhiwenC125/plugins-general-dsh \
  --draft=false --prerelease
```

重新核实 `isDraft=false`、`isPrerelease=true`。这不是新构建，也不会重新推送 tag；不要为了重新公开而强推标签。

删除 Release 会移除该发布及附件，不是可逆的开关；删除 tag 又是另一项操作。若必须删除，先备份说明和安装包，再明确确认目标与恢复方案。本轮未删除任何 Release、附件或标签。[GitHub 发布管理说明](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)

### 本次练习最终状态

- 已完成：PR 合并、本地安全同步、版本标签推送、自动打包与草稿生成、用户公开为 Pre-release。
- 已学习但未执行：gh 认证检查、转回草稿、重新公开。
- 没有进行：删除 Release/标签、停用或重新启用 workflow。
- 当前不继续更改发布状态；下次操作前重新核实远端实际状态。
