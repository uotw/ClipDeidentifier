sudo rm -rf Clip\ Deidentifier-darwin-x64
electron-packager . "Clip Deidentifier" --platform=darwin --ignore=bin/win --arch=x64 --icon="/Users/ben/Documents/98765432_Janus_20140127_124547/ClipDeidentifier/icon.icns" --overwrite
cp icon.icns Clip\ Deidentifier-darwin-x64/Clip\ Deidentifier.app/Contents/Resources/electron.icns
open  Clip\ Deidentifier-darwin-x64
