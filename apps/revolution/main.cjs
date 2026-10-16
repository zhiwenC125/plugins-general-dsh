const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('node:path');
let backend;
app.setName('Revolution');
if (!app.requestSingleInstanceLock()) app.quit();
else {
  let window;
  app.on('second-instance', () => { if (window) { window.restore(); window.focus(); } });
  app.whenReady().then(async () => {
    try {
      const { startRuntime } = await import('./runtime.mjs');
      const runtime = await startRuntime(); backend = runtime.backend;
      const url = await runtime.ready;
      const origin = new URL(url).origin;
      window = new BrowserWindow({ title: 'Revolution', width: 1480, height: 980, minWidth: 900, minHeight: 640,
        icon: path.join(__dirname, 'icon.png'), backgroundColor: '#f7f7f3',
        webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
      window.webContents.setWindowOpenHandler(({ url: target }) => { if (/^https?:/.test(target)) shell.openExternal(target); return { action: 'deny' }; });
      window.webContents.on('will-navigate', (event, target) => { if (new URL(target).origin !== origin) { event.preventDefault(); if (/^https?:/.test(target)) shell.openExternal(target); } });
      window.on('page-title-updated', event => event.preventDefault());
      await window.loadURL(url);
      backend.once('exit', code => { if (!app.isQuitting) { dialog.showErrorBox('Revolution backend stopped', `DSH exited (${code}). Restart Revolution to reconnect.`); app.quit(); } });
    } catch (error) { dialog.showErrorBox('Revolution startup failed', error.message); app.quit(); }
  });
  app.on('before-quit', () => { app.isQuitting = true; backend?.kill(); });
  app.on('window-all-closed', () => app.quit());
}
