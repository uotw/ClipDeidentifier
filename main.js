const electron = require('electron')
const Menu = electron.Menu
// Module to control application life.
const app = electron.app
const rimraf = require('rimraf')
//const path = require('path');
// const Store = require('electron-store');
// const store = new Store();
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const windowStateKeeper = require('electron-window-state');
let win;
var checksum = require('checksum');
var fs = require('fs');
var os = require("os");
var ffjson = require('./ffcs.json');
const process = require('process');
//console.log(ffjson[0]);
function checkFF(os,file){
    var query = {"os":os,"file":file};
    //console.log(query);
    var result = ffjson.filter(search, query);

    function search(user){
      return Object.keys(this).every((key) => user[key] === this[key]);
    }
    return result[0].cs;
    //for(i<)

}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
//store.set('firstrun','1'); //SET IF DEBUGGING
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

    // CHECK IF FF FILES EXIST AND CS IS CORRECT
    if (os.platform() == "win32") {
        var ffmpeg = "./bin/ff/ffmpeg.exe";
        var ffprobe = "./bin/ff/ffprobe.exe";
    } else {
        var ffmpeg = "./bin/ff/ffmpeg";
        var ffprobe = "./bin/ff/ffprobe";
    }
    try {
      if (fs.existsSync(ffmpeg) && fs.existsSync(ffprobe)) {
        //file exists
        //console.log(checksum(ffprobe));
        var thisos=os.platform()+process.arch;
        var ffmpegCS = checkFF(thisos,"ffmpeg");
        var ffprobeCS = checkFF(thisos,"ffprobe");
        //console.log(ffmpegCS==checksum(ffmpeg));
        if(ffmpegCS==checksum(ffmpeg) && ffprobeCS == checksum(ffprobe)){
            mainWindow.loadURL(`file://${__dirname}/index.html`);
        } else {
            mainWindow.loadURL(`file://${__dirname}/firstrun.html`);
        }
      } else {
         mainWindow.loadURL(`file://${__dirname}/firstrun.html`);
      }
    } catch(err) {

      console.error(err)
    }

    // var firstrun = store.get('firstrun');
    // if (firstrun == 0) {
    //     mainWindow.loadURL(`file://${__dirname}/index.html`);
    // } else {
    //     mainWindow.loadURL(`file://${__dirname}/firstrun.html`);
    // }


    sethtmlsize();

    //initialize GLOBAL WORKING DIR VARIABLE
    global.workdirObj = {
        prop1: null
    };
    mainWindow.on('close', function(event) {
        if (global.workdirObj.prop1) {
            console.log('removing the ' + global.workdirObj.prop1 + ' directory.');
            var dir = global.workdirObj.prop1;
            if (dir.length > 10) {
                //console.log('do it');
                rimraf.sync(dir);
            }
        }
    });

    // Open the DevTools.
    //mainWindow.webContents.openDevTools() //SET IF DEBUGGING

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
    var menu = Menu.buildFromTemplate([{
        label: 'Menu',
        submenu: [{
                label: 'About',
                click() {
                    aboutWindow = new BrowserWindow({
                        width: 600,
                        height: 400,
                        'resizable': true,
                        webPreferences: {
                            nodeIntegration: true,
                            nodeIntegrationInWorker: true
                        }
                    });
                    aboutWindow.loadURL(`file://${__dirname}/about.html`);
                    //aboutWindow.webContents.openDevTools();
                }
            },
            {
                label: 'DevTools',
                click() {
                    mainWindow.webContents.openDevTools();
                }
            },
            {
                label: 'Reload',
                click() {
                    app.relaunch()
                    app.exit()
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Exit',
                click() {
                    app.quit()
                }
            }
        ]
    }])
    Menu.setApplicationMenu(menu);
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