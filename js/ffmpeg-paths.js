// ffmpeg-paths.js - locate the bundled ffmpeg/ffprobe binaries.
//
// Same approach as the SonoClipShare Uploader: ffmpeg-static ships one
// binary for the install-time platform/arch, ffprobe-static ships every
// platform under bin/<platform>/<arch>/. The release workflow swaps in the
// x64 ffmpeg before the Intel mac build (see .github/workflows/release.yml).
//
// Exception: ffprobe-static's darwin/arm64 binary is actually x86_64, so on
// Apple Silicon it runs under Rosetta and its first launch takes ~6s. The
// native one comes from @ffprobe-installer/darwin-arm64 (an optional
// dependency npm only installs on Apple Silicon).
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

function getFFmpegPath() {
    const ffmpegStatic = require('ffmpeg-static');
    if (!ffmpegStatic || !fs.existsSync(ffmpegStatic)) {
        throw new Error('ffmpeg-static binary not found');
    }
    return ffmpegStatic;
}

function getFFprobePath() {
    const platform = os.platform();
    const arch = os.arch();
    if (platform === 'darwin' && arch === 'arm64') {
        try {
            const nativeProbe = path.join(
                path.dirname(require.resolve('@ffprobe-installer/darwin-arm64/package.json')),
                'ffprobe'
            );
            if (fs.existsSync(nativeProbe)) {
                return nativeProbe;
            }
        } catch (e) {
            console.warn('native arm64 ffprobe not installed, falling back to ffprobe-static');
        }
    }

    const ffprobeStatic = require('ffprobe-static');

    let probeArch;
    if (platform === 'darwin') {
        probeArch = arch === 'arm64' ? 'arm64' : 'x64';
    } else {
        probeArch = arch === 'x64' ? 'x64' : 'ia32';
    }
    const probePath = path.join(
        path.dirname(require.resolve('ffprobe-static/package.json')),
        'bin', platform, probeArch,
        platform === 'win32' ? 'ffprobe.exe' : 'ffprobe'
    );
    if (fs.existsSync(probePath)) {
        return probePath;
    }

    // Fallback to the .path property
    if (ffprobeStatic.path && fs.existsSync(ffprobeStatic.path)) {
        console.warn('Using fallback ffprobe path:', ffprobeStatic.path);
        return ffprobeStatic.path;
    }

    throw new Error(`FFprobe binary not found for ${platform} ${arch}`);
}

const ffmpegPath = getFFmpegPath();
const ffprobePath = getFFprobePath();

// Make sure binaries are executable on Unix systems
if (os.platform() !== 'win32') {
    try {
        fs.chmodSync(ffmpegPath, '755');
        fs.chmodSync(ffprobePath, '755');
    } catch (e) {
        console.warn('Could not set executable permissions:', e.message);
    }
}

console.log('FFmpeg path:', ffmpegPath);
console.log('FFprobe path:', ffprobePath);

// Run each binary once at launch so the first real preview doesn't pay the
// OS's first-exec cost (~0.4s each). Fire-and-forget; failures are harmless.
[ffmpegPath, ffprobePath].forEach(function(bin) {
    try {
        spawn(bin, ['-version'], { stdio: 'ignore' }).on('error', function() {});
    } catch (e) {}
});

module.exports = { ffmpegPath, ffprobePath };
