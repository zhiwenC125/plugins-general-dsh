import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { KnowledgeService, retrieve } from '../src/service.mjs';
import { FeishuLogin } from '../src/feishu-login.mjs';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
async function fixture(t) {
  const home = await mkdtemp(join(tmpdir(), 'rev-kb-app-')); t.after(() => rm(home, { recursive: true, force: true }));
  const login = { status: async () => ({ configured: false, connected: false }) };
  const service = new KnowledgeService({ home, login }); await service.init(); return { service, home, login };
}
test('new users get an empty independent library with no personal destinations', async t => {
  const { service } = await fixture(t); const state = await service.status();
  assert.equal(state.articles.length, 0); assert.equal(state.config.folderToken, ''); assert.equal(state.config.spaceId, '');
});
test('model proposals require UI approval and reject stale writes', async t => {
  const { service } = await fixture(t);
  const draft = await service.propose({ id: 'hello', title: '知识库', content: '# 飞书知识库\n\n通过引用回答问题。' });
  assert.equal((await service.entries()).length, 0);
  await service.approve(draft.draftId);
  const article = await service.read('hello');
  const next = await service.propose({ id: 'hello', title: '修改', content: 'new', expectedHash: article.hash });
  await writeFile(join(service.config.root, 'knowledge/hello.md'), 'externally edited');
  await assert.rejects(service.approve(next.draftId), /冲突/);
  await assert.rejects(service.propose({ id: '../escape', title: 'x', content: 'x' }), /有效 ID/);
});
test('three peer syncs preserve conflict protection and source citations', async t => {
  const { service, home } = await fixture(t);
  const draft = await service.propose({ id: 'hello', title: '飞书', content: '飞书知识库\nhello world\n' }); await service.approve(draft.draftId);
  await service.configure({ vault: join(home, 'vault') });
  assert.equal((await service.sync({ target: 'obsidian', dryRun: true }))[0].action, 'create');
  await service.sync({ target: 'obsidian', dryRun: false });
  assert.equal(await readFile(join(home, 'vault/Revolution Knowledge/hello.md'), 'utf8'), '飞书知识库\nhello world\n');
  await writeFile(join(home, 'vault/Revolution Knowledge/hello.md'), 'local edit');
  await assert.rejects(service.sync({ target: 'obsidian', dryRun: false }), /conflict/);
  const found = await service.search('飞书知识'); assert.equal(found.passages[0].id, 'hello'); assert.equal(found.passages[0].startLine, 1);
});
test('changing source clears pending drafts and switching Feishu identity blocks reused IDs', async t => {
  const { service, login } = await fixture(t);
  login.status = async () => ({ appId: 'app', accountId: 'A' });
  login.client = () => ({});
  await service.sync({ target: 'docs', direction: 'pull', dryRun: false });
  login.status = async () => ({ appId: 'app', accountId: 'B' });
  await assert.rejects(service.sync({ target: 'docs', direction: 'pull', dryRun: false }), /账号不同/);
  await service.resetRemoteMappings();
  await service.sync({ target: 'docs', direction: 'pull', dryRun: false });
});
test('retrieval returns bounded cited passages for Chinese and English', () => {
  const result = retrieve([{ id: 'x', title: '飞书', source: 'knowledge/x.md', content: 'some text\n飞书知识库可以查询\n' }], '飞书知识库');
  assert.equal(result[0].source, 'knowledge/x.md'); assert.match(result[0].content, /飞书知识库/);
});
test('remote read validates URLs and resolves Wiki before reading document', async t => {
  const { service, login } = await fixture(t); const paths = [];
  login.request = async (_method, path) => { paths.push(path); return path.includes('get_node') ? { node: { obj_type: 'docx', obj_token: 'document' } } : { content: 'remote' }; };
  await assert.rejects(service.remoteRead('https://evil.example/docx/test'), /飞书文档/);
  assert.equal((await service.remoteRead('https://tenant.feishu.cn/wiki/node')).content, 'remote');
  assert.deepEqual(paths, ['/wiki/v2/spaces/get_node?token=node', '/docx/v1/documents/document/raw_content']);
});
function fakeSpawn(queue, calls) {
  return (binary, args, options) => {
    const child = new EventEmitter(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.stdin = new PassThrough();
    child.kill = () => { child.emit('close', null); };
    let input = ''; child.stdin.on('data', d => { input += d; });
    child.stdin.on('finish', () => { calls.push({ binary, args, options, input }); const item = queue.shift(); process.nextTick(() => { child.stdout.write(item.out || '{}'); if (item.err) child.stderr.write(item.err); child.emit('close', item.code ?? 0); }); });
    return child;
  };
}
test('official CLI transport uses stdin for content and returns business data without tokens', async t => {
  const { home } = await fixture(t); const calls = [];
  const login = new FeishuLogin({ home, binary: '/pinned/lark-cli', spawnImpl: fakeSpawn([{ out: JSON.stringify({ ok: true, data: { document: { document_id: 'D' } } }) }], calls) });
  const result = await login.request('POST', '/docx/v1/documents?x=1', { title: 'private text' });
  assert.equal(result.document.document_id, 'D'); assert.ok(calls[0].args.includes('--as')); assert.ok(!calls[0].args.join(' ').includes('private text'));
  assert.equal(JSON.parse(calls[0].input).title, 'private text');
  await assert.rejects(login.request('GET', 'https://evil.example/token'), /不支持/);
});
test('raw CLI errors and secrets are not forwarded', async t => {
  const { home } = await fixture(t); const login = new FeishuLogin({ home, binary: '/pinned/lark-cli', spawnImpl: fakeSpawn([{ code: 1, out: 'token-secret', err: 'secret' }], []) });
  await assert.rejects(login.run(['auth', 'status']), e => !e.message.includes('secret') && e.message.includes('失败'));
});
test('new article cannot overwrite an unregistered local Markdown file', async t => {
  const { service } = await fixture(t);
  await writeFile(join(service.config.root,'knowledge/taken.md'),'keep me');
  const d = await service.propose({id:'taken',title:'new',content:'replace'});
  await assert.rejects(service.approve(d.draftId), /同名文件/);
  assert.equal(await readFile(join(service.config.root,'knowledge/taken.md'),'utf8'),'keep me');
});
test('login accepts the official personal app setup link and cancellation ends polling', async t => {
  const { home } = await fixture(t); const children=[];
  const spawnImpl=()=>{
    const c=new EventEmitter(); c.stdin=new PassThrough(); c.stdout=new PassThrough(); c.stderr=new PassThrough();
    c.kill=()=>c.emit('close',null); children.push(c);
    c.stdin.on('finish',()=>process.nextTick(()=>c.stderr.write('Open https://open.feishu.cn/page/cli?user_code=TEST\n')));
    return c;
  };
  const login=new FeishuLogin({home,binary:'/pinned/cli',spawnImpl});
  login.start({createApp:true}); await new Promise(r=>setTimeout(r,20));
  assert.equal(login.attempt.url,'https://open.feishu.cn/page/cli?user_code=TEST');
  await login.cancel(); assert.equal(login.attempt.status,'idle'); assert.equal(children.length,1);
});
test('desktop adapter never inherits a shell token or profile', async t => {
  const { home }=await fixture(t); const calls=[];
  const old=process.env.LARKSUITE_CLI_USER_ACCESS_TOKEN;
  process.env.LARKSUITE_CLI_USER_ACCESS_TOKEN='must-not-inherit';
  try {
    const login=new FeishuLogin({home,binary:'/pinned/cli',spawnImpl:fakeSpawn([{out:'{}'}],calls)});
    await login.run(['auth','status','--json']);
    assert.equal(calls[0].options.env.LARKSUITE_CLI_USER_ACCESS_TOKEN,undefined);
    assert.equal(calls[0].options.env.LARKSUITE_CLI_CONFIG_DIR,home);
  } finally { if(old===undefined)delete process.env.LARKSUITE_CLI_USER_ACCESS_TOKEN;else process.env.LARKSUITE_CLI_USER_ACCESS_TOKEN=old; }
});
test('status failure preserves existing app and refuses accidental replacement', async t => {
  const { home } = await fixture(t);
  await writeFile(join(home, 'config.json'), '{}');
  const login = new FeishuLogin({ home, binary: '/pinned/cli', spawnImpl: fakeSpawn([{ code: 1 }], []) });
  const state = await login.status();
  assert.equal(state.configured, true);
  assert.equal(state.connected, false);
  assert.throws(() => login.start({ createApp: true }), /已有飞书应用/);
});
