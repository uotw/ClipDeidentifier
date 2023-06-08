var $ = require('jQuery');
var ffbinaries = require('ffbinaries');
var internetCheckInterval;
var checksum = require('sha256-file');
var os = require("os");
var ffjson = require('./ffcs.json');
//const remote = require('electron').remote;
//const { app } = remote;
//console.log(remote);
//const app = remote.app;
//const {app} = require('electron');
//const { remote } = require('@electron/remote')
// const app = require('@electron/remote').app
// var userdir =  app.getPath('userData');
var remote = require('@electron/remote')
var userdir =  remote.app.getPath('userData');
//var userdir =  '.';

if (os.platform() == "win32") {
    var ffmpegpath = userdir+"\\ff\\ffmpeg.exe";
    var ffprobepath = userdir+"\\ff\\ffprobe.exe";
    var ffpath = userdir+"\\ff";
} else {
    var ffmpegpath = userdir+"/ff/ffmpeg";
    var ffprobepath = userdir+"/ff/ffprobe";
    var ffpath = userdir + "/ff";
}

function checkFF(os, file) {
    var query = {
        "os": os,
        "file": file
    };
    //console.log(query);
    var result = ffjson.filter(search, query);

    function search(user) {
        return Object.keys(this).every((key) => user[key] === this[key]);
    }
    if (result[0]) {
        return result[0].cs;
    } else {
        return null;
    }
}


ffbinaries.clearCache(); //SET IF DEBUGGING
var version = "4.2.1";

function downloadFFmpeg(callback) {
    $("#progressmsg").html('getting started: downloading FFmpeg binaries now...');

    function tickerFn(data) {
        //console.log('\x1b[2m' + data.filename + ': Downloading ' + (data.progress * 100).toFixed(1) + '%\x1b[0m');
        var elem = document.getElementById("myBar");
        var percnum = (data.progress * 100 / 2).toFixed(1);
        var perc = percnum + '%';
        //console.log(perc);
        if (elem.style.width < perc) {
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
        tickerInterval: 5000,
        version: version
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
        console.log(perc);
        if (elem.style.width < perc) {
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
        tickerInterval: 500,
        version: version
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


function noInternet() {
    $("#progressmsg").html('something went wrong, be sure you have internet access');
    internetCheckInterval = setInterval(internetCheck, 1000);
}

function internetCheck() {
    console.log(navigator.onLine);
    if (navigator.onLine) {
        firstRunFF();
        clearInterval(internetCheckInterval);
    } else {
        console.log('checking internet');
    }
}

function firstRunFF() {
    $('#myProgress, #cropview, #progressmsg').show();
    downloadFFmpeg(function(err, data) {
        if (err) {
            noInternet();
            console.log('Downloads failed:' + err);

        } else {
            var ffmpegCS = checkFF(os.platform(), "ffmpeg");
                if (ffmpegCS.search(checksum(ffmpegpath)) > -1) {

                downloadFFprobe(function(err, data) {
                    if (err) {
                        console.log('Downloads failed.');
                    } else {
                        var ffprobeCS = checkFF(os.platform(), "ffprobe");
                        if (ffprobeCS.search(checksum(ffprobepath)) > -1) {
                            var elem = document.getElementById("myBar");
                            var perc = '100%';
                            elem.style.width = perc;
                            $('#label').html('100%');
                            setTimeout(function() {
                                window.location.href = 'index.html';
                            }, 1000);
                        } else {
                            //ERROR CS
                            $("#myBar").css('background-color','red');
                            $("#progressmsg").html('the downloaded binary has been altered, contact bensmith.md@gmail.com');
                        }
                    }
                });
            } else {
                //ERROR CS
                $("#myBar").css('background-color','red');
                $("#progressmsg").html('the downloaded binary has been altered, contact bensmith.md@gmail.com');
            }
        }
    });
}

firstRunFF();