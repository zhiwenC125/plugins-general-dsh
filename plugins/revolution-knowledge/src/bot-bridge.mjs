import { randomUUID } from 'node:crypto';

// A bot message is admitted through DSH's session controller, so it follows
// the same durable inbox and model execution path as a desktop prompt.
export async function promptBotSession(ctx, sessionId, text, { timeoutMs = 120000 } = {}) {
  if (!sessionId || typeof text !== 'string' || !text.trim()) throw new Error('未选择有效会话。');
  const signal = AbortSignal.timeout(timeoutMs);
  const requestId = randomUUID();
  await ctx.sessionController.prompt({ requestId, sessionId, mode: 'queue', content: [{ type: 'text', text }] }, signal);
  const agent = ctx.agents.get(sessionId);
  if (!agent) throw new Error('Revolution 会话未能启动。');
  await Promise.race([
    agent.whenIdle(),
    new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('Revolution 会话响应超时。')), { once: true })),
  ]);
  const events = agent.session.snapshotEvents();
  const requestIndex = events.findIndex(event => event.type === 'user/message' && event.data?.source?.rpcId === requestId);
  if (requestIndex < 0) throw new Error('Revolution 未记录这条飞书消息。');
  const nextRequest = events.findIndex((event, index) => index > requestIndex && event.type === 'user/message');
  const ownTurn = events.slice(requestIndex + 1, nextRequest < 0 ? undefined : nextRequest);
  const answer = ownTurn.filter(event => event.type === 'assistant/message')
    .flatMap(event => event.data?.message?.content ?? [])
    .filter(block => block.type === 'text').map(block => block.text).join('\n').trim();
  if (!answer) throw new Error('Revolution 未生成可发送的文字回复，请在桌面会话查看状态。');
  return answer.slice(0, 12000);
}
