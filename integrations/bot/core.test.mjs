import test from 'node:test';
import assert from 'node:assert/strict';
import { routeBotEvent } from './core.mjs';

const incoming = { provider: 'feishu', connectorAccountId: 'personal-app', eventId: 'evt-1', senderId: 'sender-1', chatId: 'chat-1', text: '检索 Workflow', isDirect: true, mentionsBot: false };

test('routes only authorized events to the bound Revolution user and deduplicates retries', async () => {
  const claimed = new Set();
  const jobs = [];
  const deps = {
    resolveBinding: async () => ({ active: true, revolutionUserId: 'user-1', workspaceId: 'workspace-1' }),
    canAccess: async (_binding, sender) => sender === 'sender-1',
    dedupe: { claim: async key => claimed.has(key) ? false : (claimed.add(key), true), release: async key => claimed.delete(key) },
    enqueue: async job => { jobs.push(job); return { id: 'job-1' }; },
  };
  assert.deepEqual(await routeBotEvent(incoming, deps), { status: 'queued', jobId: 'job-1' });
  assert.equal(jobs[0].revolutionUserId, 'user-1');
  assert.equal(jobs[0].workspaceId, 'workspace-1');
  assert.equal((await routeBotEvent(incoming, deps)).status, 'duplicate');
  assert.equal((await routeBotEvent({ ...incoming, eventId: 'evt-2', senderId: 'other' }, deps)).status, 'denied');
  assert.equal((await routeBotEvent({ ...incoming, eventId: 'evt-3', isDirect: false }, deps)).status, 'ignored');
  assert.equal(jobs.length, 1);
});

test('failed job submission releases the event for platform retry', async () => {
  const claimed = new Set();
  const deps = {
    resolveBinding: async () => ({ active: true, revolutionUserId: 'user-1', workspaceId: 'workspace-1' }),
    canAccess: async () => true,
    dedupe: { claim: async key => claimed.has(key) ? false : (claimed.add(key), true), release: async key => claimed.delete(key) },
    enqueue: async () => { throw new Error('queue unavailable'); },
  };
  await assert.rejects(routeBotEvent(incoming, deps), /queue unavailable/);
  assert.equal(claimed.size, 0);
});

test('authorized Feishu chat can switch only to its own project and session', async () => {
  const claimed = new Set();
  const binding = { active: true, revolutionUserId: 'user-1', workspaceId: 'workspace-1', projectId: null, sessionId: null };
  const jobs = [];
  const deps = {
    resolveBinding: async () => binding,
    canAccess: async (_binding, sender) => sender === 'sender-1',
    dedupe: { claim: async key => claimed.has(key) ? false : (claimed.add(key), true), release: async key => claimed.delete(key) },
    enqueue: async job => { jobs.push(job); return { id: 'job-1' }; },
    listProjects: async () => [{ id: 'project-a', name: '项目 A' }],
    listSessions: async () => [{ id: 'session-a', title: '设计讨论' }],
    updateBinding: async (_binding, patch) => Object.assign(binding, patch),
  };
  const send = (eventId, text, senderId = 'sender-1') => routeBotEvent({ ...incoming, eventId, text, senderId }, deps);
  assert.equal((await send('evt-10', '你好')).status, 'command');
  assert.match((await send('evt-11', '/项目')).text, /project-a/);
  assert.equal((await send('evt-12', '/项目 project-b')).status, 'denied');
  assert.equal((await send('evt-13', '/项目 project-a')).status, 'command');
  assert.equal(binding.projectId, 'project-a');
  assert.equal(binding.sessionId, null);
  assert.equal((await send('evt-14', '/会话 session-b')).status, 'denied');
  assert.equal((await send('evt-15', '/会话 session-a')).status, 'command');
  assert.equal((await send('evt-16', '/当前', 'other')).status, 'denied');
  assert.equal((await send('evt-17', '继续讨论')).status, 'queued');
  assert.equal(jobs[0].projectId, 'project-a');
  assert.equal(jobs[0].sessionId, 'session-a');
});
