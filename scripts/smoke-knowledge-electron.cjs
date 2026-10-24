const { app, BrowserWindow } = require('electron');
const { mkdtemp, rm } = require('node:fs/promises');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
let runtime, home;
app.whenReady().then(async () => {
  home = await mkdtemp(join(tmpdir(), 'rev-kb-ui-'));
  const { startRuntime } = await import('../apps/revolution/runtime.mjs');
  let logs = ''; const write = process.stdout.write.bind(process.stdout);
  process.stdout.write = chunk => { logs += chunk; return true; };
  try {
    runtime = await startRuntime({ home });
    const url = await runtime.ready;
    const window = new BrowserWindow({ show: false, width: 1400, height: 1000, webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, partition: `smoke-${Date.now()}` } });
    const errors = [];
    window.webContents.on('console-message', (_event, level, message) => { if (level >= 2) errors.push(message); });
    await window.loadURL(url);
    for (let i = 0; i < 30; i++) {
      if (await window.webContents.executeJavaScript("document.body.innerText.includes('知识库')")) break;
      await new Promise(r => setTimeout(r, 500));
    }
    const result = await window.webContents.executeJavaScript(`(async () => {
      const base = '/revolution/knowledge';
      const read = await fetch(base + '/status'); const state = await read.json();
      if (!read.ok || state.articles.length !== 0) throw new Error('Knowledge status not ready: '+JSON.stringify(state));
      const post = async (path, body) => { const r = await fetch(base+path,{method:'POST',headers:{'content-type':'application/json','x-revolution-request':'knowledge'},body:JSON.stringify(body)}); const v=await r.json(); if(!r.ok)throw new Error(JSON.stringify(v)); return v; };
      const proposed=await post('/propose',{id:'smoke-note',title:'界面测试',content:'飞书知识库测试内容'});
      await post('/approve',{draftId:proposed.draftId});
      const found=await post('/search',{query:'飞书知识库'});
      if(found.passages[0]?.id!=='smoke-note')throw new Error('Retrieval failed');
      const cross=await fetch(base+'/propose',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
      const link=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('知识库')||b.getAttribute('aria-label')==='知识库'); if(link)link.click();
      return {status:read.status,created:true,retrieved:true,csrfRejected:cross.status,sidebarFound:!!link};
    })()`);
    await window.webContents.executeJavaScript("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='继续')?.click()");
    await new Promise(r => setTimeout(r, 1500));
    await window.webContents.executeJavaScript("[...document.querySelectorAll('[role=dialog] button')].find(b=>/关闭|Close/.test(b.getAttribute('aria-label')||''))?.click()");
    if (process.env.REVOLUTION_KB_LOGIN_PROBE === '1') {
      result.loginProbe = await window.webContents.executeJavaScript(`(async()=>{
        const post=async(path,body)=>fetch('/revolution/knowledge'+path,{method:'POST',headers:{'content-type':'application/json','x-revolution-request':'knowledge'},body:JSON.stringify(body)});
        await post('/login',{createApp:true});
        let attempt;
        for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,1000));const state=await(await fetch('/revolution/knowledge/status')).json();attempt=state.auth.attempt;if(attempt.url||attempt.status==='error')break;}
        await post('/cancel-login',{});
        if(!attempt.url)throw new Error('Feishu registration begin failed: '+JSON.stringify(attempt));
        return {verificationHost:new URL(attempt.url).hostname,cancelled:true};
      })()`);
    }
    result.page = (await window.webContents.executeJavaScript('document.body.innerText')).slice(-1800);
    result.errors = errors.slice(-12);
    const screenshot = process.env.REVOLUTION_KB_SCREENSHOT;
    if (screenshot) await require('node:fs/promises').writeFile(screenshot, (await window.webContents.capturePage()).toPNG());
    write(JSON.stringify(result, null, 2)+'\n');
    if (!result.sidebarFound || !result.page.includes('连接飞书')) throw new Error('Knowledge UI did not mount');
  } catch(error) { write('FAIL: '+error.message+'\n'+logs.split('\n').filter(l=>/error|failed|revolution-knowledge/i.test(l)).slice(-12).join('\n')); process.exitCode=1; }
  finally {
    if (runtime?.backend.exitCode === null) { runtime.backend.kill(); await new Promise(r=>runtime.backend.once('exit',r)); }
    await rm(home,{recursive:true,force:true}); app.exit(process.exitCode || 0);
  }
});
