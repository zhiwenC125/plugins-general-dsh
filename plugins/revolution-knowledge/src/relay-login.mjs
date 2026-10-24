import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { FeishuClient } from '../engine/feishu.mjs';

export class RelayLogin {
  kind = 'relay';
  constructor({ home, url, fetchImpl = fetch }) {
    this.home = home; this.url = new URL(url).origin; this.fetch = fetchImpl;
    if (new URL(this.url).protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(new URL(this.url).hostname)) throw new Error('Revolution 中转地址必须使用 HTTPS。');
    this.attempt = { status: 'idle' }; this.pending = null;
  }
  path() { return join(this.home, 'relay-session.json'); }
  async saved() { try { return JSON.parse(await readFile(this.path(), 'utf8')); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } }
  async requestRelay(path, token, payload) {
    const response = await this.fetch(this.url + path, { method: payload === undefined ? 'GET' : 'POST', headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(payload === undefined ? {} : { 'content-type': 'application/json' }) }, ...(payload === undefined ? {} : { body: JSON.stringify(payload) }), redirect: 'error', signal: AbortSignal.timeout(30000) });
    const value = await response.json();
    if (!response.ok) { const error = new Error(value.error || 'Revolution 飞书中转服务不可用。'); error.status = response.status; throw error; }
    return value;
  }
  async status() {
    if (this.statusPending) return this.statusPending;
    this.statusPending = this.readStatus();
    try { return await this.statusPending; } finally { this.statusPending = null; }
  }
  async readStatus() {
    if (this.pending) {
      try {
        const claim = await this.requestRelay('/v1/pair/status', this.pending);
        if (claim.status === 'ready' && claim.token) {
          await mkdir(this.home, { recursive: true, mode: 0o700 });
          const temporary = `${this.path()}.${randomUUID()}.tmp`;
          await writeFile(temporary, JSON.stringify({ token: claim.token }, null, 2), { mode: 0o600 });
          await rename(temporary, this.path());
          this.pending = null; this.attempt = { status: 'complete' };
        } else if (claim.status === 'confirming') this.attempt = { status: 'confirming', url: this.attempt.url };
        else if (claim.status !== 'waiting') { this.pending = null; this.attempt = { status: 'error', message: '飞书登录已过期，请重新发起。' }; }
      } catch { /* Keep the authorization page available across transient network errors. */ }
    }
    const saved = await this.saved();
    if (!saved?.token) return { configured: true, connected: false, tokenStatus: 'missing', mode: 'relay', attempt: { ...this.attempt } };
    try {
      const user = await this.requestRelay('/v1/desktop/status', saved.token);
      this.bot = user.bot;
      return { configured: true, connected: true, tokenStatus: 'ready', mode: 'relay', appId: user.appId, accountId: user.accountId, tenantKey: user.tenantKey, name: user.name, attempt: { ...this.attempt } };
    } catch (error) {
      if (error.status === 401) { await rm(this.path(), { force: true }); return { configured: true, connected: false, tokenStatus: 'missing', mode: 'relay', attempt: { ...this.attempt } }; }
      return { configured: true, connected: false, tokenStatus: 'unavailable', mode: 'relay', attempt: { ...this.attempt }, error: error.message };
    }
  }
  async start() {
    if (this.pending) return this.attempt;
    if ((await this.saved())?.token) throw new Error('当前已登录。如需更换身份，请先退出 Revolution。');
    this.attempt = { status: 'starting' };
    try {
      const pair = await this.requestRelay('/v1/pair/start', null, {});
      const auth = new URL(pair.authUrl);
      if (auth.protocol !== 'https:' || auth.hostname !== 'open.feishu.cn' || auth.pathname !== '/open-apis/authen/v1/index') throw new Error('中转服务返回的飞书登录地址无效。');
      this.pending = pair.claimToken; this.attempt = { status: 'waiting', url: pair.authUrl };
      return this.attempt;
    } catch (error) { this.attempt = { status: 'error', message: error.message }; return this.attempt; }
  }
  async cancel() { this.pending = null; this.attempt = { status: 'idle' }; }
  async confirm(code) {
    if (!this.pending) throw new Error('没有等待确认的飞书登录。');
    await this.requestRelay('/v1/pair/confirm', this.pending, { code: String(code ?? '').trim() });
    return this.status();
  }
  async logout() {
    const saved = await this.saved();
    if (saved?.token) await this.requestRelay('/v1/desktop/logout', saved.token, {}).catch(() => {});
    await rm(this.path(), { force: true }); await this.cancel();
  }
  async configure() { throw new Error('统一机器人由 Revolution 服务配置，无需填写应用密钥。'); }
  async botInfo() { if (!this.bot) await this.status(); if (!this.bot) throw new Error('无法识别统一飞书机器人。'); return { name: this.bot.name, openId: this.bot.openId }; }
  async request() { throw new Error('统一机器人登录当前仅用于身份与研发会话；飞书文档访问需要单独授权。'); }
  client() { const client = new FeishuClient({ token: 'relay-managed' }); client.request = () => this.request(); return client; }
}
