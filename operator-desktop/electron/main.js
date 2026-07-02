import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;

let mainWindow = null;
let tray = null;

function getTrayIcon() {
  const iconPath = path.join(__dirname, '..', 'build', 'icon.png');
  try {
    const image = nativeImage.createFromPath(iconPath);
    if (image.isEmpty()) {
      console.warn('Tray icon is empty, falling back to generated icon');
      return nativeImage.createEmpty();
    }
    return image.resize({ width: 16, height: 16 });
  } catch (err) {
    console.error('Failed to load tray icon:', err.message);
    return nativeImage.createEmpty();
  }
}

function createTray() {
  const icon = getTrayIcon();
  tray = new Tray(icon);

  const updateMenu = (count = 0) => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: count > 0 ? `Chat in attesa: ${count}` : 'Nessuna chat in attesa',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Apri Nolosubito Operator',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: 'Esci',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray.setToolTip(count > 0 ? `${count} chat in attesa` : 'Nolosubito Operator');
    tray.setContextMenu(contextMenu);
  };

  updateMenu(0);

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });

  return updateMenu;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 700,
    show: false,
    title: 'Nolosubito Operator',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    console.log('Loading index.html from:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('console-message', (_event, level, message) => {
    console.log('Renderer console:', message);
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('minimize', () => {
    mainWindow.hide();
  });
}

app.whenReady().then(() => {
  createWindow();
  const updateTrayMenu = createTray();

  // Aggiorna badge sul tray, dock e menu
  ipcMain.on('update-badge', (_event, count) => {
    const safeCount = Number.isFinite(count) && count > 0 ? count : 0;
    updateTrayMenu(safeCount);
    if (process.platform === 'darwin') {
      app.setBadgeCount(safeCount);
    }
  });

  // Mostra notifica nativa anche se la finestra e' nascosta
  ipcMain.on('show-notification', (_event, { title, body }) => {
    if (!title) return;
    const notification = new Notification({
      title,
      body: body || '',
      icon: path.join(__dirname, '..', 'build', 'icon.png'),
      silent: false,
    });
    notification.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    notification.show();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow) mainWindow.show();
});
