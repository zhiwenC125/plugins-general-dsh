import { createServer } from 'node:http';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { RelayHub } from './core.mjs';
import { FeishuLogin } from '../../plugins/revolution-knowledge/src/feishu-login.mjs';
import { FeishuBotTransport } from '../../integrations/bot/feishu-transport.mjs';

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(body));
}
function bearer(req) { return /^Bearer ([A-Za-z0-9_-]{30,})$/.exec(req.headers.authorization ?? '')?.[1] ?? null; }
async function body(req) {
  let size = 0, chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > 16_384) throw new Error('request too large'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function requireUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname))) throw new Error('PUBLIC_BASE_URL must use HTTPS');
  return url.origin;
}

export async function exchangeFeishuCode(code, { appId, appSecret, fetchImpl = fetch }) {
  const post = async (url, payload, token) => {
    const response = await fetchImpl(url, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    if (!response.ok || data.code !== 0) throw new Error('飞书身份核验失败。');
    return data;
  };
  const app = await post('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', { app_id: appId, app_secret: appSecret });
  const token = await post('https://open.feishu.cn/open-apis/authen/v1/access_token', { grant_type: 'authorization_code', code }, app.app_access_token);
  const response = await fetchImpl('https://open.feishu.cn/open-apis/authen/v1/user_info', { headers: { authorization: `Bearer ${token.data.access_token}` }, signal: AbortSignal.timeout(10000) });
  const data = await response.json();
  if (!response.ok || data.code !== 0 || !data.data?.open_id || !data.data?.tenant_key) throw new Error('无法确认飞书用户和组织身份。');
  return { openId: data.data.open_id, tenantKey: data.data.tenant_key, name: data.data.name ?? '' };
}

export function createRelayServer({ appId, publicBaseUrl, hub, exchangeCode, botInfo = null, botConnected = () => true, pollTimeoutMs = 20_000 }) {
  const origin = requireUrl(publicBaseUrl), callback = `${origin}/v1/oauth/callback`;
  const attempts = new Map();
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, origin);
      if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true, mode: 'single-tenant' });
      if (req.method === 'POST' && url.pathname === '/v1/pair/start') {
        const ip = req.socket.remoteAddress ?? 'unknown', last = attempts.get(ip) ?? 0;
        if (Date.now() - last < 3000) return json(res, 429, { error: '稍后再试。' });
        attempts.set(ip, Date.now());
        if (attempts.size > 2000) attempts.clear();
        const pair = hub.startPair();
        const auth = new URL('https://open.feishu.cn/open-apis/authen/v1/index');
        auth.searchParams.set('app_id', appId); auth.searchParams.set('redirect_uri', callback); auth.searchParams.set('state', pair.state);
        return json(res, 200, { claimToken: pair.claimToken, authUrl: auth.href });
      }
      if (req.method === 'GET' && url.pathname === '/v1/oauth/callback') {
        const state = url.searchParams.get('state'), code = url.searchParams.get('code');
        if (!state || !code || !hub.hasPair(state)) return json(res, 400, { error: '登录链接已失效，请在 Revolution 重试。' });
        const user = await exchangeCode(code);
        const confirmationCode = hub.finishPair(state, user);
        if (!confirmationCode) return json(res, 400, { error: '登录链接已失效，请在 Revolution 重试。' });
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'", 'x-content-type-options': 'nosniff' });
        return res.end(`<!doctype html><meta charset="utf-8"><title>Revolution</title><style>body{font:18px system-ui;max-width:40rem;margin:4rem auto}strong{font-size:2rem;letter-spacing:.2em}</style><h1>飞书身份已确认</h1><p>请在你自己的 Revolution 登录窗口输入这组一次性确认码：</p><strong>${confirmationCode}</strong><p>10 分钟内有效。不要把确认码告诉其他人。</p>`);
      }
      if (req.method === 'GET' && url.pathname === '/v1/pair/status') return json(res, 200, { ...hub.claimPair(bearer(req)), bot: botInfo });
      if (req.method === 'POST' && url.pathname === '/v1/pair/confirm') {
        const confirmed = hub.confirmPair(bearer(req), (await body(req)).code);
        return json(res, confirmed ? 200 : 403, confirmed ? { ok: true } : { error: '确认码错误或已失效，请检查授权页面。' });
      }
      const token = bearer(req), user = hub.deviceStatus(token);
      if (!user) return json(res, 401, { error: '请重新使用飞书登录。' });
      if (req.method === 'GET' && url.pathname === '/v1/desktop/status') return json(res, 200, { ...user, bot: botInfo, botConnected: botConnected() });
      if (req.method === 'GET' && url.pathname === '/v1/desktop/poll') return json(res, 200, { event: await hub.poll(token, pollTimeoutMs), botConnected: botConnected() });
      if (req.method === 'POST' && url.pathname === '/v1/desktop/reply') return json(res, (await hub.reply(token, await body(req))) ? 200 : 403, { ok: true });
      if (req.method === 'POST' && url.pathname === '/v1/desktop/logout') return json(res, hub.revoke(token) ? 200 : 401, { ok: true });
      return json(res, 404, { error: 'not found' });
    } catch { return json(res, 400, { error: '请求无法处理。' }); }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const appId = process.env.FEISHU_APP_ID, appSecret = process.env.FEISHU_APP_SECRET;
  if (!appId || !appSecret || !process.env.PUBLIC_BASE_URL) throw new Error('FEISHU_APP_ID, FEISHU_APP_SECRET and PUBLIC_BASE_URL are required');
  const require = createRequire(import.meta.url);
  const binary = join(fileURLToPath(new URL('.', import.meta.url)), 'node_modules', '@larksuite', 'cli', 'bin', process.platform === 'win32' ? 'lark-cli.exe' : 'lark-cli');
  require.resolve('@larksuite/cli/package.json');
  const login = new FeishuLogin({ home: process.env.RELAY_DATA_DIR || join(homedir(), '.revolution-relay', 'feishu'), binary });
  const state = await login.status();
  if (state.appId !== appId) await login.configure(appId, appSecret);
  const info = await login.botInfo();
  const hub = new RelayHub({ appId, send: (chatId, text, id) => transport.send(chatId, text, id), onSendError: error => console.error('Bot reply failed:', error.message) });
  const transport = new FeishuBotTransport({ binary: login.executable(), configDir: login.home, appId, botOpenId: info.openId,
    onEvent: event => hub.receive(event), onError: error => { console.error(error.message); setTimeout(() => { if (!transport.child) transport.start(); }, 10000); } });
  transport.start();
  const server = createRelayServer({ appId, publicBaseUrl: process.env.PUBLIC_BASE_URL, hub, botInfo: info, botConnected: () => transport.ready,
    exchangeCode: code => exchangeFeishuCode(code, { appId, appSecret }) });
  server.listen(Number(process.env.PORT || 8787), process.env.HOST || '127.0.0.1', () => console.log('Revolution relay listening'));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { transport.stop(); server.close(); });
}
