var fs = require('fs');
var path = require('path');
const ffpaths = require('./js/ffmpeg-paths');
var ffmpegpath = ffpaths.ffmpegPath;
var ffprobepath = ffpaths.ffprobePath;
var remote = require('@electron/remote')
const {
    ipcRenderer
} = require('electron');
var $ = require('jQuery');
var jQuery = $;
const {
    shell
} = require('electron');
var userdir =  remote.app.getPath('userData');

const os = require('os');
const ostemp = os.tmpdir();

// Work folders are removed on quit, but a crash leaves them behind -- and the
// manual-crop background in them is an UNCROPPED frame. Clear any older than a
// day (younger ones may belong to another running copy of the app).
try {
    fs.readdirSync(ostemp).forEach(function(d) {
        var dir = path.join(ostemp, d);
        if (d.startsWith('clipdeid-') && Date.now() - fs.statSync(dir).mtimeMs > 24 * 60 * 60 * 1000) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
} catch (e) {
    console.log('could not clear old work folders: ' + e.message);
}

workdir = path.join(ostemp, 'clipdeid-' + maketemp())
remote.getGlobal('workdirObj').prop1 = workdir;
console.log(workdir);

window.croppixelperc = 0.09;
var filelist = [];
var widtharr = [];
var heightarr = [];
var croppixelarr = [];
var canvasaspect;

var previewfile = workdir + '\\preview.png';
String.prototype.replaceAll = function(str1, str2, ignore) {
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignore ? "gi" : "g")), (typeof(str2) == "string") ? str2.replace(/\$/g, "$$$$") : str2);
}
previewfile = previewfile.replaceAll('c:\\', '/');
previewfile = previewfile.replaceAll('\\', '/');
var addfiledelay = 0;
var previewindex = 0;
var lastpercUL = 0;
var croppedfilelist = [];
var title, folder, finallink;
const spawn = require('cross-spawn');
const spawnsync = spawn.sync;

const Store = require('electron-store');
const store = new Store();

var trashname = process.platform === 'win32' ? 'Recycle Bin' : 'Trash';
$('#trashlabel').text('move to ' + trashname);
$('input[name=deletemode][value=' + (store.get('deleteMode') || 'trash') + ']').prop('checked', true);
$('#deleteorig').change(function() {
    $('#deletemode').css('visibility', this.checked ? 'visible' : 'hidden');
});
$('input[name=deletemode]').change(function() {
    store.set('deleteMode', this.value);
});

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
    // a quick cascade, capped so a big folder still lists within 0.3s
    // (same-delay timers fire in order, so the list stays in order)
    addfiledelay = Math.min(addfiledelay + 10, 300);
}
$("#filelistwrap").on('dragenter', function(event) {
    event.stopPropagation();
    event.preventDefault();
});
$("#filelistwrap").on('dragover', function(event) {
    event.stopPropagation();
    event.preventDefault();
});
// Accept drops anywhere in the window, but only while adding files -- a drop
// during preview or cropping would change filelist under a running batch.
$(document).on('drop', function(event) {
    event.preventDefault();
    if (!$('#filelistwrap').is(':visible')) {
        return;
    }
    // focusThisApp();
    ipcRenderer.send('focusnow', 'focus')
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
    originals = filelist.slice();
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
        ffmpeg = spawnsync(ffmpegpath, ['-i', filelist[0], '-an', '-vf', 'scale=min(1600\\,iw):-2', '-pix_fmt', 'rgb24', '-vframes', '1', '-f', 'image2', '-map_metadata', '-1', '-y', previewfile]);
        ffprobe = spawnsync(ffprobepath, ['-print_format', 'json', '-show_streams', '-i', filelist[0]]);

    // if(ismac){
    //     ffmpeg = spawnsync(ffmpegpath, ['-i', filelist[0], '-an', '-vf', 'scale=500:-1', '-pix_fmt', 'rgb24', '-vframes', '1', '-f', 'image2', '-map_metadata', '-1', '-y', previewfile]);
    //     ffprobe = spawnsync(ffprobepath, ['-print_format', 'json', '-show_streams', '-i', filelist[0]]);
    // } else {
    //     ffmpeg = spawnsync('cmd.exe', ['/c', ffmpegpath, '-i', filelist[0], '-an', '-vf', 'scale=500:-1', '-pix_fmt', 'rgb24', '-vframes', '1', '-f', 'image2', '-map_metadata', '-1', '-y', previewfile]);
    //     ffprobe = spawnsync('cmd.exe', ['/c', ffprobepath, '-print_format', 'json', '-show_streams', '-i', filelist[0]]);
    // }
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
    $('#deleteopts').hide();
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
        $('#deleteopts').fadeIn();
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

function customSpawn(command, args) {
    return () => new Promise((resolve, reject) => {
        console.log(command + args.join(" "));
        // if (!ismac) {
        //     var newargs = args.slice(0);
        //     newargs.unshift('"' + command + '"');
        //     newargs.unshift('/c');
        //     console.log(newargs.join(" "));
        //     child = spawn('cmd.exe', newargs, {
        //         windowsVerbatimArguments: true
        //     });
        // } else {
        //     child = spawn(command, args);
        // }
        const child = spawn(command, args);
        child.stderr.on('data', (data) => {
            console.log(command + " " + args.join(" ") + `stderr: ${data}`);
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
        child.on('error', reject);
    });
}

function updatetn(i) {
    return () => new Promise((resolve, reject) => {
        var thisindex = i + 1;
        var outfile = workdir + '/' + thisindex + '.' + previewindex + '.png';
        //widthcrop = 300;
        //heightcrop = Math.round((heightarr[i - 1] - croppixelarr[i - 1]) * 300 / widtharr[i - 1]);
        //var imagehtml = '<img src="' + outfile + '" draggable=false class=tnimage></img>';
        $('#tn img').attr("src", outfile);
        resolve(i);
    });
}

// Crop up to `concurrency` files at once. x264 already spreads one encode
// across every core, but overlapping two hides each file's single-threaded
// decode and startup: ~18% faster on real 800x600 clips, and more than two
// gained nothing. Resolves with the indexes of any files that failed.
function runcrops(files, croppedfiles, jobs, concurrency) {
    return new Promise(resolve => {
        var next = 0;
        var finished = 0;
        var failed = [];
        if (!jobs.length) {
            return resolve(failed);
        }

        function startnext() {
            if (next >= jobs.length) {
                return;
            }
            var i = next++;
            updatetn(i)();
            $('#activefile').html('creating: ' + path.basename(croppedfiles[i]));
            customSpawn(ffmpegpath, jobs[i])().catch(() => failed.push(i)).then(() => {
                finished++;
                if (failed.indexOf(i) == -1) {
                    $('#croplist').append(files[i] + '=>' + croppedfiles[i] + '<br>');
                } else {
                    $('#croplist').append(files[i] + ' could not be cropped<br>');
                }
                // #myBar has a CSS width transition, so this animates without
                // holding up the next crop
                var perc = Math.round(100 * finished / jobs.length);
                $('#myBar').css('width', perc + '%');
                $('#label').html(perc + '%');
                if (finished == jobs.length) {
                    // let the 0.2s width transition reach 100% and stay
                    // visible briefly before the done screen replaces it
                    setTimeout(() => resolve(failed), 500);
                } else {
                    startnext();
                }
            });
        }
        for (var k = 0; k < concurrency; k++) {
            startnext();
        }
    });
}

function finishcrop() {
    $('#myBar').css('width', '0%');
    $('#label').html('0%');
    $('#cropview').hide();
    $('#activefile').hide();
    $('#progressmsg').hide();
    $('#myProgress').hide();
    $('#tn').hide();
    $('#croppedlistwrap').fadeIn();
    $('#home').fadeIn();
    $('#done').fadeIn();
}

function setupcrop(i) {
    return () => new Promise((resolve, reject) => {
        $('#confirm').hide();
        $('#deleteopts').hide();
        $('#home').hide();
        $('#preview').hide();
        $('#previewsize').hide();
        $('#previewsizetext').hide();
        $('#cropbtn').hide();
        $('#manualbtn').hide();
        $('#progressmsg').fadeIn();
        $('#cropview').fadeIn();
        $('#activefile').fadeIn();
        $('#myProgress').fadeIn();
        $('#tn').fadeIn();
        resolve(i);
    });
}

// Delete the originals once every crop has finished. Only called when every
// crop in the batch exited 0; each cropped file is still checked before its
// original goes.
function removeoriginals(originalfiles, croppedfiles, mode) {
    return () => (async () => {
        var croppedresolved = croppedfiles.map(f => path.resolve(f));
        for (var i = 0; i < originalfiles.length; i++) {
            var original = originalfiles[i];
            var verified = false;
            try {
                verified = fs.statSync(croppedfiles[i]).size > 0;
            } catch (e) {}
            // never delete a file that is also one of this batch's outputs
            if (!verified || croppedresolved.indexOf(path.resolve(original)) != -1) {
                $('#croplist').append(original + ' was kept because its cropped copy could not be verified<br>');
                continue;
            }
            try {
                if (mode == 'trash') {
                    await shell.trashItem(original);
                    $('#croplist').append(original + ' was moved to the ' + trashname + '<br>');
                } else {
                    await fs.promises.unlink(original);
                    $('#croplist').append(original + ' was deleted<br>');
                }
            } catch (e) {
                $('#croplist').append(original + ' could not be deleted: ' + e.message + '<br>');
            }
        }
    })();
}

$('#cropbtn').click(function() { //SET UP CROPPING TASKS AND DO IT!
    //spawnsync('cmd.exe', ['/c','DEL','/s', '/q', workdir]); //CLEAR
    var deleteoriginals = $('#deleteorig').is(':checked');
    var deletemode = $('input[name=deletemode]:checked').val();
    // Only permanent deletion asks first; moving to the Trash can be undone.
    if (deleteoriginals && deletemode == 'permanent') {
        var choice = remote.dialog.showMessageBoxSync(remote.getCurrentWindow(), {
            type: 'warning',
            buttons: ['Cancel', 'Crop and Delete'],
            defaultId: 0,
            cancelId: 0,
            message: 'Permanently delete ' + filelist.length + ' original file' + (filelist.length == 1 ? '' : 's') + ' after cropping?',
            detail: 'Each original is deleted only after its cropped copy is saved. This cannot be undone.\n\nOn SSDs and USB drives, deleted files may still be recoverable. Keep FileVault (Mac) or BitLocker (Windows) turned on.'
        });
        if (choice != 1) {
            return;
        }
    }
    var jobs = [];
    croppedfilelist = [];
    //BUILD CROP AND DIM ARRAY
    for (var i = 0; i < filelist.length; i++) {
        nexti = i + 1;
        var croppath = path.dirname(filelist[i]);
        //console.log("PATH: " + croppath);
        var basename = path.basename(filelist[i]);
        var ext = basename.split('.');
        ext = '.' + ext[ext.length - 1];
        basename = path.basename(filelist[i], ext);

        //basename.splice(-1,1);
        //console.log('BASE:' + basename);
        var croppixel = croppixelarr[i];
        if (!window.cropW || !window.cropH || !window.cropX || !window.cropY) {
            var cropvftext = 'setsar=1,scale=trunc(iw/2)*2:trunc(ih/2)*2,crop=in_w:in_h-' + croppixel + ':0:' + croppixel;
        } else {
            var cropWidth = Math.round(widtharr[i] * window.cropW);
            var cropHeight = Math.round(heightarr[i] * window.cropH);
            var cropXstart = Math.round(widtharr[i] * window.cropX);
            var cropYstart = Math.round(heightarr[i] * window.cropY);
            var cropvftext = 'setsar=1,scale=trunc(iw/2)*2:trunc(ih/2)*2,crop=' + cropWidth + ':' + cropHeight + ':' + cropXstart + ':' + cropYstart;
        }
        if (isclip(filelist[i])) {
            var cropfile = path.join(croppath, basename + '_crop.mp4');
            var outfile = path.join(workdir, nexti + '.mp4');
            jobs.push(['-i', filelist[i], '-an', '-map_metadata', '-1', '-vf', cropvftext, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-y', '-pix_fmt', 'yuv420p', cropfile]);
        } else {
            var cropfile = path.join(croppath, basename + '_crop.png');
            var outfile = path.join(workdir, nexti + '.png');
            jobs.push(['-i', filelist[i], '-map_metadata', '-1', '-vf', cropvftext, '-f', 'image2', '-y', '-pix_fmt', 'rgb24', cropfile]);
        }

        croppedfilelist.push(cropfile);
    }
    var files = filelist.slice();
    var croppedfiles = croppedfilelist.slice();
    setupcrop(1)().then(() => runcrops(files, croppedfiles, jobs, 2)).then(failed => {
        finishcrop();
        if (!deleteoriginals) {
            return;
        }
        if (failed.length) {
            $('#croplist').append('No originals were deleted because ' + failed.length + ' file' + (failed.length == 1 ? '' : 's') + ' could not be cropped<br>');
            return;
        }
        return removeoriginals(files, croppedfiles, deletemode)();
    }).catch(err => console.log(err));

});

var originals = [];
var filelist = [];
var filepaths = [];

function preview() {
    var previewjobs = [];
    previewindex = previewindex + 1;
    $('#img-grid').html('');

    widtharr = [];
    heightarr = [];
    croppixelarr = [];
    var skip = 0;
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
        // if (!ismac) {
        //     fs.writeFileSync(workdir + '\\' + 'original_' + i + '.' + ext, fs.readFileSync(filelist[i]));
        //     filelist[i] = workdir + '\\' + 'original_' + i + '.' + ext;
        // }
        var nexti = i + 1;
        var ffprobe = spawnsync(ffprobepath, ['-print_format', 'json', '-show_streams', '-select_streams', 'v', '-i', filelist[i]]);

        // if (ismac) {
        //     var ffprobe = spawnsync(ffprobepath, ['-print_format', 'json', '-show_streams', '-select_streams', 'v', '-i', filelist[i]]);
        // } else {
        //     ffprobe = spawnsync('cmd.exe', ['/c', ffprobepath, '-print_format', 'json', '-show_streams', '-i', filelist[i]]);
        // }
        if (ffprobe.status.toString() == 0) {
            var ffprobeOb = JSON.parse(ffprobe.stdout);
            width = ffprobeOb.streams[0].width;
            height = ffprobeOb.streams[0].height;
            if (isstill(filelist[i])) {
                if (width < 50 || height < 50) {
                    var filename = filepaths[i].replace(/^.*[\\\/]/, '');
                    $('#croplist').append(originals[i].toString() + ' was removed because it was a tiny image' + '<br>');

                    filelist.splice(i, 1);
                    filepaths.splice(i, 1);
                    originals.splice(i, 1);
                    i = i - 1;
                    skip = 1;
                }
            }
            var outfile = workdir + '/' + nexti + '.' + previewindex + '.png';
            var croppixel = 2 * Math.round(height * window.croppixelperc / 2);
            widtharr.push(width);
            heightarr.push(height);
            croppixelarr.push(croppixel);
            if (!window.cropW || !window.cropH || !window.cropX || !window.cropY) {
                var cropvftext = 'setsar=1,scale=trunc(iw/2)*2:trunc(ih/2)*2,crop=in_w:in_h-' + croppixel + ':0:' + croppixel + ',scale=650:-1';
            } else {
                var cropWidth = Math.round(widtharr[i] * window.cropW);
                var cropHeight = Math.round(heightarr[i] * window.cropH);
                var cropXstart = Math.round(widtharr[i] * window.cropX);
                var cropYstart = Math.round(heightarr[i] * window.cropY);
                var cropvftext = 'setsar=1,scale=trunc(iw/2)*2:trunc(ih/2)*2,crop=' + cropWidth + ':' + cropHeight + ':' + cropXstart + ':' + cropYstart + ',scale=650:-1';
            }
            var previewargs = ['-i', filelist[i], '-an', '-vf', cropvftext, '-map_metadata', '-1', '-pix_fmt', 'rgb24', '-vframes', '1', '-f', 'image2', '-y', outfile];
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
        if (skip != 1) {
            previewjobs.push({ n: nexti, args: previewargs });
        } else {
            skip = 0;
        }
    }
    $('#loading-container').hide();
    // shown with the preview box (not later, with the buttons) because it sits
    // above it -- appearing afterwards would push the previews down
    $('#confirm').show();
    $('#preview').show();
    $('#previewsize').show();
    $('#previewsizetext').show();
    // Placeholders in file order, filled in as each frame is ready, so the
    // grid stays in order even though frames finish out of order.
    $('#img-grid').html(previewjobs.map(j => '<div class="previewimg"><img class="previewstill" id="previewstill' + j.n + '" draggable=false style="width:' + previewimgpx + '"></img></div>').join(''));
    // Single-frame extractions are mostly process startup and decoder setup,
    // so unlike full encodes they parallelise well: 4 at a time is ~3.5x
    // faster on real clips; more gained little.
    runlimited(previewjobs.map(j => () => customSpawn(ffmpegpath, j.args)().then(previewdump(j.n))), 4)
        .then(showbtns())
        .catch(err => console.log(err));
}

// Run task factories with at most `concurrency` in flight. A failed task
// doesn't stop the others; resolves once every task has settled.
function runlimited(tasks, concurrency) {
    return new Promise(resolve => {
        var next = 0;
        var settled = 0;
        if (!tasks.length) {
            return resolve();
        }

        function startnext() {
            if (next >= tasks.length) {
                return;
            }
            tasks[next++]().catch(err => console.log(err)).then(() => {
                settled++;
                if (settled == tasks.length) {
                    resolve();
                } else {
                    startnext();
                }
            });
        }
        for (var k = 0; k < concurrency; k++) {
            startnext();
        }
    });
}

function previewdump(i) {
    return () => new Promise((resolve, reject) => {
        var time = new Date().toLocaleString();
        var timestamp = encodeURI(time);
        outfile = workdir + '/' + i + '.' + previewindex + '.png?' + timestamp;
        $('#previewstill' + i).attr('src', outfile);
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
    // $('.cropsample').attr('src', )
    $('#confirm').hide(); // before measuring: it sits above the canvas
    $('#canvaswrap').css({ display: 'block', visibility: 'hidden' });
    cropdrawn = false; // start empty, even if a crop was saved last time
    fitcropcanvas();
    $('#canvaswrap').css({ display: 'none', visibility: '' }).fadeIn();
    $('#highlight').fadeIn();
    $('#manualOKbtn').fadeIn();
    $('#manualbtn').fadeOut();
    $('#cropbtn').fadeOut();
    $('#deleteopts').hide();
});
// Size the crop canvas to the window, keeping the frame's aspect: as wide as
// the window allows, unless that would run into the caption + OK button below.
// Safe at any size because cropselect.v2.js records the crop as a FRACTION of
// the canvas, applied to each source file's own dimensions -- as long as the
// frame fills the canvas exactly (`background-size: 100% 100%` in style.css).
// Resizing a canvas clears it, so a selection drawn since opening is redrawn.
var cropdrawn = false;
$('#myCanvas').on('mousedown', function() {
    cropdrawn = true;
});
var CROP_RESERVE_BELOW = 140; // caption (~40px) + OK button (bottom:30px, ~56px tall) + gap
function fitcropcanvas() {
    var top = document.getElementById('canvaswrap').getBoundingClientRect().top;
    var maxW = window.innerWidth - 60;
    var maxH = Math.max(200, window.innerHeight - top - CROP_RESERVE_BELOW);
    var w = maxW;
    var h = Math.round(maxW * canvasaspect);
    if (h > maxH) {
        h = maxH;
        w = Math.round(maxH / canvasaspect);
    }
    $('#myCanvas').attr('width', w).attr('height', h);
    $('#canvaswrap').css('width', w + 'px');
    canvasheight = h;
    if (cropdrawn && window.cropW && window.cropH && window.redrawcrop) {
        window.redrawcrop(window.cropX, window.cropY, window.cropW, window.cropH);
    }
}
$(window).on('resize', function() {
    if ($('#canvaswrap').is(':visible')) {
        fitcropcanvas();
    }
});

$('#manualOKbtn').click(function() {
    $(this).hide();
    fs.rm(previewfile, { force: true }, () => {}); // uncropped frame, no longer needed
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
$('#myCanvas').click(function() {});
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
    $('#deleteopts').hide();
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
    $('#deleteorig').prop('checked', false);
    $('#deletemode').css('visibility', 'hidden');
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
    fitpreviewsize(true);
    $(window).on('resize', function() {
        fitpreviewsize(false);
    });
});

// Start the preview size at the largest that fits three thumbnails per row,
// with the handle in the middle of the slider (max mirrors min around it).
// Each tile adds 30px of padding; the preview box loses 22px to margin +
// border and 11px to its scrollbar. On resize only the max moves, so the
// user's chosen size is kept unless it no longer fits.
function fitpreviewsize(reset) {
    var threecolpx = Math.floor((window.innerWidth - 22 - 11) / 3) - 30;
    var max = 2 * threecolpx - $('.range').slider('option', 'min');
    $('.range').slider('option', 'max', max);
    var px = reset ? threecolpx : Math.min($('.range').slider('value'), max);
    $('.range').slider('value', px);
    previewimgpx = px + 'px';
    $('.previewstill').css('width', previewimgpx);
}