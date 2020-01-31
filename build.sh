sudo rm -rf Clip\ Deidentifier-darwin-x64
electron-packager . "Clip Deidentifier" --platform=darwin --arch=x64 --overwrite --ignore=bin/win 
cp icon.icns Clip\ Deidentifier-darwin-x64/Clip\ Deidentifier.app/Contents/Resources/electron.icns
#touch Clip\ Deidentifier-darwin-x64/Clip\ Deidentifier.app/
open  Clip\ Deidentifier-darwin-x64
