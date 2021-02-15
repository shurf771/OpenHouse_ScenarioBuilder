#!/bin/sh

cd src
npm run build.mac
cd ..
cd ..
sips -s format icns _log_reader/src/img/icon.png --out dist/oh_scenario_helper/osx64/oh_scenario_helper.app/Contents/Resources/app.icns
sips -s format icns _log_reader/src/img/icon.png --out dist/oh_scenario_helper/osx64/oh_scenario_helper.app/Contents/Resources/document.icns