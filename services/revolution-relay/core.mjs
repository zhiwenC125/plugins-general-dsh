import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const secret = () => randomBytes(32).toString('base64url');
const digest = value => createHash('sha256').update(value).digest('hex');
const safeEqual = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export class RelayHub {
  constructor({ appId, now = () => Date.now(), send, onSendError = () => {}, maxQueue = 20 }) {
    this.appId = appId; this.now = now; this.send = send; this.onSendError = onSendError; this.maxQueue = maxQueue; this.singleTenantKey = null;
    this.pairs = new Map(); this.devices = new Map(); this.events = new Map(); this.seen = new Map();
  }
  key(user) { return `${this.appId}:${user.tenantKey}:${user.openId}`; }
  startPair() {
    for (const [key, pair] of this.pairs) if (pair.expires <= this.now()) this.pairs.delete(key);
    if (this.pairs.size >= 1000) throw new Error('too many pending logins');
    const state = secret(), claimToken = secret();
    this.pairs.set(state, { claimHash: digest(claimToken), expires: this.now() + 10 * 60_000, user: null });
    return { state, claimToken };
  }
  hasPair(state) { const pair = this.pairs.get(state); return !!pair && pair.expires > this.now() && !pair.user; }
  finishPair(state, user) {
    const pair = this.pairs.get(state);
    if (!pair || pair.expires <= this.now() || pair.user || !/^ou_[A-Za-z0-9]+$/.test(user?.openId) || !user.tenantKey) return null;
    if (this.singleTenantKey && this.singleTenantKey !== user.tenantKey) return null;
    this.singleTenantKey = user.tenantKey;
    pair.user = { openId: user.openId, tenantKey: user.tenantKey, name: String(user.name ?? '').slice(0, 100) };
    const code = String(randomBytes(4).readUInt32BE() % 100_000_000).padStart(8, '0');
    pair.codeHash = digest(code); pair.confirmed = false; pair.failures = 0;
    return code;
  }
  confirmPair(claimToken, code) {
    const claimHash = digest(claimToken ?? '');
    const pair = [...this.pairs.values()].find(item => safeEqual(item.claimHash, claimHash));
    if (!pair || pair.expires <= this.now() || !pair.user || pair.confirmed || pair.failures >= 5) return false;
    if (!/^\d{8}$/.test(code ?? '') || !safeEqual(pair.codeHash, digest(code))) { pair.failures++; return false; }
    pair.confirmed = true; return true;
  }
  claimPair(claimToken) {
    const claimHash = digest(claimToken ?? '');
    for (const [state, pair] of this.pairs) {
      if (!safeEqual(pair.claimHash, claimHash)) continue;
      if (pair.expires <= this.now()) { this.pairs.delete(state); return { status: 'expired' }; }
      if (pair.failures >= 5) { this.pairs.delete(state); return { status: 'invalid' }; }
      if (!pair.user) return { status: 'waiting' };
      if (!pair.confirmed) return { status: 'confirming' };
      this.pairs.delete(state);
      const token = secret(), user = pair.user, key = this.key(user);
      for (const [oldToken, device] of this.devices) if (device.key === key || this.now() - device.lastSeen > 24 * 60 * 60_000) { this.devices.delete(oldToken); device.waiter?.(); }
      this.devices.set(digest(token), { ...user, key, lastSeen: this.now(), queue: [], waiter: null });
      return { status: 'ready', token, user, appId: this.appId };
    }
    return { status: 'invalid' };
  }
  device(token) { const device = this.devices.get(digest(token ?? '')); return device ?? null; }
  deviceStatus(token) {
    const device = this.device(token);
    if (!device) return null;
    device.lastSeen = this.now();
    return { appId: this.appId, accountId: device.openId, tenantKey: device.tenantKey, name: device.name };
  }
  async receive(event) {
    if (!event?.isDirect || event.connectorAccountId !== this.appId || !/^ou_[A-Za-z0-9]+$/.test(event.senderId) || !/^oc_[A-Za-z0-9]+$/.test(event.chatId) || !/^om_[A-Za-z0-9]+$/.test(event.eventId)) return false;
    const tenantKey = event.tenantKey ?? this.singleTenantKey;
    if (!tenantKey || tenantKey !== this.singleTenantKey) return false;
    const key = this.key({ tenantKey, openId: event.senderId });
    const id = `${key}:${event.eventId}`;
    if (this.seen.has(id)) return true;
    this.seen.set(id, this.now());
    for (const [old, timestamp] of this.seen) if (timestamp < this.now() - 24 * 60 * 60_000) this.seen.delete(old);
    for (const [old, item] of this.events) if (item.expires < this.now()) this.events.delete(old);
    const device = [...this.devices.values()].find(item => item.key === key && this.now() - item.lastSeen < 45_000);
    if (!device) { void Promise.resolve().then(() => this.send(event.chatId, 'Revolution 电脑目前离线。请在电脑打开 Revolution 并连接飞书后重试。', event.eventId)).catch(this.onSendError); return false; }
    if (device.queue.length >= this.maxQueue) { void Promise.resolve().then(() => this.send(event.chatId, 'Revolution 当前任务较多，请稍后重试。', event.eventId)).catch(this.onSendError); return false; }
    device.queue.push({ event, leaseUntil: 0 });
    this.events.set(event.eventId, { key, chatId: event.chatId, expires: this.now() + 30 * 60_000, replied: false });
    device.waiter?.(); device.waiter = null;
    return true;
  }
  async poll(token, timeoutMs = 20_000) {
    const device = this.device(token);
    if (!device) return null;
    device.lastSeen = this.now();
    const ready = () => {
      const item = device.queue.find(entry => entry.leaseUntil <= this.now());
      if (!item) return null;
      item.leaseUntil = this.now() + 30_000;
      return item.event;
    };
    const immediate = ready();
    if (immediate) return immediate;
    device.waiter?.();
    await new Promise(resolve => {
      const timer = setTimeout(() => { device.waiter = null; resolve(); }, timeoutMs);
      device.waiter = () => { clearTimeout(timer); resolve(); };
    });
    if (this.device(token) !== device) return null;
    device.lastSeen = this.now();
    return ready();
  }
  async reply(token, { eventId, text }) {
    const device = this.device(token), event = this.events.get(eventId);
    if (!device || !event || event.key !== device.key || event.expires < this.now() || event.replied || typeof text !== 'string' || !text.trim() || text.length > 11000) return false;
    event.replied = true;
    try {
      await this.send(event.chatId, text, eventId);
      device.queue = device.queue.filter(item => item.event.eventId !== eventId);
      return true;
    }
    catch (error) { event.replied = false; throw error; }
  }
  revoke(token) { const key = digest(token ?? ''), device = this.devices.get(key); if (!device) return false; this.devices.delete(key); device.waiter?.(); return true; }
}
