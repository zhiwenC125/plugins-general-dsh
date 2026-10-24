// The desktop only makes outbound HTTPS calls. Bot credentials remain on the relay.
export class RelayBotTransport {
  constructor({ login, onEvent, onError = () => {} }) { this.login = login; this.onEvent = onEvent; this.onError = onError; this.ready = false; this.child = null; }
  start() {
    if (this.child) return;
    this.child = { active: true };
    void this.loop(this.child);
  }
  async loop(current) {
    while (this.child === current) {
      try {
        const saved = await this.login.saved();
        if (!saved?.token) throw new Error('飞书登录已失效。');
        const data = await this.login.requestRelay('/v1/desktop/poll', saved.token);
        if (this.child !== current) break;
        this.ready = data.botConnected === true;
        if (data.event) await this.onEvent(data.event);
      } catch (error) {
        if (this.child !== current) break;
        this.ready = false; this.onError(error);
        await new Promise(resolve => { this.wake = resolve; this.retry = setTimeout(resolve, 5000); });
      }
    }
  }
  async send(_chatId, text, eventId) {
    const saved = await this.login.saved();
    if (!saved?.token) throw new Error('飞书登录已失效。');
    return this.login.requestRelay('/v1/desktop/reply', saved.token, { eventId, text });
  }
  stop() { this.child = null; this.ready = false; clearTimeout(this.retry); this.wake?.(); this.wake = null; }
}
