import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
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
    workspaceRegistry: {
      list: () => [{ id: 'project-one', title: '项目一', sessionIds: ['session-one'] }],
      create: async (path, title) => { assert.ok((await stat(path)).isDirectory()); assert.equal(title, '新项目'); return { id: 'project-new', title }; },
    },
    sessionController: {
      list: async () => ({ items: [{ sessionId: 'session-one', projections: { values: { title: '设计会话' } } }] }),
      create: async request => { assert.equal(request.workspaceId, 'project-one'); return { sessionId: 'session-new' }; },
      rename: async request => { assert.equal(request.title, '新任务'); },
      cancel: request => { assert.equal(request.sessionId, 'session-one'); return { accepted: true }; },
      modelCatalog: async () => ({ groups: [{ id: 'provider', models: [{ id: 'model', name: '模型' }] }] }),
      selectModel: async request => { assert.deepEqual(request, { sessionId: 'session-one', provider: 'provider', model: 'model' }); },
      inspect: async () => ({ events }),
      prompt: async request => {
        events.push({ seq: 1, type: 'user/message', data: { source: { rpcId: request.requestId } } });
        events.push({ seq: 2, type: 'assistant/message', data: { message: { content: [{ type: 'text', text: '模型回复' }] } } });
      },
    },
    agents: { get: () => agent },
  };
  const login = { home: join(home, 'feishu'), executable: () => '/pinned/cli', botInfo: async () => ({ name: 'Revolution', openId: 'ou_bot' }), status: async () => ({ connected: true, accountId: 'ou_owner', appId: 'cli_one' }) };
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
  await incoming(event('om_5', '/模型'));
  assert.ok(sent.some(item => item.text.includes('provider/model')));
  await incoming(event('om_6', '/模型 provider/model'));
  await incoming(event('om_7', '/停止'));
  await incoming(event('om_7b', '/结果'));
  assert.ok(sent.some(item => item.text.includes('最近一次回复：\n模型回复')));
  await incoming(event('om_8', '/新建任务 新任务'));
  assert.equal(bot.state.sessionId, 'session-new');
  await incoming(event('om_9', '/新建项目 新项目'));
  assert.equal(bot.state.projectId, 'project-new');
  assert.equal(bot.state.sessionId, null);
  await bot.disable();
  assert.equal(bot.status().enabled, false);
  assert.equal(bot.state.accountId, null);
});

test('enabled bot retries if credentials are unavailable during startup', async t => {
  const home = await mkdtemp(join(tmpdir(), 'rev-bot-retry-')); t.after(() => rm(home, { recursive: true, force: true }));
  const bot = new PersonalBotService({ home, login: { status: async () => ({ connected: false }) }, ctx: {} });
  bot.state.enabled = true; await bot.save(); await bot.init();
  assert.equal(bot.status().enabled, true);
  assert.match(bot.status().error, /先连接飞书/);
  assert.ok(bot.retryTimer);
  bot.stop();
});
