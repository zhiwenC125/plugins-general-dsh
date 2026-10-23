const VALID_PROVIDERS = new Set(['feishu', 'wechat']);

/** A platform adapter must produce this minimal, credential-free inbound event. */
export function normalizeBotEvent(event) {
  if (!event || !VALID_PROVIDERS.has(event.provider)) throw new Error('Unsupported bot provider');
  for (const key of ['connectorAccountId', 'eventId', 'senderId', 'chatId']) {
    if (typeof event[key] !== 'string' || !event[key]) throw new Error(`Missing bot event ${key}`);
  }
  if (typeof event.text !== 'string' || event.text.length > 12000) throw new Error('Invalid bot message text');
  if (typeof event.isDirect !== 'boolean' || typeof event.mentionsBot !== 'boolean') throw new Error('Missing bot mention context');
  return {
    provider: event.provider,
    connectorAccountId: event.connectorAccountId,
    eventId: event.eventId,
    senderId: event.senderId,
    chatId: event.chatId,
    text: event.text.trim(),
    isDirect: event.isDirect,
    mentionsBot: event.mentionsBot,
  };
}

/** Route a verified platform event to exactly one Revolution user and workspace. */
export async function routeBotEvent(rawEvent, { resolveBinding, canAccess, dedupe, enqueue }) {
  const event = normalizeBotEvent(rawEvent);
  if (!event.text || (!event.isDirect && !event.mentionsBot)) return { status: 'ignored' };
  const binding = await resolveBinding(event.provider, event.connectorAccountId, event.chatId);
  if (!binding || !binding.active || !binding.revolutionUserId || !binding.workspaceId) return { status: 'unbound' };
  if (!(await canAccess(binding, event.senderId, event.chatId))) return { status: 'denied' };
  const key = `${event.provider}:${event.connectorAccountId}:${event.eventId}`;
  if (!(await dedupe.claim(key))) return { status: 'duplicate' };
  try {
    const job = await enqueue({
      revolutionUserId: binding.revolutionUserId,
      workspaceId: binding.workspaceId,
      provider: event.provider,
      connectorAccountId: event.connectorAccountId,
      chatId: event.chatId,
      senderId: event.senderId,
      eventId: event.eventId,
      prompt: event.text,
    });
    return { status: 'queued', jobId: job.id };
  } catch (error) {
    await dedupe.release(key);
    throw error;
  }
}
