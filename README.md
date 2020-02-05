# ClipDeidentifier
The purpose of ClipDeidentifier is to take a ultrasound media in a traditional format (mp4, mov, avi, jpg, bmp, png...) and output a clip (mp4) or still (png) void of Protected Health Information (PHI). ClipDeidentifier is built as an [Electron app](https://electronjs.org/) written as a frontend for [ffmpeg](https://www.ffmpeg.org/). In short, ClipDeidentifier crops the portion of the images containing the hard-coded PHI, and also strips metadata from the media, rendering it generally safe to distribute without exposing the patients' PHI.

## Install (v0.0.0.6)
Download and install for your OS:
- [MacOS](https://d25ixnv6uinqzi.cloudfront.net/Anonymizer/CD.installer.0.0.0.6.dmg) (dmg, 94.9 MB)
- [Windows](https://d25ixnv6uinqzi.cloudfront.net/Anonymizer/CD.installer.0.0.0.6.exe) (exe, 79.2 MB)


## Disclaimer
This application provides no guarantee that all Protected Health Information (PHI) has been removed from its resultant images. It is the responsibility of the user to verify that all PHI has been removed from the ultrasound media, including but not limited to 1) hard coding of PHI into the images and 2) any PHI that has been placed in the images' metadata. For full liability and license information [go here](https://github.com/uotw/ClipDeidentifier/blob/master/LICENSE.md).

## Development Environment
- you must first [install Node 12](https://nodejs.org/en/download/)
- `git clone https://github.com/uotw/ClipDeidentifier.git`
- `cd ClipDeidentifier`
- `npm install`
- `npm start`

To build for Windows and MacOS:
- `npm run-script build-win`
- `npm run-script build-mac`
