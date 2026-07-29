const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getEnv: (key) => ipcRenderer.invoke('get-env', key),
  setBadgeCount: (count) => ipcRenderer.send('update-badge', count),
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),
  onNewWaitingSession: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('new-waiting-session', handler);
    return () => ipcRenderer.removeListener('new-waiting-session', handler);
  },
  syncWaitingIds: (ids) => ipcRenderer.send('sync-waiting-ids', ids),
});
