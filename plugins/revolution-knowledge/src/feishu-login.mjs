import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { FeishuClient } from '../engine/feishu.mjs';
const require = createRequire(import.meta.url);

// Credentials and refresh rotation stay inside the pinned official CLI/key store.
// No token command, arbitrary executable, or arbitrary API is exposed to the UI.
export class FeishuLogin {
  constructor({ home, spawnImpl = spawn, binary } = {}) {
    this.home = home; this.spawn = spawnImpl; this.binary = binary;
    this.attempt = { status: 'idle' }; this.child = null;
  }
  executable() {
    return this.binary ?? join(dirname(require.resolve('@larksuite/cli/package.json')), 'bin', process.platform === 'win32' ? 'lark-cli.exe' : 'lark-cli');
  }
  async run(args, { input, onText, timeout = 60000, login = false } = {}) {
    await mkdir(this.home, { recursive: true, mode: 0o700 });
    const env = { ...process.env, LARKSUITE_CLI_CONFIG_DIR: this.home, NO_COLOR: '1' };
    // A terminal's credentials/profile must not override this app's connection.
    for (const key of Object.keys(env)) if (/^LARKSUITE_CLI_/.test(key) && key !== 'LARKSUITE_CLI_CONFIG_DIR') delete env[key];
    return new Promise((resolve, reject) => {
      const child = this.spawn(this.executable(), args, { env, cwd: this.home, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
      if (login) this.child = child;
      let out = '', err = '', tooLarge = false, timedOut = false;
      const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeout);
      child.stdin.on('error', () => {});
      child.stdin.end(input);
      child.stdout.on('data', data => { out += data; if (out.length > 8 * 1024 * 1024) { tooLarge = true; child.kill(); } onText?.(data.toString()); });
      child.stderr.on('data', data => { err = (err + data).slice(-16000); onText?.(data.toString()); });
      child.once('error', () => { clearTimeout(timer); if (this.child === child) this.child = null; reject(new Error('飞书连接组件不可用，请重新安装 Revolution。')); });
      child.once('close', code => {
        clearTimeout(timer); if (this.child === child) this.child = null;
        if (timedOut) return reject(new Error('飞书请求超时，请重试。'));
        if (tooLarge) return reject(new Error('飞书响应过大，请缩小读取范围。'));
        if (code !== 0) {
          let problem; try { problem = JSON.parse(out).error; } catch {}
          const error = new Error(`飞书操作失败（${problem?.code ?? problem?.category ?? code ?? 'cancelled'}）。请检查连接状态和授权范围后重试。`);
          // Never forward raw stderr or credential-bearing output to renderer/logs.
          error.code = String(problem?.code ?? problem?.category ?? code);
          return reject(error);
        }
        try { resolve(out.trim() ? JSON.parse(out) : {}); } catch { resolve({}); }
      });
    });
  }
  async status() {
    if (this.statusPending) return this.statusPending;
    this.statusPending = this.readStatus();
    try { return await this.statusPending; } finally { this.statusPending = null; }
  }
  async readStatus() {
    try {
      const state = await this.run(['auth', 'status', '--json']);
      const user = state.identities?.user;
      return { configured: !!state.appId, connected: !!user?.available, accountId: user?.openId ?? null, appId: state.appId, name: user?.userName ?? '', scope: user?.scope ?? '', tokenStatus: user?.status ?? 'missing', attempt: { ...this.attempt } };
    } catch { return { configured: existsSync(join(this.home, 'config.json')), connected: false, tokenStatus: 'unavailable', attempt: { ...this.attempt } }; }
  }
  start({ createApp = false, write = false } = {}) {
    if (['starting', 'waiting'].includes(this.attempt.status)) return this.attempt;
    if (createApp && existsSync(join(this.home, 'config.json'))) throw new Error('已有飞书应用配置，请使用连接飞书；连接异常不会自动覆盖已有应用。');
    const generation = this.generation = (this.generation ?? 0) + 1;
    this.tail = '';
    this.attempt = { status: 'starting', url: null };
    const watch = text => {
      this.tail = ((this.tail ?? '') + text).slice(-16000);
      for (const match of this.tail.matchAll(/https:\/\/[^\s"<>\\]+/g)) {
        try {
          const url = new URL(match[0]);
          if (['accounts.feishu.cn', 'open.feishu.cn'].includes(url.hostname) && (/auth|verify|registration|device/i.test(url.pathname) || url.pathname === '/page/cli')) {
            if (generation === this.generation) this.attempt = { status: 'waiting', url: url.href };
          }
        } catch {}
      }
    };
    this.pending = (async () => {
      if (createApp) await this.run(['config', 'init', '--new', '--brand', 'feishu', '--lang', 'zh_cn'], { onText: watch, timeout: 600000, login: true });
      if (generation !== this.generation) return;
      this.tail = ''; this.attempt = { status: 'starting', url: null };
      const scopes = write ? 'docx:document drive:drive wiki:wiki' : 'docx:document:readonly drive:drive:readonly wiki:wiki:readonly';
      await this.run(['auth', 'login', '--scope', scopes, '--json'], { onText: watch, timeout: 600000, login: true });
      if (generation === this.generation) this.attempt = { status: 'complete', url: null };
    })().catch(error => { if (generation === this.generation) this.attempt = { status: 'error', message: error.message }; });
    return this.attempt;
  }
  async cancel() { this.generation = (this.generation ?? 0) + 1; this.child?.kill(); await this.pending; this.attempt = { status: 'idle' }; this.tail = ''; }
  async logout() { await this.cancel(); await this.run(['auth', 'logout', '--json']); }
  async botInfo() {
    const result = await this.run(['api', 'GET', '/open-apis/bot/v3/info', '--as', 'bot', '--format', 'json']);
    if (result.ok !== true || !result.data?.open_id || !result.data?.app_name) throw new Error('无法识别当前飞书机器人，请检查应用机器人能力。');
    return { name: result.data.app_name, openId: result.data.open_id };
  }
  async configure(appId, secret) {
    if (!/^cli_[a-zA-Z0-9]+$/.test(appId) || typeof secret !== 'string' || !secret || /[\r\n]/.test(secret)) throw new Error('请输入正确的 App ID 和 App Secret。');
    await this.cancel();
    await this.run(['config', 'init', '--app-id', appId, '--app-secret-stdin', '--brand', 'feishu'], { input: secret });
  }
  async request(method, path, body) {
    if (!/^\/(docx\/v1\/documents|wiki\/v2\/spaces|wiki\/v2\/spaces\/get_node|drive\/v1\/files)(\/|\?|$)/.test(path)) throw new Error('不支持的知识库接口。');
    const url = new URL(path, 'https://open.feishu.cn');
    const args = ['api', method, `/open-apis${url.pathname}`, '--as', 'user', '--format', 'json'];
    if (url.search) args.push('--params', JSON.stringify(Object.fromEntries(url.searchParams)));
    if (body !== undefined) args.push('--data', '-');
    const result = await this.run(args, { input: body === undefined ? undefined : JSON.stringify(body) });
    if (result.ok === false || (result.code !== undefined && result.code !== 0)) throw new Error(`飞书 API 失败（${result.code ?? 'error'}）。`);
    return result.data ?? result;
  }
  client() {
    const client = new FeishuClient({ token: 'managed-by-official-cli' });
    client.request = (method, path, body) => this.request(method, path, body);
    return client;
  }
}
