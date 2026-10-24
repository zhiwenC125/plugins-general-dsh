import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FeishuProfileIdentity } from '../src/profile-identity.mjs';

test('the first Feishu identity owns a local profile across logout and restart', async t => {
  const home = await mkdtemp(join(tmpdir(), 'rev-identity-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  let current = { connected: true, appId: 'cli_one', accountId: 'ou_one', tokenStatus: 'ready' };
  const login = { status: async () => current };
  const identity = new FeishuProfileIdentity({ home, login });
  assert.equal((await identity.status()).reason, 'unbound');
  assert.equal((await identity.status({ claim: true })).authenticated, true);
  current = { connected: false, tokenStatus: 'missing' };
  assert.equal((await identity.status()).reason, 'signed-out');
  current = { connected: true, appId: 'cli_one', accountId: 'ou_other', tokenStatus: 'ready' };
  assert.equal((await new FeishuProfileIdentity({ home, login }).status({ claim: true })).reason, 'different-account');
  current = { connected: true, appId: 'cli_one', accountId: 'ou_one', tokenStatus: 'ready' };
  assert.equal((await identity.status()).authenticated, true);
});
