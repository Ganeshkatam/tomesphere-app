const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;
let tray;

// Improve Security
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.on('ready', createWindow);
}

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        backgroundColor: '#0F172A', // Match Web App "Deep Canvas"
        title: 'TomeSphere',
        frame: false, // Frameless for custom titlebar
        titleBarStyle: 'hidden', // macOS style, but we handle via CSS/IPC on Win
        icon: path.join(__dirname, 'assets/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    const startUrl = isDev
        ? 'http://localhost:3000'
        : 'https://tomesphere-app.vercel.app';

    mainWindow.loadURL(startUrl);

    // Minimize to Tray Logic
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });

    if (isDev) {
        // mainWindow.webContents.openDevTools();
    }

    createTray();
}

function createTray() {
    const iconPath = path.join(__dirname, 'assets/icon.png');
    // In production, ensure asset exists or fallback
    const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16 });

    tray = new Tray(trayIcon);
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show TomeSphere', click: () => mainWindow.show() },
        { type: 'separator' },
        {
            label: 'Quit', click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('TomeSphere');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
}

// --- IPC HANDLERS ---

ipcMain.handle('window:minimize', () => {
    mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.handle('window:close', () => {
    mainWindow.close(); // Triggers existing close handler (hide to tray)
});

ipcMain.handle('system:open', async (event, url) => {
    await shell.openExternal(url);
    return true;
});

// App Lifecycle
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// Global Error Handling
process.on('uncaughtException', (error) => {
    console.error('CRITICAL: Main Process Crash Prevention', error);
    // In production, you might log this to a file or file service
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Promise Rejection', reason);
});
