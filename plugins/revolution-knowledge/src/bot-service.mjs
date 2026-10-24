import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { atomicJson } from './service.mjs';
import { promptBotSession } from './bot-bridge.mjs';
import { routeBotEvent } from '../engine/bot/core.mjs';
import { FeishuBotTransport } from '../engine/bot/feishu-transport.mjs';

export class PersonalBotService {
  constructor({ home, login, ctx, transportFactory = options => new FeishuBotTransport(options) }) {
    this.home = home; this.login = login; this.ctx = ctx; this.transportFactory = transportFactory;
    this.state = { enabled: false, accountId: null, chatId: null, workspaceId: 'personal', projectId: null, sessionId: null, seen: [] };
    this.error = null;
  }
  path() { return join(this.home, 'bot.json'); }
  async init() {
    try { this.state = { ...this.state, ...JSON.parse(await readFile(this.path(), 'utf8')) }; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (this.state.enabled) await this.start().catch(error => { this.error = error.message; });
  }
  status() {
    return { enabled: this.state.enabled, connected: !!this.transport?.child, projectId: this.state.projectId, sessionId: this.state.sessionId, chatBound: !!this.state.chatId, error: this.error };
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
    const auth = await this.login.status();
    if (!auth.connected || !auth.accountId || !auth.appId) throw new Error('请先连接飞书并完成用户授权。');
    if (this.state.accountId && this.state.accountId !== auth.accountId) throw new Error('机器人绑定的飞书账号已变化，请先关闭再重新启用。');
    this.state.accountId = auth.accountId;
    await this.save();
    this.transport = this.transportFactory({
      binary: this.login.executable(), configDir: this.login.home, appId: auth.appId,
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
    const result = await routeBotEvent(event, {
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
      enqueue: async job => {
        void promptBotSession(this.ctx, job.sessionId, job.prompt)
          .then(answer => this.transport?.send(job.chatId, answer, job.eventId))
          .catch(() => this.transport?.send(job.chatId, 'Revolution 处理失败。请在桌面会话中查看状态后重试。', job.eventId)?.catch(() => {}));
        return { id: job.eventId };
      },
    });
    if (result.status === 'command') await this.transport.send(event.chatId, result.text, event.eventId);
  }
  stop() { clearTimeout(this.retryTimer); this.retryTimer = null; this.transport?.stop(); this.transport = null; }
}
