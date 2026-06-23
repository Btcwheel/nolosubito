import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';

let mainWindow = null;
let tray = null;

function createTray() {
  const iconPath = path.join(__dirname, '..', 'build', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
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
  tray.setContextMenu(updateMenu);

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
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
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

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
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow) mainWindow.show();
});
