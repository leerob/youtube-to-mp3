const {app, BrowserWindow, Menu} = require('electron');
const isDevMode = require('electron-is-dev');
const path = require('path');

if (isDevMode) {
    require('electron-reload')(__dirname + '/public');
}

let mainWindow;

function createWindow() {
    const browserOptions = {
        width: 800,
        height: 600,
        maximizeable: false,
        icon: path.join(__dirname, '/public/img/logo.png')
    };

    mainWindow = new BrowserWindow(browserOptions);
    mainWindow.loadURL('file://' + __dirname + '/app/index.html');

    let template = [
        {
            label: 'YouTube To MP3',
            submenu: [
                {label: 'About Application', selector: 'orderFrontStandardAboutPanel:'},
                {type: 'separator'},
                {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: function() {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {role: 'Reload', accelerator: 'CmdOrCtrl+R', selector: 'reload:'},
                {label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:'},
                {label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:'},
                {type: 'separator'},
                {label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:'},
                {label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:'},
                {label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:'}
            ]
        },
        {
            label: 'Preferences',
            submenu: [
                {
                    label: 'Download Folder',
                    click: () => {
                        mainWindow.webContents.send('promptForChangeDownloadFolder');
                    }
                },
                {
                    label: 'Change Bitrate',
                    submenu: [
                        {
                            label: '320 (Full Quality)',
                            click: () => {
                                mainWindow.webContents.send('changeBitrate', 320);
                            }
                        },
                        {
                            label: '192 (High Quality)',
                            click: () => {
                                mainWindow.webContents.send('changeBitrate', 192);
                            }
                        },
                        {
                            label: '160 (CD Quality)',
                            click: () => {
                                mainWindow.webContents.send('changeBitrate', 160);
                            }
                        },
                        {
                            label: '130 (Radio Quality)',
                            click: () => {
                                mainWindow.webContents.send('changeBitrate', 130);
                            }
                        },
                        {
                            label: '65 (Minimal Quality)',
                            click: () => {
                                mainWindow.webContents.send('changeBitrate', 65);
                            }
                        }
                    ]
                }
            ]
        }
    ];

    // If developing add dev menu option to menu bar
    if (isDevMode) {
        template.push({
            label: 'Dev Options',
            submenu: [
                {
                    label: 'Open Dev Tools',
                    click: () => {
                        mainWindow.webContents.openDevTools();
                    }
                }
            ]
        });
    }

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function() {
    if (mainWindow === null) {
        createWindow();
    }
});
