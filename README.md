# Clip Deidentifier
The purpose of ClipDeidentifier is to take a ultrasound media in a traditional format (mp4, mov, avi, jpg, bmp, png...) and output a clip (mp4) or still (png) void of Protected Health Information (PHI). ClipDeidentifier is built as an [Electron app](https://electronjs.org/) written as a frontend for [ffmpeg](https://www.ffmpeg.org/). In short, ClipDeidentifier crops the portion of the images containing the hard-coded PHI, and also strips metadata from the media, rendering it generally safe to distribute without exposing the patients' PHI.

## Install (v0.0.0.9)
Download and install for your OS:
- [Mac x64](https://d25ixnv6uinqzi.cloudfront.net/Anonymizer/CD.Installer.v0.9.x64.dmg) (dmg, 141 MB)
- [Mac arm64 (M1/M2)](https://d25ixnv6uinqzi.cloudfront.net/Anonymizer/CD.Installer.v0.9.arm64.dmg) (dmg, 114 MB)

## Install (v0.0.0.7)
Download and install for your OS:
- [Windows 64-bit](https://d25ixnv6uinqzi.cloudfront.net/Anonymizer/CD.installer.0.0.0.7.exe) (exe, 44.2 MB)

## Support Us
We provide this software free of charge for the ultrasound education community. Please consider supporting us by subscribing to one of [our courses](https://courses.coreultrasound.com/). We have [group rates](https://analytics.coreultrasound.com/grouprate/) for institutions with more than 10 users.

## Disclaimer
This application provides no guarantee that all Protected Health Information (PHI) has been removed from its resultant images. It is the responsibility of the user to verify that all PHI has been removed from the ultrasound media, including but not limited to 1) hard coding of PHI into the images and 2) any PHI that has been placed in the images' metadata. For full liability and license information [go here](https://github.com/uotw/ClipDeidentifier/blob/master/LICENSE.md). 

This software uses code of <a href=http://ffmpeg.org>FFmpeg</a> licensed under the <a href=http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html>LGPLv2.1</a> and its source can be downloaded <a href=link_to_your_sources>here</a>.

## Development Environment
- you must first [install Node](https://nodejs.org/en/download/)
- `git clone https://github.com/uotw/ClipDeidentifier.git`
- `cd ClipDeidentifier`
- `npm i --force`
- `npm start`

To build for Windows, MacOS, Linux:
- `npm run dist-win64`
- `npm run dist-win32`
- `npm run dist-macarm`
- `npm run dist-mac64`
- `npm run dist-linux64`

## Change Log
### 0.0.0.9
- fixed initial launch bug

### 0.0.0.8
- upgraded to electron v25 to improve speed and stability
- added native support for Apple Silicon (arm64)
- added code signed builds
- bundling FF apps now
- removed smooth progress bar to improve speed

### 0.0.0.7
- fixed bug where crop preview wasn't working
- added first run FF binaries download from ffbinaries.com
- added sha256 checksum against malware checked files

### 0.0.0.6
- initial open source release
- removed dependence on imagemagick binaries
