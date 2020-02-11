
var $ = require('jQuery');
var ffbinaries = require('ffbinaries');
var appRootDir = require('app-root-dir').get();
var ffpath = appRootDir + '/bin/ff';
const Store = require('electron-store');
const store = new Store();
var internetCheckInterval;

//ffbinaries.clearCache(); //SET IF DEBUGGING

function downloadFFmpeg(callback) {
    $("#progressmsg").html('getting started: downloading FFmpeg binaries now...');
    function tickerFn(data) {
        //console.log('\x1b[2m' + data.filename + ': Downloading ' + (data.progress * 100).toFixed(1) + '%\x1b[0m');
        var elem = document.getElementById("myBar");
        var percnum = (data.progress * 100 / 2).toFixed(1);
        var perc = percnum + '%';
        if(elem.style.width < perc){
            elem.style.width = perc;
            $('#label').html(Math.round(percnum) + '%');
        }
    }

    var plat = ffbinaries.detectPlatform();

    var options = {
        platform: plat,
        quiet: false,
        destination: ffpath,
        tickerFn: tickerFn,
        tickerInterval: 500
    };

    ffbinaries.downloadFiles(['ffmpeg'], options, function(err, data) {
        console.log('Downloading ffmpeg binary to ' + ffpath + '.');
        console.log('err', err);
        console.log('data', data);
        if (err != null) {
            console.log('err', err);
        }
        callback(err, data);
    });
}

function downloadFFprobe(callback) {
    function tickerFn(data) {
        //console.log('\x1b[2m' + data.filename + ': Downloading ' + (data.progress * 100).toFixed(1) + '%\x1b[0m');
        var elem = document.getElementById("myBar");
        var percnum = (data.progress * 100 / 2 + 50).toFixed(1);
        var perc = percnum + '%';
        if(elem.style.width < perc){
            elem.style.width = perc;
            $('#label').html(Math.round(percnum) + '%');
        }
    }
    ffbinaries.clearCache();

    var plat = ffbinaries.detectPlatform();

    var options = {
        platform: plat,
        quiet: false,
        destination: ffpath,
        tickerFn: tickerFn,
        tickerInterval: 500
    };

    ffbinaries.downloadFiles(['ffprobe'], options, function(err, data) {
        console.log('Downloading ffmpeg binary to ' + ffpath + '.');
        if (err != null) {
            console.log('err', err);
        }
        console.log('data', data);

        callback(err, data);
    });
}


function noInternet(){
    $("#progressmsg").html('something went wrong, be sure you have internet access');
        internetCheckInterval = setInterval(internetCheck,1000);
}

function internetCheck(){
    console.log(navigator.onLine);
    if(navigator.onLine){
        firstRunFF();
        clearInterval(internetCheckInterval);
    } else {
        console.log('checking internet');
    }
}

function firstRunFF(){
        $('#myProgress, #cropview, #progressmsg').show();
    downloadFFmpeg(function(err, data) {
        if (err) {
            noInternet();
            console.log('Downloads failed:'+err);

        } else {
            downloadFFprobe(function(err, data) {
                if (err) {
                    console.log('Downloads failed.');
                } else {
                    var elem = document.getElementById("myBar");
                    var perc = '100%';
                    elem.style.width = perc;
                    $('#label').html('100%');
                    store.set('firstrun', '0');
                    setTimeout(function() {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            });
        }
    });
}

firstRunFF();