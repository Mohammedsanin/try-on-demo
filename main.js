const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs/promises');

const isDev = !app.isPackaged;

function garmentRoot() {
  return isDev ? __dirname : process.resourcesPath + '/app.asar.unpacked';
}

async function listGarments() {
  const files = await fs.readdir(garmentRoot());
  return files.filter((file) => file.toLowerCase().endsWith('.glb'));
}

app.whenReady().then(() => {
  const appSession = session.defaultSession;
  appSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details = {}) => {
    if (permission !== 'media') return false;
    const pageUrl = webContents?.getURL() || '';
    const origin = requestingOrigin || '';
    const allowedOrigin = pageUrl.startsWith('file:') || origin.startsWith('file:') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
    return allowedOrigin && (!details.mediaType || details.mediaType === 'video');
  });
  appSession.setPermissionRequestHandler((_webContents, permission, callback, details = {}) => {
    const wantsCamera = permission === 'media' && (!details.mediaTypes || details.mediaTypes.includes('video'));
    callback(wantsCamera);
  });

  ipcMain.handle('garments:list', listGarments);
  ipcMain.handle('garments:read', async (_event, name) => {
    const safeName = path.basename(name);
    if (!safeName.toLowerCase().endsWith('.glb')) throw new Error('Unsupported garment file');
    return fs.readFile(path.join(garmentRoot(), safeName));
  });

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#FAF8F4',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#FAF8F4', symbolColor: '#1C1B19', height: 44 },
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  if (isDev) win.loadURL('http://localhost:5173');
  else win.loadFile(path.join(__dirname, 'dist/index.html'));
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
