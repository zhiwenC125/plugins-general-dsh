import test from 'node:test';
import assert from 'node:assert/strict';
import { promptBotSession } from '../src/bot-bridge.mjs';

test('bot bridge queues a prompt into the selected DSH session and returns its reply', async () => {
  const events = [{ seq: 1, type: 'assistant/message', data: { message: { content: [{ type: 'text', text: '旧回复' }] } } }];
  const agent = { session: { snapshotEvents: () => events }, whenIdle: async () => {} };
  const ctx = {
    agents: { get: id => id === 'session-one' ? agent : undefined },
    sessionController: { prompt: async request => {
      assert.equal(request.sessionId, 'session-one');
      assert.equal(request.mode, 'queue');
      assert.equal(request.content[0].text, '继续项目');
      events.push({ seq: 2, type: 'user/message', data: { source: { kind: 'user', rpcId: request.requestId } } });
      events.push({ seq: 3, type: 'assistant/message', data: { message: { content: [{ type: 'text', text: '新回复' }] } } });
    } },
  };
  assert.equal(await promptBotSession(ctx, 'session-one', '继续项目'), '新回复');
});
