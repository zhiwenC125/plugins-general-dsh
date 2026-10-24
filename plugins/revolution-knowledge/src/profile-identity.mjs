import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

/** The local profile has one Feishu owner. Logout never transfers ownership. */
export class FeishuProfileIdentity {
  constructor({ home, login }) { this.home = home; this.login = login; }
  path() { return join(this.home, 'feishu-owner.json'); }
  async owner() {
    try { return JSON.parse(await readFile(this.path(), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  async status({ claim = false } = {}) {
    const auth = await this.login.status();
    let owner = await this.owner();
    if (!auth.connected || !auth.appId || !auth.accountId) return { authenticated: false, reason: 'signed-out', owner: owner ? { appId: owner.appId, accountId: owner.accountId } : null, auth };
    if (!owner && claim) {
      await mkdir(this.home, { recursive: true, mode: 0o700 });
      const path = this.path(), temporary = `${path}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify({ appId: auth.appId, accountId: auth.accountId }, null, 2) + '\n', { mode: 0o600 });
      await rename(temporary, path);
      owner = { appId: auth.appId, accountId: auth.accountId };
    }
    if (!owner) return { authenticated: false, reason: 'unbound', owner: null, auth };
    if (owner.appId !== auth.appId || owner.accountId !== auth.accountId) return { authenticated: false, reason: 'different-account', owner: { appId: owner.appId, accountId: owner.accountId }, auth };
    return { authenticated: true, reason: 'ready', owner: { appId: owner.appId, accountId: owner.accountId }, auth };
  }
}
