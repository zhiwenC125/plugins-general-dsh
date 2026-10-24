import { join } from 'node:path';
import { readFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { atomicJson } from './service.mjs';
import { promptBotSession } from './bot-bridge.mjs';
import { routeBotEvent } from '../engine/bot/core.mjs';
import { FeishuBotTransport } from '../engine/bot/feishu-transport.mjs';
import { RelayBotTransport } from '../engine/bot/relay-transport.mjs';

export class PersonalBotService {
  constructor({ home, login, identity, ctx, transportFactory = options => login.kind === 'relay' ? new RelayBotTransport({ login, ...options }) : new FeishuBotTransport(options) }) {
    this.home = home; this.login = login; this.identity = identity; this.ctx = ctx; this.transportFactory = transportFactory;
    this.state = { enabled: false, accountId: null, chatId: null, workspaceId: 'personal', projectId: null, sessionId: null, seen: [] };
    this.error = null;
  }
  path() { return join(this.home, 'bot.json'); }
  async init() {
    try { this.state = { ...this.state, ...JSON.parse(await readFile(this.path(), 'utf8')) }; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (this.state.enabled) await this.start().catch(error => { this.error = error.message; this.scheduleReconnect(); });
  }
  status() {
    return { enabled: this.state.enabled, connected: !!this.transport?.ready, appId: this.state.appId ?? null,
      botName: this.state.botName ?? null, botOpenId: this.state.botOpenId ?? null,
      projectId: this.state.projectId, sessionId: this.state.sessionId, chatBound: !!this.state.chatId, error: this.transport?.ready ? null : this.error };
  }
  async save() { await atomicJson(this.path(), this.state); }
  async enable() {
    this.state.enabled = true;
    await this.save();
    try { await this.start(); } catch (error) { this.state.enabled = false; await this.save(); throw error; }
    return this.status();
  }
  async disable() {
    clearTimeout(this.retryTimer); this.retryTimer = null;
    this.transport?.stop(); this.transport = null;
    this.state.enabled = false; this.state.accountId = null; this.state.chatId = null; this.state.projectId = null; this.state.sessionId = null;
    this.state.workspaceId = 'personal'; this.state.seen = [];
    await this.save(); this.error = null;
    return this.status();
  }
  async start() {
    if (this.transport?.child) return;
    if (this.identity && !(await this.identity.status()).authenticated) throw new Error('请先以本机绑定的飞书账号登录 Revolution。');
    const auth = await this.login.status();
    if (!auth.connected || !auth.accountId || !auth.appId) throw new Error('请先连接飞书并完成用户授权。');
    if (this.state.accountId && this.state.accountId !== auth.accountId) throw new Error('机器人绑定的飞书账号已变化，请先关闭再重新启用。');
    if (this.state.appId && this.state.appId !== auth.appId) throw new Error('机器人绑定的飞书应用已变化，请先检查当前登录。');
    const info = await this.login.botInfo();
    if (!/^ou_[A-Za-z0-9]+$/.test(info.openId)) throw new Error('当前飞书机器人身份无效。');
    this.state.accountId = auth.accountId;
    this.state.appId = auth.appId; this.state.botName = info.name; this.state.botOpenId = info.openId;
    await this.save();
    this.transport = this.transportFactory({
      binary: this.login.kind === 'relay' ? null : this.login.executable(), configDir: this.login.home, appId: auth.appId, botOpenId: info.openId,
      onEvent: event => this.handle(event), onError: error => { this.error = error.message; this.scheduleReconnect(); },
    });
    this.transport.start(); this.error = null;
  }
  scheduleReconnect() {
    if (this.retryTimer || !this.state.enabled) return;
    this.retryTimer = setTimeout(async () => {
      this.retryTimer = null;
      if (!this.state.enabled) return;
      try { await this.start(); } catch (error) { this.error = error.message; this.scheduleReconnect(); }
    }, 10000);
  }
  async handle(event) {
    if (!this.state.enabled || !event.isDirect) return;
    const auth = await this.login.status();
    if (!auth.connected || auth.accountId !== this.state.accountId || (this.identity && !(await this.identity.status()).authenticated)) return;
    let result;
    try { result = await routeBotEvent(event, {
      resolveBinding: async () => ({ ...this.state, active: true, revolutionUserId: this.state.accountId }),
      canAccess: async (_binding, sender, chatId) => {
        if (sender !== this.state.accountId || (this.state.chatId && this.state.chatId !== chatId)) return false;
        if (!this.state.chatId) { this.state.chatId = chatId; await this.save(); }
        return true;
      },
      dedupe: {
        claim: async key => {
          if (this.state.seen.includes(key)) return false;
          this.state.seen.push(key); this.state.seen = this.state.seen.slice(-1000);
          await this.save(); return true;
        },
        release: async key => { this.state.seen = this.state.seen.filter(item => item !== key); await this.save(); },
      },
      listProjects: async () => this.ctx.workspaceRegistry.list().map(workspace => ({ id: workspace.id, name: workspace.title })),
      listSessions: async (_userId, _workspaceId, projectId) => {
        const workspace = this.ctx.workspaceRegistry.list().find(item => item.id === projectId);
        if (!workspace) return [];
        const listed = await this.ctx.sessionController.list({}, new AbortController().signal);
        return listed.items.filter(item => workspace.sessionIds.includes(item.sessionId) && !item.parentSessionId)
          .map(item => ({ id: item.sessionId, title: String(item.projections?.values?.title ?? item.sessionId) }));
      },
      updateBinding: async (_binding, patch) => {
        Object.assign(this.state, patch);
        if (patch.projectId) this.state.workspaceId = patch.projectId;
        await this.save();
      },
      createProject: async (_binding, name) => {
        if (name.length > 80 || /[\\/\r\n]/.test(name) || name === '.' || name === '..') throw new Error('项目名称无效或超过 80 字。');
        const path = join(this.home, 'projects', randomUUID());
        await mkdir(path, { recursive: true, mode: 0o700 });
        const workspace = await this.ctx.workspaceRegistry.create(path, name);
        return { id: workspace.id, name: workspace.title };
      },
      createTask: async (binding, title) => {
        if (title.length > 120 || /[\r\n]/.test(title)) throw new Error('任务名称无效或超过 120 字。');
        const workspace = this.ctx.workspaceRegistry.list().find(item => item.id === binding.projectId);
        if (!workspace) throw new Error('项目已不存在，请重新选择。');
        const created = await this.ctx.sessionController.create({ workspaceId: workspace.id });
        await this.ctx.sessionController.rename({ sessionId: created.sessionId, title });
        return { id: created.sessionId, title };
      },
      stopSession: async binding => {
        await this.requireSelectedSession(binding);
        this.ctx.sessionController.cancel({ sessionId: binding.sessionId });
      },
      readResult: async binding => {
        await this.requireSelectedSession(binding);
        const inspection = await this.ctx.sessionController.inspect(binding.sessionId);
        const latest = [...inspection.events].reverse().find(item => item.type === 'assistant/message');
        const answer = latest?.data?.message?.content?.filter(block => block.type === 'text').map(block => block.text).join('\n').trim();
        return answer ? `会话 ${binding.sessionId} 最近一次回复：\n${answer.slice(0, 11000)}` : '该会话还没有文字回复。';
      },
      listModels: async binding => {
        await this.requireSelectedSession(binding);
        const catalog = await this.ctx.sessionController.modelCatalog();
        return catalog.groups.flatMap(group => group.models.map(model => ({ provider: group.id, id: model.id, name: model.name })));
      },
      selectModel: async (binding, model) => {
        await this.requireSelectedSession(binding);
        await this.ctx.sessionController.selectModel({ sessionId: binding.sessionId, provider: model.provider, model: model.id });
      },
      enqueue: async job => {
        await this.requireSelectedSession(this.state);
        void promptBotSession(this.ctx, job.sessionId, job.prompt)
          .then(answer => this.transport?.send(job.chatId, answer, job.eventId))
          .catch(() => this.transport?.send(job.chatId, 'Revolution 处理失败。请在桌面会话中查看状态后重试。', job.eventId)?.catch(() => {}));
        return { id: job.eventId };
      },
    }); } catch (error) {
      this.error = error.message;
      if (event.senderId === this.state.accountId && (!this.state.chatId || this.state.chatId === event.chatId)) {
        await this.transport.send(event.chatId, 'Revolution 操作失败，请在桌面检查机器人状态后重试。', event.eventId).catch(() => {});
      }
      return;
    }
    if (result.status === 'command') await this.transport.send(event.chatId, result.text, event.eventId);
    if (result.status === 'denied') await this.transport.send(event.chatId, '项目、会话或模型不可用，请先用列表命令查看当前可选项。', event.eventId);
  }
  async requireSelectedSession(binding) {
    const workspace = this.ctx.workspaceRegistry.list().find(item => item.id === binding.projectId);
    if (!workspace || !binding.sessionId || !workspace.sessionIds.includes(binding.sessionId)) throw new Error('会话不属于当前项目，请重新选择。');
  }
  stop() { clearTimeout(this.retryTimer); this.retryTimer = null; this.transport?.stop(); this.transport = null; }
}
