import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RelayHub } from './core.mjs';
import { createRelayServer } from './server.mjs';
import { RelayLogin } from '../../plugins/revolution-knowledge/src/relay-login.mjs';
import { RelayBotTransport } from '../../integrations/bot/relay-transport.mjs';

test('desktop pairs through Feishu callback, receives only its event, replies, and revokes', async t => {
  const home = await mkdtemp(join(tmpdir(), 'rev-relay-client-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  const sent = [];
  const hub = new RelayHub({ appId: 'cli_shared', send: async (...parts) => sent.push(parts) });
  const server = createRelayServer({ appId: 'cli_shared', publicBaseUrl: 'http://127.0.0.1', hub, pollTimeoutMs: 25,
    botInfo: { name: 'Revolution', openId: 'ou_bot' }, exchangeCode: async code => {
      assert.equal(code, 'valid-code'); return { openId: 'ou_owner', tenantKey: 'tenant-one', name: 'Owner' };
    } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const login = new RelayLogin({ home, url });
  assert.equal((await login.status()).connected, false);
  const pending = await login.start();
  assert.equal(pending.status, 'waiting');
  const state = new URL(pending.url).searchParams.get('state');
  assert.equal((await fetch(`${url}/v1/oauth/callback?state=wrong&code=valid-code`)).status, 400);
  const callback = await fetch(`${url}/v1/oauth/callback?state=${state}&code=valid-code`);
  assert.equal(callback.status, 200);
  const code = (await callback.text()).match(/<strong>(\d{8})<\/strong>/)?.[1];
  assert.match(code, /^\d{8}$/);
  assert.equal((await login.status()).attempt.status, 'confirming');
  await login.confirm(code);
  const status = await login.status();
  assert.equal(status.accountId, 'ou_owner'); assert.equal(status.appId, 'cli_shared');
  assert.deepEqual(await login.botInfo(), { name: 'Revolution', openId: 'ou_bot' });
  const received = [];
  const transport = new RelayBotTransport({ login, onEvent: async event => {
    received.push(event); await transport.send(event.chatId, 'answer', event.eventId);
  } });
  transport.start();
  assert.equal(await hub.receive({ provider: 'feishu', isDirect: true, connectorAccountId: 'cli_shared', senderId: 'ou_owner', chatId: 'oc_owner', eventId: 'om_message', text: 'hello' }), true);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('desktop did not receive event')), 2000);
    const check = setInterval(() => { if (sent.length) { clearInterval(check); clearTimeout(timer); resolve(); } }, 10);
  });
  assert.equal(received[0].senderId, 'ou_owner');
  assert.deepEqual(sent, [['oc_owner', 'answer', 'om_message']]);
  transport.stop(); await login.logout();
  assert.equal((await login.status()).connected, false);
});
