const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getEnv: (key) => ipcRenderer.invoke('get-env', key),
  onBadgeCount: (callback) => ipcRenderer.on('badge-count', (_event, count) => callback(count)),
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),
});
