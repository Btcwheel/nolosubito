const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getEnv: (key) => ipcRenderer.invoke('get-env', key),
  setBadgeCount: (count) => ipcRenderer.send('update-badge', count),
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),
});
