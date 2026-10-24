const { app, BrowserWindow, dialog, shell, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { homedir } = require('node:os');
const { pathToFileURL } = require('node:url');

const previewTitle = 'Revolution Preview · Feishu R4';
try {
  if (!process.env.REVOLUTION_RELAY_URL) {
    const configured = JSON.parse(fs.readFileSync(path.join(__dirname, 'relay-config.json'), 'utf8')).url;
    if (configured) process.env.REVOLUTION_RELAY_URL = configured;
  }
} catch (error) { if (error.code !== 'ENOENT') throw error; }
app.setName(previewTitle);
let backend, window, authWindow, login, identity, authPoll, accessPoll, starting = false;

function safeExternalLinks(target) {
  target.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  target.webContents.on('will-navigate', (event, url) => {
    if (target.webContents.getURL() && url !== target.webContents.getURL()) {
      event.preventDefault();
      if (/^https:\/\//.test(url)) shell.openExternal(url);
    }
  });
}

async function showAuth() {
  if (authWindow && !authWindow.isDestroyed()) { authWindow.focus(); return; }
  authWindow = new BrowserWindow({ title: 'Revolution · 飞书登录', width: 560, height: 650, minWidth: 480, minHeight: 550,
    icon: path.join(__dirname, 'icon.png'), backgroundColor: '#f7f7f3',
    webPreferences: { preload: path.join(__dirname, 'auth-preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true } });
  safeExternalLinks(authWindow);
  await authWindow.loadFile(path.join(__dirname, 'auth.html'));
  if (process.env.REVOLUTION_SMOKE_TEST === '1') console.log('Revolution login required');
  authPoll = setInterval(async () => {
    if (starting || !authWindow || authWindow.isDestroyed()) return;
    try { if ((await identity.status({ claim: true })).authenticated) await startWorkspace(); }
    catch { /* The login window displays the current connection error. */ }
  }, 2000);
}

async function startWorkspace() {
  if (starting || window) return;
  starting = true;
  clearInterval(authPoll); authPoll = null;
  if (authWindow && !authWindow.isDestroyed()) authWindow.close();
  authWindow = null;
  try {
    const { startRuntime } = await import('./runtime.mjs');
    const runtime = await startRuntime();
    backend = runtime.backend;
    const url = await runtime.ready;
    const origin = new URL(url).origin;
    window = new BrowserWindow({ title: previewTitle, width: 1480, height: 980, minWidth: 900, minHeight: 640,
      icon: path.join(__dirname, 'icon.png'), backgroundColor: '#f7f7f3',
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
    safeExternalLinks(window);
    window.webContents.on('will-navigate', (event, target) => {
      if (new URL(target).origin !== origin) event.preventDefault();
    });
    window.on('page-title-updated', event => event.preventDefault());
    window.on('closed', () => { window = null; });
    await window.loadURL(url);
    if (process.env.REVOLUTION_SMOKE_TEST === '1') console.log('Revolution desktop ready');
    const launched = backend;
    launched.once('exit', code => {
      if (backend !== launched || app.isQuitting) return;
      dialog.showErrorBox('Revolution backend stopped', `DSH exited (${code}). Restart Revolution to reconnect.`);
      app.quit();
    });
    let invalidChecks = 0;
    accessPoll = setInterval(async () => {
      if (!window || !backend) return;
      try {
        const state = await identity.status();
        const invalid = state.reason === 'different-account' || (state.reason === 'signed-out' && state.auth.tokenStatus !== 'unavailable');
        invalidChecks = invalid ? invalidChecks + 1 : 0;
        if (invalidChecks < 2) return;
        clearInterval(accessPoll); accessPoll = null;
        const old = backend; backend = null; old.kill('SIGTERM');
        const oldWindow = window;
        await showAuth();
        oldWindow.close(); window = null;
      } catch { invalidChecks = 0; }
    }, 2000);
  } catch (error) { dialog.showErrorBox('Revolution startup failed', error.message); app.quit(); }
  finally { starting = false; }
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { const target = window ?? authWindow; if (target) { target.restore(); target.focus(); } });
  app.whenReady().then(async () => {
    try {
      const { FeishuLogin } = await import(pathToFileURL(path.join(__dirname, 'node_modules/revolution-knowledge/src/feishu-login.mjs')).href);
      const { RelayLogin } = await import(pathToFileURL(path.join(__dirname, 'node_modules/revolution-knowledge/src/relay-login.mjs')).href);
      const { FeishuProfileIdentity } = await import(pathToFileURL(path.join(__dirname, 'node_modules/revolution-knowledge/src/profile-identity.mjs')).href);
      const home = process.env.REVOLUTION_HOME || path.join(homedir(), '.revolution');
      const knowledgeHome = path.join(home, 'knowledge-app');
      login = process.env.REVOLUTION_RELAY_URL
        ? new RelayLogin({ home: knowledgeHome, url: process.env.REVOLUTION_RELAY_URL })
        : new FeishuLogin({ home: path.join(knowledgeHome, 'feishu') });
      identity = new FeishuProfileIdentity({ home: knowledgeHome, login });
      ipcMain.handle('revolution-auth-status', () => identity.status());
      ipcMain.handle('revolution-auth-start', (_event, options) => login.start({ createApp: options?.createApp === true }));
      ipcMain.handle('revolution-auth-configure', (_event, appId, secret) => login.configure(appId, secret));
      ipcMain.handle('revolution-auth-cancel', () => login.cancel());
      ipcMain.handle('revolution-auth-confirm', (_event, code) => login.confirm?.(code));
      if ((await identity.status({ claim: true })).authenticated) await startWorkspace();
      else await showAuth();
    } catch (error) { dialog.showErrorBox('Revolution login failed', error.message); app.quit(); }
  });
  app.on('before-quit', () => {
    app.isQuitting = true;
    clearInterval(authPoll); clearInterval(accessPoll);
    backend?.kill();
    void login?.cancel();
  });
  app.on('window-all-closed', () => { if (!starting) app.quit(); });
}
