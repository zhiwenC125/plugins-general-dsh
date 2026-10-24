import test from 'node:test';
import assert from 'node:assert/strict';
import { recallForTurn } from '../src/recall.mjs';

const message = text => ({ role: 'user', source: { kind: 'user-rpc' }, content: [{ type: 'text', text }] });
const makeMessage = value => value;

test('automatically recalls cited local memory once per user turn', async () => {
  const calls = [];
  const search = async query => { calls.push(query); return { passages: [{ title: '项目决定', source: 'knowledge/decision.md', startLine: 3, endLine: 5, content: '采用本地优先方案' }] }; };
  const result = await recallForTurn({ step: 1, messages: [message('上次项目决定是什么？')] }, search, makeMessage);
  assert.deepEqual(calls, ['上次项目决定是什么？']);
  assert.match(result.content[0].text, /knowledge\/decision\.md:3-5/);
  assert.match(result.content[0].text, /采用本地优先方案/);
  assert.equal(await recallForTurn({ step: 2, messages: [message('继续')] }, search, makeMessage), null);
  assert.equal(calls.length, 1);
});

test('does not inject memory for empty results, non-user input, or cancellation', async () => {
  const search = async () => ({ passages: [] });
  assert.equal(await recallForTurn({ step: 1, messages: [message('查找记录')] }, search, makeMessage), null);
  assert.equal(await recallForTurn({ step: 1, messages: [{ ...message('查找记录'), source: { kind: 'revolution-knowledge' } }] }, search, makeMessage), null);
  assert.equal(await recallForTurn({ step: 1, messages: [message('查找记录')], signal: { aborted: true } }, search, makeMessage), null);
  assert.equal(await recallForTurn({ step: 1, messages: [message('你好')] }, async () => ({ passages: [{ score: 1 }] }), makeMessage), null);
});
