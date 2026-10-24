import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PersonalBotService } from '../src/bot-service.mjs';

test('personal bot binds only the authorized Feishu private chat and switches DSH workspace/session', async t => {
  const home = await mkdtemp(join(tmpdir(), 'rev-bot-test-')); t.after(() => rm(home, { recursive: true, force: true }));
  const sent = []; let incoming;
  const transportFactory = options => ({ child: null, start() { this.child = {}; incoming = options.onEvent; }, stop() { this.child = null; }, async send(chatId, text) { sent.push({ chatId, text }); } });
  const events = [];
  const agent = { session: { snapshotEvents: () => events }, whenIdle: async () => {} };
  const ctx = {
    workspaceRegistry: { list: () => [{ id: 'project-one', title: '项目一', sessionIds: ['session-one'] }] },
    sessionController: {
      list: async () => ({ items: [{ sessionId: 'session-one', projections: { values: { title: '设计会话' } } }] }),
      prompt: async request => {
        events.push({ seq: 1, type: 'user/message', data: { source: { rpcId: request.requestId } } });
        events.push({ seq: 2, type: 'assistant/message', data: { message: { content: [{ type: 'text', text: '模型回复' }] } } });
      },
    },
    agents: { get: () => agent },
  };
  const login = { home: join(home, 'feishu'), executable: () => '/pinned/cli', status: async () => ({ connected: true, accountId: 'ou_owner', appId: 'cli_one' }) };
  const bot = new PersonalBotService({ home, login, ctx, transportFactory }); await bot.init(); await bot.enable();
  const event = (eventId, text, senderId = 'ou_owner') => ({ provider: 'feishu', connectorAccountId: 'cli_one', eventId, senderId, chatId: 'oc_personal', text, isDirect: true, mentionsBot: false });
  await incoming(event('om_1', '/项目 project-one', 'ou_other'));
  assert.equal(bot.state.projectId, null);
  await incoming(event('om_2', '/项目 project-one'));
  await incoming(event('om_3', '/会话 session-one'));
  assert.equal(bot.state.projectId, 'project-one');
  assert.equal(bot.state.sessionId, 'session-one');
  await incoming(event('om_4', '继续讨论'));
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(sent.some(item => item.text === '模型回复'));
  await bot.disable();
  assert.equal(bot.status().enabled, false);
  assert.equal(bot.state.accountId, null);
});
