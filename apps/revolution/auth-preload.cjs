const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('revolutionAuth', Object.freeze({
  status: () => ipcRenderer.invoke('revolution-auth-status'),
  start: options => ipcRenderer.invoke('revolution-auth-start', { createApp: options?.createApp === true }),
  configure: (appId, secret) => ipcRenderer.invoke('revolution-auth-configure', appId, secret),
  cancel: () => ipcRenderer.invoke('revolution-auth-cancel'),
  confirm: code => ipcRenderer.invoke('revolution-auth-confirm', code),
}));
