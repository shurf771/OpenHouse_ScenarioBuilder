#!/bin/sh

cd src
npm run build.mac
# cd ..
# sips -s format icns src/img/icon.png --out dist/oh_scenario_generator/osx64/oh_scenario_generator.app/Contents/Resources/app.icns
# sips -s format icns src/img/icon.png --out dist/oh_scenario_generator/osx64/oh_scenario_generator.app/Contents/Resources/document.icns