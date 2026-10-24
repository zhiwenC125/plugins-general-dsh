import { spawn } from 'node:child_process';

export function normalizeFeishuMessage(data, { appId, botOpenId } = {}) {
  if (data?.type !== 'im.message.receive_v1' || data.sender_type !== 'user' || data.message_type !== 'text') return null;
  const text = String(data.content ?? '').trim();
  if (!data.message_id || !data.sender_id || !data.chat_id || !text) return null;
  const isDirect = data.chat_type === 'p2p';
  return {
    provider: 'feishu', connectorAccountId: appId, eventId: data.message_id,
    senderId: data.sender_id, chatId: data.chat_id, text,
    isDirect, mentionsBot: !isDirect && !!botOpenId && data.mentions?.some(item => item.id === botOpenId) === true,
  };
}

// The official CLI owns the WebSocket and bot credential lifecycle. It emits
// one compact JSON event per line and keeps credentials outside Revolution logs.
export class FeishuBotTransport {
  constructor({ binary, configDir, appId, botOpenId, spawnImpl = spawn, onEvent, onError = () => {} }) {
    this.binary = binary; this.configDir = configDir; this.appId = appId;
    this.botOpenId = botOpenId; this.spawn = spawnImpl;
    this.onEvent = onEvent; this.onError = onError;
    this.tail = ''; this.pending = Promise.resolve();
  }
  environment() {
    const env = { ...process.env, LARKSUITE_CLI_CONFIG_DIR: this.configDir, NO_COLOR: '1' };
    for (const key of Object.keys(env)) if (/^LARKSUITE_CLI_/.test(key) && key !== 'LARKSUITE_CLI_CONFIG_DIR') delete env[key];
    return env;
  }
  start() {
    if (this.child) throw new Error('飞书机器人已连接。');
    const child = this.spawn(this.binary, ['event', 'consume', 'im.message.receive_v1', '--as', 'bot'], {
      cwd: this.configDir, env: this.environment(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    });
    this.child = child;
    child.stdout.on('data', chunk => this.accept(chunk.toString()));
    child.stderr.on('data', () => {}); // Never surface credential-bearing CLI output.
    child.once('error', () => { this.onError(new Error('飞书事件连接启动失败。')); });
    child.once('close', code => { if (this.child === child) this.child = null; if (code !== 0 && code !== null) this.onError(new Error('飞书事件连接已断开。')); });
  }
  accept(chunk) {
    this.tail += chunk;
    if (this.tail.length > 1024 * 1024) { this.tail = ''; this.onError(new Error('飞书事件过大，已跳过。')); return; }
    let newline;
    while ((newline = this.tail.indexOf('\n')) >= 0) {
      const line = this.tail.slice(0, newline); this.tail = this.tail.slice(newline + 1);
      let data; try { data = JSON.parse(line); } catch { continue; }
      const event = normalizeFeishuMessage(data, this);
      if (event) this.pending = this.pending.then(() => this.onEvent(event)).catch(() => this.onError(new Error('飞书消息处理失败。')));
    }
  }
  stop() { this.child?.kill(); this.child = null; }
  async send(chatId, text, idempotencyKey) {
    if (!/^oc_[A-Za-z0-9]+$/.test(chatId) || typeof text !== 'string' || !text.trim()) throw new Error('飞书回复目标或内容无效。');
    const args = ['im', '+messages-send', '--as', 'bot', '--chat-id', chatId, '--text', '-', '--format', 'json'];
    if (idempotencyKey) args.push('--idempotency-key', String(idempotencyKey).slice(0, 50));
    return new Promise((resolve, reject) => {
      const child = this.spawn(this.binary, args, { cwd: this.configDir, env: this.environment(), stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
      let output = ''; let tooLarge = false;
      const timeout = setTimeout(() => { child.kill(); reject(new Error('飞书回复超时。')); }, 30000);
      child.stdin.on('error', () => {}); child.stdin.end(text);
      child.stdout.on('data', chunk => { output += chunk; if (output.length > 1024 * 1024) { tooLarge = true; child.kill(); } });
      child.stderr.on('data', () => {});
      child.once('error', () => { clearTimeout(timeout); reject(new Error('飞书回复组件不可用。')); });
      child.once('close', code => {
        clearTimeout(timeout);
        if (tooLarge || code !== 0) return reject(new Error('飞书回复失败。'));
        try { resolve(JSON.parse(output)); } catch { reject(new Error('飞书回复格式无效。')); }
      });
    });
  }
}
