'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const path = require('path');

require('electron-reload')(__dirname+'/public');

let mainWindow;

function createWindow () {
  const browserOptions = {
    width: 800,
    height: 600,
    maximizeable: false,
    icon: path.join(__dirname, '/public/img/logo.png')
  }

  mainWindow = new BrowserWindow(browserOptions);
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function() {
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
