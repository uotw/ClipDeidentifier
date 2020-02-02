var remote = require('electron').remote;
//window.devicePixelRatio=2;
var $ = require('jQuery');
var jQuery = $;
const {
    shell
} = require('electron');
var appRootDir = require('app-root-dir').get();
var os = require("os");
var pid = remote.process.pid;
if (os.platform() == "darwin") {
    var ismac = 1;
} else {
    var ismac = 0;
}
if (ismac) {
    var ffmpegpath = appRootDir + '/bin/mac/ffmpeg';
    var ffprobepath = appRootDir + '/bin/mac/ffprobe';
    var appswitchpath = appRootDir + '/bin/mac/appswitch';
    var magickpath = appRootDir + '/bin/mac/magick';
} else {
    var winoriginal;
    var ffmpegpath = appRootDir + '\\bin\\win\\ffmpeg.exe';
    var ffprobepath = appRootDir + '\\bin\\win\\ffprobe.exe';
    var sendkeysbatpath = appRootDir + '\\bin\\win\\sendKeys.bat';
    var temporiginal = workdir + '\\temp.mp4';
    var convertpath = appRootDir + '\\bin\\win\\convert.exe';
    var identifypath = appRootDir + '\\bin\\win\\identify.exe';
}

function focusThisApp() {
    if (ismac) {
        var focus = spawn(appswitchpath, ['-p', pid]);
    } else {
        var focus = spawn('cmd.exe', ['/c', 'call', '"' + sendkeysbatpath + '"', '"Clip Deidentifier"', '""'], {
            windowsVerbatimArguments: true
        });
    }
    focus.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    focus.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });
}

var filelist = [];
var widtharr = [];
var heightarr = [];
var croppixelarr = [];
var canvasaspect;
var osTmpdir = require('os-tmpdir');
var temp = osTmpdir();
var workdir = temp + '/' + maketemp();
remote.getGlobal('workdirObj').prop1 = workdir;
console.log(workdir);

var previewfile = workdir + '\\preview.png';
String.prototype.replaceAll = function(str1, str2, ignore) {
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignore ? "gi" : "g")), (typeof(str2) == "string") ? str2.replace(/\$/g, "$$$$") : str2);
}
previewfile = previewfile.replaceAll('c:\\', '/');
previewfile = previewfile.replaceAll('\\', '/');
var addfiledelay = 0;
var previewindex = 0;
var lastperc = 0;
var lastpercUL = 0;
var fs = require('fs');
var path = require('path');
var croppedfilelist = [];
var title, folder, finallink;
window.croppixelperc = 0.09;
const spawn = require('child_process').spawn;
const spawnsync = require('child_process').spawnSync;
const Store = require('electron-store');
const store = new Store();

if (store.get('cropWidth')) {
    window.cropW = store.get('cropWidth');
    window.cropH = store.get('cropHeight');
    window.cropX = store.get('cropXstart');
    window.cropY = store.get('cropYstart');
} else {

}

function maketemp() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 10; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function run_cmd(cmd, args, callBack) {
    var spawn = require('child_process').spawn;
    var child = spawn(cmd, args);
    var resp = "";
    child.stdout.on('data', function(buffer) {
        resp += buffer.toString()
    });
    child.stdout.on('end', function() {
        callBack(resp)
    });
} // ()
function isclip(filename) {
    var clipext = ['mp4', 'm4v', 'avi', 'wmv', 'mov', 'flv', 'mpg', 'mpeg'];
    for (var i = 0; i < clipext.length; i++) {
        if (filename.toLowerCase().split('.').pop().indexOf(clipext[i]) >= 0) {
            return (1);
        }
    }
    return (0);
}

function isstill(filename) {
    var stillext = ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif'];
    for (var i = 0; i < stillext.length; i++) {
        if (filename.toLowerCase().split('.').pop().indexOf(stillext[i]) >= 0) {
            return (1);
        }
    }
    return (0);
}

function search(startPath) {
    var path = require('path');
    var list = [];
    if (!fs.existsSync(startPath)) {
        return;
    }
    var files = fs.readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
        var filename = path.join(startPath, files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            var list_temp = [];
            list_temp = search(filename); //recurse
            for (var m = 0; m < list_temp.length; m++) {
                list.push(list_temp[m]);
            }
        } else if (isstill(filename) || isclip(filename)) {
            list.push(filename);
        } else {
            $('#croplist').append(filename + ' was ignored because it was not an image file' + '<br>');
            console.log(filename);
        }
    }
    return (list);
}

function addtofilelist(toappend) {
    setTimeout(function() {
        $('#filelist').append(toappend);
        $('#filelist').animate({
            scrollTop: $('#filelist').prop("scrollHeight")
        }, 10);
    }, addfiledelay);
    addfiledelay += 50;
}
$("#filelistwrap").on('dragenter', function(event) {
    event.stopPropagation();
    event.preventDefault();
});
$("#filelistwrap").on('dragover', function(event) {
    event.stopPropagation();
    event.preventDefault();
});
$("#filelistwrap").on('drop', function(event) {
    event.preventDefault();
    focusThisApp();

    var path = require('path');
    var files = event.originalEvent.dataTransfer.files;
    for (var i = 0; i < files.length; i++) {
        name = files[i].name;
        path = files[i].path;
        if (fs.lstatSync(path).isDirectory()) {
            var temp_list = [];
            temp_list = search(path);
            for (var k = 0; k < temp_list.length; k++) {
                if (filelist.indexOf(temp_list[k]) == -1) {
                    filelist.push(temp_list[k]);
                    index = filelist.length;
                    //$('#filelist').append(index + ': ' + temp_list[k] + '<br />');
                    addtofilelist(index + ': ' + temp_list[k] + '<br />');
                }
            }
        } else if (isstill(name) || isclip(name)) {
            if (filelist.indexOf(path) == -1) {
                filelist.push(path);
                index = filelist.length;
                addtofilelist(index + ': ' + path + '<br />');
            }
        } else {
            $('#croplist').append(name + ' was ignored because it was not an image file' + '<br>');
            console.log(name);
        }
    }
    addfiledelay = 0;
    addfilestatus();
    $('#previewbtn').fadeIn();
    $('#clearbtn').fadeIn();
    $('#drag').css('visibility', 'hidden');
});
$('#clearbtn').click(function() {
    filelist = [];
    $('#filelist').html('');
    $('#previewbtn').fadeOut();
    $(this).hide();
    $('#drag').css('visibility', 'visible');
    addfilestatus();
});
$(document).on('dragenter', function(e) {
    e.stopPropagation();
    e.preventDefault();
});
$(document).on('dragover', function(e) {
    e.stopPropagation();
    e.preventDefault();
});
$(document).on('drop', function(e) {
    e.stopPropagation();
    e.preventDefault();
});

function canvasbg(filelist) {

    ffmpeg = spawnsync(ffmpegpath, ['-i', filelist[0], '-an', '-vf', 'scale=500:-1', '-pix_fmt', 'rgb24', '-vframes', '1', '-f', 'image2', '-map_metadata', '-1', '-y', previewfile]);
    ffprobe = spawnsync(ffprobepath, ['-print_format', 'json', '-show_streams', '-i', filelist[0]]);
    ffprobeOb = JSON.parse(ffprobe.stdout);
    return (ffprobeOb);

}
$('#previewbtn').click(function() { //Generate page of 9% cropped thumbnails to preview
    if (!fs.existsSync(workdir)) {
        fs.mkdirSync(workdir);
    }
    $('#clearbtn').hide();
    $('#filelistwrap').hide();
    $('#addfilestatus').hide();
    $('#previewbtn').hide();
    $('#cropbtn').hide();
    $('#confirm').hide();
    $('#loading-container').show();
    setTimeout(function() {
        preview();
    }, 10);
});

function showbtns() {
    return () => new Promise((resolve, reject) => {
        $('#home').fadeIn();
        $('#cropbtn').fadeIn();
        $('#manualbtn').fadeIn();
        $('#confirm').fadeIn();
        resolve();
    });
}

function setcropvars() {
    //console.log(window.cropW, window.cropH, window.cropX, window.cropY);
    store.set('cropWidth', window.cropW);
    store.set('cropHeight', window.cropH);
    store.set('cropXstart', window.cropX);
    store.set('cropYstart', window.cropY);
}

function queue(tasks) {
    let index = 0;
    const runTask = (arg) => {
        if (index >= tasks.length) {
            return Promise.resolve(arg);
        }
        return new Promise((resolve, reject) => {
            tasks[index++](arg).then(arg => resolve(runTask(arg))).catch(reject);
        });
    }
    return runTask();
}

function customSpawn(command, args) {
    return () => new Promise((resolve, reject) => {
        if (!ismac) {
            var newargs = args.slice(0);
            newargs.unshift('"' + command + '"');
            newargs.unshift('/c');
            console.log(newargs.join(" "));
            child = spawn('cmd.exe', newargs, {
                windowsVerbatimArguments: true
            });
        } else {
            child = spawn(command, args);
        }
        // const child = spawn(command, args, {
        //     windowsVerbatimArguments: true
        // });
        child.stderr.on('data', (data) => {
            console.log(command + args + `stderr: ${data}`);
        });
        child.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        child.on('close', code => {
            if (code === 0) {
                resolve();
            } else {
                reject();
            }
        });
    });
}

function updatetn(i) {
    return () => new Promise((resolve, reject) => {
        var thisindex = i + 1;
        var outfile = workdir + '/' + thisindex + '.' + previewindex + '.png';
        //widthcrop = 300;
        //heightcrop = Math.round((heightarr[i - 1] - croppixelarr[i - 1]) * 300 / widtharr[i - 1]);
        var imagehtml = '<img src="' + outfile + '" draggable=false class=tnimage></img>';
        $('#tn').html(imagehtml);
        resolve(i);
    });
}

function progress(i) {
    return () => new Promise((resolve, reject) => {
        if (!ismac) {
            console.log(croppedfilelist);
            var fullpath = originals[i];
            var dir = path.dirname(fullpath);
            var ext = path.extname(fullpath);
            var basename = path.basename(fullpath, ext);
            var finalcroppedfile = dir + basename + "_crop" + ext;
            console.log("trying to write: " + croppedfilelist[i] + " => " + finalcroppedfile);
            //fs.writeFileSync(finalcroppedfile, fs.readFileSync(croppedfilelist[i]));
        }
        //console.log("trying to write: "+croppedfilelist[i]+" => "+ filepaths[i]);
        stop = Math.round(100 * (i + 1) / filelist.length);
        var elem = document.getElementById("myBar");
        start = lastperc;
        var width = start;
        //$('#myBar').animate({width:stop+'%'});
        var id = setInterval(frame, 30);

        function frame() {
            if (width >= stop) {
                clearInterval(id);
                resolve(i);
                if (i + 1 == filelist.length) {
                    elem.style.width = "0%";
                    $('#myBar').css('width', '0%');
                    document.getElementById("label").innerHTML = "0%";
                    lastperc = 0;
                    $('#activefile').hide();
                    $('#progressmsg').hide();
                    $('#myProgress').hide();
                    $('#tn').hide();
                    $('#croppedlistwrap').fadeIn();
                    $('#home').fadeIn();
                    $('#done').fadeIn();
                }
            } else {
                width++;
                elem.style.width = width + '%';
                document.getElementById("label").innerHTML = width * 1 + '%';
            }
        }
        lastperc = stop;
        if (i < filelist.length - 1) {
            //console.log('file:'+filepaths[i+1]);
            var filename = filepaths[i + 1].replace(/^.*[\\\/]/, '');
            $('#activefile').html('creating: ' + filename);
            //$('#croplist').append(originals[i+1]+'=>'+filepaths[i+1]+'<br>');
        }
    });
}

function setupcrop(i) {
    return () => new Promise((resolve, reject) => {
        $('#confirm').hide();
        $('#home').hide();
        $('#preview').hide();
        $('#previewsize').hide();
        $('#previewsizetext').hide();
        $('#cropbtn').hide();
        $('#manualbtn').hide();
        $('#progressmsg').fadeIn();
        $('#activefile').fadeIn();
        $('#myProgress').fadeIn();
        $('#tn').fadeIn();
        resolve(i);
    });
}

$('#cropbtn').click(function() { //SET UP CROPPING TASKS AND DO IT!
    //spawnsync('cmd.exe', ['/c','DEL','/s', '/q', workdir]); //CLEAR
    var myqueue = [];
    croppedfilelist = [];
    var filename = filepaths[0].replace(/^.*[\\\/]/, '')
    $('#activefile').html('creating: ' + filename);
    myqueue.push(setupcrop(1));
    //BUILD CROP AND DIM ARRAY
    for (var i = 0; i < filelist.length; i++) {
        nexti = i + 1;
        myqueue.push(updatetn(i));
        var croppath = path.dirname(filelist[i]);
        console.log("PATH: " + croppath);
        var basename = path.basename(filelist[i]);
        var ext = basename.split('.');
        ext = '.' + ext[ext.length - 1];
        basename = path.basename(filelist[i], ext);

        //basename.splice(-1,1);
        console.log('BASE:' + basename);
        if (isclip(filelist[i])) {
            var cropfile = croppath + '/' + basename + '_crop.mp4';
            var croppixel = croppixelarr[i];
            var outfile = workdir + '/' + nexti + '.mp4';
            if (!window.cropW) {
                var cropvftext = 'setsar=1,scale=trunc(iw/2)*2:trunc(ih/2)*2,crop=in_w:in_h-' + croppixel + ':0:' + croppixel;
            } else {
                var cropWidth = Math.round(widtharr[i] * window.cropW);
                var cropHeight = Math.round(heightarr[i] * window.cropH);
                var cropXstart = Math.round(widtharr[i] * window.cropX);
                var cropYstart = Math.round(heightarr[i] * window.cropY);
                var cropvftext = 'setsar=1,scale=trunc(iw/2)*2:trunc(ih/2)*2,crop=' + cropWidth + ':' + cropHeight + ':' + cropXstart + ':' + cropYstart;
            }
            if (ismac) {
                myqueue.push(customSpawn(ffmpegpath, ['-i', filelist[i], '-an', '-map_metadata', '-1', '-vf', cropvftext, '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-y', '-pix_fmt', 'yuv420p', cropfile]));
            } else {
                myqueue.push(customSpawn('"' + ffmpegpath + '"', ['-i', filelist[i], '-map_metadata', '-1', '-vf', cropvftext, '-vcodec', 'libx264', '-pix_fmt', 'yuv420p', '-y', cropfile]));
            }
        } else {
            var cropfile = croppath + '/' + basename + '_crop.jpg';
            if (!window.cropW) {
                var percent = window.croppixelperc * 100;
                var croppixels = '0x' + percent + '%';
                if (ismac) {
                    myqueue.push(customSpawn(magickpath, ['convert', filelist[i], '-interlace', 'line', '-chop', '0x' + croppixels, '-strip', cropfile]));
                } else {
                    myqueue.push(customSpawn('"' + convertpath + '"', [filelist[i], '-interlace', 'line', '-chop', '0x' + croppixels, '-strip', cropfile]));
                }
            } else {
                var cropWidth = Math.round(widtharr[i] * window.cropW);
                var cropHeight = Math.round(heightarr[i] * window.cropH);
                var cropXstart = Math.round(widtharr[i] * window.cropX);
                var cropYstart = Math.round(heightarr[i] * window.cropY);
                var cropgeo = cropWidth + 'x' + cropHeight + '+' + cropXstart + '+' + cropYstart;
                if (ismac) {
                    myqueue.push(customSpawn(magickpath, ['convert', filelist[i], '-interlace', 'line', '-crop', cropgeo, '-strip', cropfile]));
                } else {
                    myqueue.push(customSpawn('"' + convertpath + '"', [filelist[i], '-interlace', 'line', '-crop', cropgeo, '-strip', cropfile]));
                }
            }
        }
        croppedfilelist.push(cropfile);
        $('#croplist').append(filelist[i] + '=>' + cropfile + '<br>');
        myqueue.push(progress(i));
    }
    //LAST ITEM IN QUEUE, CALL FINISH
    queue(myqueue).then(([cmd, args]) => {
    }).catch(TypeError, function(e) {}).catch(err => console.log(err));


});

var originals = [];
var filelist = [];
var filepaths = [];
function preview() {
    var myqueue = [];
    previewindex = previewindex + 1;
    $('#img-grid').html('');

    widtharr = [];
    heightarr = [];
    croppixelarr = [];
    myqueue = [];
    var skip = 0;
    originals = filelist.slice();
    for (var i = 0; i < filelist.length; i++) {
        var nameonly = filelist[i].split("\\");
        nameonly = nameonly.slice(-1);
        nameonly = nameonly.join();
        var ext = nameonly.split(".").slice(-1);
        var basename = nameonly.split(".");
        basename.pop();
        basename = basename.join(".");
        var folderonly = filelist[i].split("\\");
        folderonly.pop();
        folderonly = folderonly.join("\\");
        filecrop = folderonly + '\\' + basename + '_crop.' + ext;
        filepaths.push(filecrop);
        if (!ismac) {
            fs.writeFileSync(workdir + '\\' + 'original_' + i + '.' + ext, fs.readFileSync(filelist[i]));
            filelist[i] = workdir + '\\' + 'original_' + i + '.' + ext;
        }
        var nexti = i + 1;
        var outfile = workdir + '/' + nexti + '.' + previewindex + '.png';
        if (isstill(filelist[i])) {
            if (ismac) {
                var identify = spawnsync(magickpath, ['convert', filelist[i], '-ping', '-format', '%w:%h', 'info:']);
            } else {
                var identify = spawnsync('cmd.exe', ['/c', '"' + identifypath + '"', '-ping', '-format', '%w:%h', filelist[i]], {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    windowsVerbatimArguments: true
                });
            }
            if (identify.status.toString() == 0) {
                var imageinfo = identify.stdout.toString();
                height = imageinfo.split(':')[1];
                width = imageinfo.split(':')[0];
                if (width < 50 || height < 50) {
                    var filename = filepaths[i].replace(/^.*[\\\/]/, '');
                    $('#croplist').append(originals[i].toString() + ' was removed because it was a tiny image' + '<br>');

                    filelist.splice(i, 1);
                    filepaths.splice(i, 1);
                    originals.splice(i, 1);
                    i = i - 1;
                    skip = 1;
                } else {
                    //CONVERT MODIFY
                    widtharr.push(width);
                    heightarr.push(height);
                    croppixelarr.push(croppixel);
                    var percent = window.croppixelperc * 100;
                    var croppixels = '0x' + percent + '%';
                    if (!window.cropW) {
                        var percent = window.croppixelperc * 100;
                        var croppixels = '0x' + percent + '%';
                        if (ismac) {
                            myqueue.push(customSpawn(magickpath, ['convert', filelist[i], '-interlace', 'line', '-chop', croppixels, '-resize', '650', '-strip', outfile]));
                        } else {
                            myqueue.push(customSpawn('"' + convertpath + '"', [filelist[i], '-interlace', 'line', '-chop', croppixels, '-resize', '650', '-strip', outfile]));
                        }
                    } else {
                        var cropWidth = Math.round(widtharr[i] * window.cropW);
                        var cropHeight = Math.round(heightarr[i] * window.cropH);
                        var cropXstart = Math.round(widtharr[i] * window.cropX);
                        var cropYstart = Math.round(heightarr[i] * window.cropY);
                        var cropgeo = cropWidth + 'x' + cropHeight + '+' + cropXstart + '+' + cropYstart;
                        if (ismac) {
                            myqueue.push(customSpawn(magickpath, ['convert', filelist[i], '-crop', cropgeo, '-resize', '650', '-strip', outfile]));
                        } else {
                            myqueue.push(customSpawn('"' + convertpath + '"', [filelist[i], '-crop', cropgeo, '-resize', '650', '-strip', outfile]));
                        }
                    }
                    //      myqueue.push(customSpawn(magickpath, ['convert', filelist[i], '-interlace', 'line', '-chop',croppixels , '-resize', '650', outfile]));
                }
            } else {
                var filename = filepaths[i].replace(/^.*[\\\/]/, '');
                $('#croplist').append(originals[i].toString() + ' was ignored because it was not an image file' + '<br>');
                console.log(originals[i].toString());
                filelist.splice(i, 1);
                originals.splice(i, 1);
                filepaths.splice(i, 1);
                i = i - 1;
                skip = 1;
            }
        } else {
            //console.log('looks like a video...');
            //ffprobe = spawnsync( 'cmd.exe', ['/c', ffprobepath, '-print_format', 'json', '-show_streams', '-i', filelist[i]]);
            ffprobe = spawnsync(ffprobepath, ['-print_format', 'json', '-show_streams', '-i', filelist[i]]);
            //ffprobe = spawnsync( 'cmd.exe', ['/c', ffprobebatpath,filelist[i]])
            //console.log(ffprobe.stdout.toString());
            if (ffprobe.status.toString() == 0) {
                ffprobeOb = JSON.parse(ffprobe.stdout);
                width = ffprobeOb.streams[0].width;
                height = ffprobeOb.streams[0].height;
                var croppixel = 2 * Math.round(height * window.croppixelperc / 2);
                widtharr.push(width);
                heightarr.push(height);
                croppixelarr.push(croppixel);
                //console.log(width, height);
                //var ffmpeg = spawnsync('cmd.exe', ['/c', ffmpegpreviewbatpath, croppixel,filelist[i], outfile]);
                //console.log(ffmpeg.stderr.toString());
                //myqueue.push(customSpawn('cmd.exe', ['/c', ffmpegpreviewbatpath, croppixel,filelist[i], outfile]));
                if (!window.cropW) {
                    var cropvftext = 'setsar=1,scale=trunc(iw/2)*2:trunc(ih/2)*2,crop=in_w:in_h-' + croppixel + ':0:' + croppixel + ',scale=650:-1';
                } else {
                    var cropWidth = Math.round(widtharr[i] * window.cropW);
                    var cropHeight = Math.round(heightarr[i] * window.cropH);
                    var cropXstart = Math.round(widtharr[i] * window.cropX);
                    var cropYstart = Math.round(heightarr[i] * window.cropY);
                    var cropvftext = 'setsar=1,scale=trunc(iw/2)*2:trunc(ih/2)*2,crop=' + cropWidth + ':' + cropHeight + ':' + cropXstart + ':' + cropYstart + ',scale=650:-1';
                }
                myqueue.push(customSpawn(ffmpegpath, ['-i', filelist[i], '-an', '-vf', cropvftext, '-map_metadata', '-1', '-pix_fmt', 'rgb24', '-vframes', '1', '-f', 'image2', '-y', outfile]));
            } else {
                var filename = filepaths[i].replace(/^.*[\\\/]/, '');
                $('#croplist').append(originals[i].toString() + ' was ignored because it was not an image file' + '<br>');
                //console.log(originals[i].toString());
                originals.splice(i, 1);
                filelist.splice(i, 1);
                filepaths.splice(i, 1);
                i = i - 1;
                skip = 1;
            }
        }
        if (skip != 1) {
            myqueue.push(previewdump(nexti));
        } else {
            skip = 0;
        }
    }
    $('#loading-container').hide();
    $('#preview').show();
    $('#previewsize').show();
    $('#previewsizetext').show();
    myqueue.push(showbtns());
    queue(myqueue).then(([cmd, args]) => {
        console.log(cmd + ' finished - all finished');
    }).catch(TypeError, function(e) {}).catch(err => console.log(err));
}

function previewdump(i) {
    return () => new Promise((resolve, reject) => {
        var time = new Date().toLocaleString();
        var timestamp = encodeURI(time);
        outfile = workdir + '/' + i + '.' + previewindex + '.png?' + timestamp;
        var imagehtml = '<div class="previewimg"><img class="previewstill" src="' + outfile + '" draggable=false style="width:' + previewimgpx + '"></img></div>';
        $('#img-grid').append(imagehtml);
        resolve(i);
    });
}
$('#manualbtn').click(function() {
    window.caliperdraw = true;
    window.draw = false;
    $('#preview').hide();
    $('#previewsize').hide();
    $('#previewsizetext').hide();
    dim = canvasbg(filelist);
    width = dim.streams[0].width;
    height = dim.streams[0].height;
    canvasaspect = height / width;
    var time = new Date().toLocaleString();
    var timestamp = encodeURI(time);
    $('#myCanvas').css("background-image", "url(" + previewfile + "?" + timestamp + ")");
    canvasheight = 500 * canvasaspect;
    $('#myCanvas').attr('height', canvasheight);
    $('#canvaswrap').fadeIn();
    $('#highlight').fadeIn();
    $('#manualOKbtn').fadeIn();
    $('#manualbtn').fadeOut();
    $('#cropbtn').fadeOut();
    $('#confirm').hide();
});
$('#manualOKbtn').click(function() {
    $(this).hide();
    $('#canvaswrap').hide();
    $('#highlight').hide();
    $('#loading-container').show();
    setTimeout(function() {
        setcropvars();
        preview(window.croppixelperc);
        $('#preview').show();
        $('#previewsize').show();
        $('#previewsizetext').show();
        $('#loading-container').hide();
    }, 10);
});
$('#myCanvas').click(function() {
});
$('#filelistbtn').click(function() {
    $('#filelistwrap').hide();
    for (var i = 0; i < filelist.length; i++) {
        $('#filelist').append(i + ': ' + filelist[i] + '<br />');
        addtofilelist(i + ': ' + filelist[i] + '<br />');
    }
    $('#filelistwrap').show();
    $('body, html').scrollLeft(1000);
    $(this).hide();
    $('#previewbtn').fadeIn();
    $('#addbtn').fadeIn();
});
$('#addbtn').click(function() {
    $('#filelist').html('');
    $('#filelistwrap').hide();
    $('#filelistwrap').show();
    $(this).hide();
    $('#filelistbtn').fadeIn();
});

function addfilestatus() {
    var clipnum = 0;
    var stillnum = 0;
    for (var i = 0; i < filelist.length; i++) {
        if (isclip(filelist[i])) {
            clipnum = clipnum + 1;
        }
        if (isstill(filelist[i])) {
            stillnum = stillnum + 1;
        }
    }
    $('#addfilestatus').html(clipnum + ' clips, ' + stillnum + ' stills added');
    $('#addfilestatus').show();
}
$('#add').click(function() {
    $('#finallinkwrap').hide();
    $('#addornew').hide();
    //console.log('trying to load');
    loadmyarchives();
});


$('#okselect').click(function() {
    //console.log($('#myarchives').val());
    folder = $('#myarchives').val();
    $('#addselect').hide();
    $('#filelistwrap').fadeIn();
});
$('#home').click(function() {
    addfiledelay = 0;
    $('#done').hide();
    $('#confirm').hide();
    $('#activefile').hide();
    $('#activefileUL').hide();
    $('#addselect').hide();
    $('#canvaswrap').hide();
    $('#clearbtn').hide();
    $('#cropbtn').hide();
    $('#filelistwrap').hide();
    $('#finallinkwrap').hide();
    $('#highlight').hide();
    $('#loading-container').hide();
    $('#myProgress').hide();
    $('#myProgressUL').hide();
    $('#newtitle').hide();
    $('#preview').hide();
    $('#previewsize').hide();
    $('#previewsizetext').hide();
    $('#previewbtn').hide();
    $('#progressmsg').hide();
    $('#progressmsgUL').hide();
    $('#manualOKbtn').hide();
    filelist = [];
    filepaths = [];
    $('#filelist').html('');
    $(this).hide();
    addfilestatus();
    $('#filelistwrap').fadeIn();
    $('#addfilestatus').hide();
    $('#croplist').html('');
    $('#croppedlistwrap').hide();
    $('#drag').css('visibility', 'visible');
    $('#manualbtn').hide();
});
window.addEventListener('beforeunload', onbeforeunload);
require('jquery-ui-bundle');
var previewimgpx;
$(document).ready(function() {
    $(".range").slider({
        min: 50,
        value: 350,
        max: 650,
        orientation: "horizontal",
        range: "min",
        animate: true,
        slide: function(event, ui) {
            previewimgpx = ui.value + 'px';
            $('.previewstill').css('width', ui.value + 'px');
        }
    });
});