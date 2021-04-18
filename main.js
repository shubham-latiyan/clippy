// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Tray, Menu, clipboard, dialog, globalShortcut } = require('electron')
const path = require('path')
const settings = require('electron-settings')

if (!app.requestSingleInstanceLock()) {
    app.quit()
}

try {
    require('electron-reloader')(module)
} catch (_) { }

async function start() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 400,
        height: 600,
        frame: true,
        resizable: false,
        //movable: false,
        minimizable: false,
        maximizable: false,
        //closable: true,
        show: false,
        title: 'clips',
        //icon: path.join(__dirname, 'icons/16x16.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    })

    mainWindow.setMenuBarVisibility(false)

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Open the DevTools.
    //mainWindow.webContents.openDevTools()

    const globalShortcutWindow = new BrowserWindow({
        width: 400/* + 1000*/,
        height: 100/* + 500*/,
        frame: false,
        resizable: false,
        //movable: false,
        minimizable: false,
        maximizable: false,
        //closable: true,
        show: false,
        title: 'globalShortcut',
        //icon: path.join(__dirname, 'icons/16x16.png'),
        webPreferences: {
            //preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    })

    globalShortcutWindow.setMenuBarVisibility(false)

    // and load the index.html of the app.
    globalShortcutWindow.loadFile('globalShortcut.html')

    // Open the DevTools.
    //globalShortcutWindow.webContents.openDevTools()

    globalShortcutWindow.on('close', (event) => {
        //mainWindow.reload();
        if (!app.isQuiting) {
            event.preventDefault();
            globalShortcutWindow.hide();
        }

        return false;
    });

    const icon = {
        linux: 'icons/64x64.png',
        win32: 'icons/64x64.png',
        darwin: 'icons/16x16.png'
    }

    mainWindow.on('minimize', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });

    mainWindow.on('close', (event) => {
        //mainWindow.reload();
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }

        return false;
    });

    const tray = new Tray(path.join(__dirname, icon[process.platform]))
    tray.setToolTip('Click to show your clipboard history')

    const template = [
        {
            label: 'Show history',
            click: () => mainWindow.show()
        },
        {
            label: 'Change global Shortcut',
            click: () => globalShortcutWindow.show()
        },
        {
            type: 'separator'
        },
        {
            label: 'Exit',
            click: () => app.exit()
        }
    ]

    let contextMenu = Menu.buildFromTemplate(template)
    tray.setContextMenu(contextMenu)

    tray.on('click', () => {
        mainWindow.show();
    })

    let globalShortcutSettings = await settings.get('globalShortcut')
    if (!globalShortcutSettings) {
        await settings.set('globalShortcut', 'CmdOrCtrl+Alt+Up')
        globalShortcutSettings = 'CmdOrCtrl+Alt+Up'
    }

    globalShortcut.register(globalShortcutSettings, () => {
        tray.focus()
        mainWindow.show();
    })
}

app.whenReady().then(start)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) start()
})

app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath("exe")
});

ipcMain.on('app-exit', () => {
    app.exit()
})

app.allowRendererProcessReuse = true;