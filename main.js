const electron = require('electron')
// Module to control application life.
const app = electron.app
const rimraf = require('rimraf')
//const path = require('path');
const Store = require('electron-store');
const store = new Store();
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const windowStateKeeper = require('electron-window-state');
let win;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
store.set('firstrun','1');
function createWindow() {
    //Get previous state
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1000,
        defaultHeight: 800
    });

    // Create the window using the state information
    mainWindow = new BrowserWindow({
        'x': mainWindowState.x,
        'y': mainWindowState.y,
        backgroundColor: '#fff',
        'resizable': true,
        'width': mainWindowState.width,
        'height': mainWindowState.height,
        'show': false,
        'minWidth': 800,
        'minHeight': 590,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true
        }
    });

    mainWindow.webContents.on('did-finish-load', function() {
        mainWindow.show();
    });

    // Let us register listeners on the window, so we can update the state
    // automatically (the listeners will be removed when the window is closed)
    // and restore the maximized or full screen state
    mainWindowState.manage(mainWindow);
    /*å
      // Create the browser window.
      mainWindow = new BrowserWindow({width: 1100, height: 750})
    */
    // and load the index.html of the app.
    var firstrun = store.get('firstrun');
    if(firstrun==0){
            mainWindow.loadURL(`file://${__dirname}/index.html`);
    } else {
            mainWindow.loadURL(`file://${__dirname}/firstrun.html`);
    }


    sethtmlsize();

    //initialize GLOBAL WORKING DIR VARIABLE
    global.workdirObj = {
        prop1: null
    };
    mainWindow.on('close', function(event) {
        if (global.workdirObj.prop1) {
            console.log('removing the ' + global.workdirObj.prop1 + ' directory.');
            var dir = global.workdirObj.prop1;
            if(dir.length>10){
                //console.log('do it');
                rimraf.sync(dir);
            }
        }
    });

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });
    mainWindow.on('resize', function(event) {

        sethtmlsize();
    });
}

function sethtmlsize() {
    var size = mainWindow.getContentSize();
    var height = size[1];
    var width = size[0];
    mainWindow.webContents.executeJavaScript("$('body').css('height','" + height + "px');");
    mainWindow.webContents.executeJavaScript("$('html').css('height','" + height + "px');");
    mainWindow.webContents.executeJavaScript("$('html').css('width','" + width + "px');");
    mainWindow.webContents.executeJavaScript("$('body').css('width','" + width + "px');");
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
    createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    app.quit()

})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})