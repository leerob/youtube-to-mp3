const {app, BrowserWindow, ipcMain, Menu} = require('electron');

const path = require('path');

//require('electron-reload')(__dirname + '/public');

let mainWindow;

function createWindow() {
  const browserOptions = {
    width: 800,
    height: 600,
    maximizeable: false,
    icon: path.join(__dirname, '/public/img/logo.png')
  };

  mainWindow = new BrowserWindow(browserOptions);
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  let template = [{
    label: "YouTube To MP3",
    submenu: [
      { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
      { type: "separator" },
      { label: "Quit", accelerator: "Command+Q", click: function () { app.quit(); } }
    ]
  }, {
    label: "Edit",
    submenu: [
      { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
      { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
      { type: "separator" },
      { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" }
    ]
  }, {
    label: 'Dev Options',
      submenu: [
          {label: 'Open Dev Tools', click: () => {mainWindow.webContents.openDevTools()}}
      ]
  }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('download-file', function (e, url) {
  mainWindow.loadURL('http:' + url);
});
