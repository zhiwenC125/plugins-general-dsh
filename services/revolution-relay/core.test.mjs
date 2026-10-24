import test from 'node:test';
import assert from 'node:assert/strict';
import { RelayHub } from './core.mjs';

test('a Feishu identity can claim only its own device and message result', async () => {
  let now = 1000; const sent = [];
  const hub = new RelayHub({ appId: 'cli_one', now: () => now, send: async (...args) => sent.push(args) });
  const first = hub.startPair(), second = hub.startPair();
  const firstCode = hub.finishPair(first.state, { tenantKey: 'tenant', openId: 'ou_one', name: 'One' });
  const secondCode = hub.finishPair(second.state, { tenantKey: 'tenant', openId: 'ou_two', name: 'Two' });
  assert.match(firstCode, /^\d{8}$/);
  assert.equal(hub.claimPair(first.claimToken).status, 'confirming');
  assert.equal(hub.confirmPair(first.claimToken, secondCode), false);
  assert.equal(hub.confirmPair(first.claimToken, firstCode), true);
  assert.equal(hub.confirmPair(second.claimToken, secondCode), true);
  const a = hub.claimPair(first.claimToken), b = hub.claimPair(second.claimToken);
  assert.equal(a.status, 'ready'); assert.equal(b.status, 'ready');
  assert.equal(hub.claimPair(first.claimToken).status, 'invalid');
  const event = (eventId, senderId) => ({ isDirect: true, connectorAccountId: 'cli_one', senderId, chatId: 'oc_chat', eventId, text: 'hello' });
  assert.equal(await hub.receive(event('om_one', 'ou_one')), true);
  assert.equal((await hub.poll(a.token, 1)).eventId, 'om_one');
  assert.equal(await hub.poll(a.token, 1), null);
  now += 30_001;
  assert.equal((await hub.poll(a.token, 1)).eventId, 'om_one');
  assert.equal(await hub.poll(b.token, 1), null);
  assert.equal(await hub.reply(b.token, { eventId: 'om_one', text: 'stolen' }), false);
  assert.equal(await hub.reply(a.token, { eventId: 'om_one', text: 'answer' }), true);
  assert.equal(await hub.reply(a.token, { eventId: 'om_one', text: 'duplicate' }), false);
  assert.deepEqual(sent, [['oc_chat', 'answer', 'om_one']]);
  assert.equal(await hub.receive(event('om_one', 'ou_one')), true);
  assert.equal(await hub.poll(a.token, 1), null);
  now += 46_000;
  assert.equal(await hub.receive(event('om_two', 'ou_one')), false);
  await new Promise(resolve => setImmediate(resolve));
  assert.match(sent.at(-1)[1], /离线/);
});

test('pairing expires and unverified events cannot reach a device', async () => {
  let now = 0; const hub = new RelayHub({ appId: 'cli_one', now: () => now, send: async () => {} });
  const pair = hub.startPair();
  now += 10 * 60_000;
  assert.equal(hub.finishPair(pair.state, { tenantKey: 'tenant', openId: 'ou_one' }), null);
  assert.equal(hub.claimPair(pair.claimToken).status, 'expired');
  assert.equal(await hub.receive({ isDirect: false, connectorAccountId: 'cli_one', senderId: 'ou_one', chatId: 'oc_chat', eventId: 'om_one' }), false);
});

test('pairing a replacement computer revokes the previous desktop token', () => {
  const hub = new RelayHub({ appId: 'cli_one', send: async () => {} });
  const pair = () => { const pending = hub.startPair(); const code = hub.finishPair(pending.state, { tenantKey: 'tenant', openId: 'ou_one' }); hub.confirmPair(pending.claimToken, code); return hub.claimPair(pending.claimToken).token; };
  const old = pair(), current = pair();
  assert.equal(hub.deviceStatus(old), null);
  assert.equal(hub.deviceStatus(current).accountId, 'ou_one');
});

test('self-built relay rejects a different Feishu tenant', () => {
  const hub = new RelayHub({ appId: 'cli_one', send: async () => {} });
  const first = hub.startPair(), second = hub.startPair();
  assert.match(hub.finishPair(first.state, { tenantKey: 'tenant-one', openId: 'ou_one' }), /^\d{8}$/);
  assert.equal(hub.finishPair(second.state, { tenantKey: 'tenant-two', openId: 'ou_two' }), null);
});
