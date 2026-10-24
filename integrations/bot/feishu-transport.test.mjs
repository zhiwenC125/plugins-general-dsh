import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { FeishuBotTransport, normalizeFeishuMessage } from './feishu-transport.mjs';

const received = { type: 'im.message.receive_v1', sender_type: 'user', message_type: 'text', message_id: 'om_1', sender_id: 'ou_sender', chat_id: 'oc_chat', chat_type: 'p2p', content: '你好' };

test('normalizes a bot event with message ID deduplication and exact group mention', () => {
  assert.equal(normalizeFeishuMessage(received, { appId: 'cli_one' }).eventId, 'om_1');
  const group = { ...received, chat_type: 'group', mentions: [{ id: 'ou_other' }] };
  assert.equal(normalizeFeishuMessage(group, { appId: 'cli_one', botOpenId: 'ou_bot' }).mentionsBot, false);
  assert.equal(normalizeFeishuMessage({ ...group, mentions: [{ id: 'ou_bot' }] }, { appId: 'cli_one', botOpenId: 'ou_bot' }).mentionsBot, true);
  assert.equal(normalizeFeishuMessage({ ...received, sender_type: 'bot' }, { appId: 'cli_one' }), null);
});

test('official CLI transport streams events and sends a bounded bot reply through stdin', async () => {
  const calls = []; const children = [];
  const spawnImpl = (_binary, args, options) => {
    calls.push({ args, options });
    const child = new EventEmitter(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.stdin = new PassThrough();
    child.kill = () => child.emit('close', null); children.push(child);
    if (args[0] === 'im') child.stdin.on('finish', () => queueMicrotask(() => { child.stdout.write('{"ok":true}'); child.emit('close', 0); }));
    return child;
  };
  const events = [];
  const transport = new FeishuBotTransport({ binary: '/pinned/lark-cli', configDir: '/private/feishu', appId: 'cli_one', spawnImpl, onEvent: event => events.push(event) });
  transport.start();
  children[0].stdout.write(JSON.stringify(received).slice(0, 12));
  children[0].stdout.write(JSON.stringify(received).slice(12) + '\n');
  await transport.pending;
  assert.equal(events[0].text, '你好');
  assert.deepEqual(calls[0].args, ['event', 'consume', 'im.message.receive_v1', '--as', 'bot']);
  assert.equal(calls[0].options.env.LARKSUITE_CLI_CONFIG_DIR, '/private/feishu');
  assert.deepEqual(await transport.send('oc_chat', '回复', 'om_1'), { ok: true });
  assert.ok(calls[1].args.includes('--as'));
  transport.stop();
});
