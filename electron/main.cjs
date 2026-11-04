const { app, BrowserWindow, session } = require('electron');
const path = require('path');

const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1020,
    minHeight: 680,
    title: 'NexusAI Workstation - All AI Apps in One',
    backgroundColor: '#171717',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      sandbox: false,
    },
  });

  session.defaultSession.setUserAgent(CHROME_USER_AGENT);

  app.on('session-created', (sess) => {
    sess.setUserAgent(CHROME_USER_AGENT);
    sess.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      delete responseHeaders['x-frame-options'];
      delete responseHeaders['X-Frame-Options'];
      delete responseHeaders['content-security-policy'];
      delete responseHeaders['Content-Security-Policy'];
      callback({ cancel: false, responseHeaders });
    });
  });

  session.defaultSession.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['X-Frame-Options'];
    delete responseHeaders['content-security-policy'];
    delete responseHeaders['Content-Security-Policy'];
    callback({ cancel: false, responseHeaders });
  });

  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
