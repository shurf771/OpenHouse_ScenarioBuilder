class Emotions
{
    static fs = require('fs');
    static path = require('path');

    static _baseDir = null;
    static _baseDirTool = null;
    
    static _curDay = 0;
    static _prevDayId = 0;
    static _prevDayTitle = "";


    // -----------------------------------------------------------------
    // обновляет scenarios_epXX.json
    // -----------------------------------------------------------------

    static updateDayJson(useCache) 
    {
        Emotions.logClear();

        let dayNum = Number.parseInt($("#txtOpenHouseEmotionsDayNum").val().trim());
        if (!dayNum) {
            Emotions.log("Не указан номер дня!", "err");
            return;
        }
        
        Emotions._prevDayId    = state.curDayId;
        Emotions._prevDayTitle = state.curDayTitle;
        state.curDayId    = dayNum;
        state.curDayTitle = "day" + dayNum;
        
        Emotions._curDay = dayNum;
        UI.saveLocalStorageText( ["txtOpenHouseEmotionsDayNum"] );

        if (useCache || !state.m3localization) {
            Emotions._reloadSpeadsheets(useCache);
        } else {
            Emotions._onSpreadsheetsReady();
        }
    }


    static _reloadSpeadsheets(useCache) 
    {
        Emotions.log("Загружаю гугл-таблицы...");
        state.reloadAllCallback = Emotions._onSpreadsheetsReady;
        step1LoadSpreadsheets(useCache);
    }


    static _onSpreadsheetsReady() 
    {
        let sheet = state.m3localization.Sheets["day" + Emotions._curDay];
        let quests = XLSXReader.getQuestsByDay(state, Emotions._curDay);

        if (sheet && quests) {
            Emotions.log("Лист найден");
        } else {
            Emotions.log("Лист 'day" + Emotions._curDay + "' не найден", "err");
            Emotions._updateDayJsonFinish();
            return;
        }

        DataReader.readDayScenarioText(Emotions._curDay, function(text) {
            if (!text) {
                Emotions.log("JSON файл " + Emotions._curDay + " дня не найден", "err");
                Emotions._updateDayJsonFinish();
                return;
            }
            Emotions.log("JSON файл " + Emotions._curDay + " дня скачан");
            Emotions._updateDayJsonStart(quests, text);
        });
    }


    static _updateDayJsonStart(quests, fileText) {
        //console.log(quests);
        //console.log(fileText);

        let mapTextIdToEmotion = {};

        // --- get all emotions from google-doc ---
        for (let q=0; q<quests.length; q++) {
            let quest = quests[q];
            let rawLocalizationRows = quest.rawLocalizationRows;
            for (let r=0; r<rawLocalizationRows.length; r++) 
            {
                let row = rawLocalizationRows[r];
                if (row.Description && row.Comment && row.id) {
                    let id = String(row.id).trim();
                    mapTextIdToEmotion[id] = {
                        "id"      : id,
                        "pers"    : String(row.Comment).trim().toLowerCase(),
                        "emotion" : String(row.Description).trim()
                    };
                }
            }
        }

        console.log(mapTextIdToEmotion);

        // --- read scenarios_epXX.json line by line ---
        let lines  = fileText.split("\n");
        
        let patternTextId     = /"text_id":\s*"([^"]+)"/;    // "text_id": "(quest.1201.text.1)"
        let patternShowComics = /"action":\s*"show_comics"/; // "action": "show_comics"
        let patternName       = /"name":\s*"([^"]+)"/;       // "name":"(main)"
        let patternSpeaker    = /"speaker":\s*true/;         // "speaker":true
        let patternIcon       = /("icon":\s*")([^"]+)(")/g;  // "icon":"(Emotions_Jimmy/Emotions_Jimmy_Irony)"
        
        let currentTextId = null;
        let isReplaced = false;
        let speakerActive = false;

        for (let i=0; i<lines.length; i++)
        {
            let line = lines[i];

            if (patternTextId.test(line)) // "text_id": "(quest.1201.text.1)"
            {
                let isOk = true;
                let text_id = line.match(patternTextId)[1];
                if (!text_id) {
                    Emotions.log(`Строка ${i+1}: пустой text_id`, "warn");
                    isOk = false;
                }
                if (!mapTextIdToEmotion[text_id]) {
                    isOk = false; // не указана эмоция в гуглдоке
                }
                if (!patternShowComics.test(line)) {
                    if (isOk) {
                        // в гугл-доке указана эмоция НЕ для комикса
                        Emotions.log(`Строка ${i+1}: для реплики "${text_id}" указана эмоция "${mapTextIdToEmotion[text_id].emotion}", но это не комикс`, "warn");
                    }
                    isOk = false; // не show_comics
                }

                if (isOk) {
                    if (currentTextId && !isReplaced) {
                        Emotions.log(`Эмоция для реплики "${currentTextId}" так и не была найдена`, "warn");
                    }
                    currentTextId = text_id;
                }
                else {
                    currentTextId = null;
                }
                isReplaced = false;
                speakerActive = false;
            }

            if (currentTextId && patternName.test(line) && patternSpeaker.test(line)) // "name":"(main)" // "speaker":true
            {
                speakerActive = true;

                let speaker_name = line.match(patternName)[1];
                if (nameAlias(mapTextIdToEmotion[currentTextId].pers) != speaker_name) {
                    Emotions.log(`Строка ${i+1}: для реплики "${currentTextId}" активный персонаж "${speaker_name}", но в доке указан "${mapTextIdToEmotion[currentTextId].pers}"`, "warn");
                }
            }

            if (speakerActive && isReplaced && ( /"action"/.test(line) || /"speaker"/.test(line) ))
            {
                speakerActive = false; // конец блока << "speaker":true, "icons":[ ... ] >>
            }

            if (currentTextId && speakerActive && patternIcon.test(line)) // "icon":"(Emotions_Jimmy/Emotions_Jimmy_Irony)"
            {
                patternIcon.lastIndex = 0;
                isReplaced = true;

                let wasModified = false;
                let curItem = mapTextIdToEmotion[currentTextId];
                let matches = [...line.matchAll(patternIcon)];
                matches.forEach(match => {
                    let fullIcon = match[2]; // Emotions_MainChar/Emotions_MineChar_Default
                    let tmpParts = fullIcon.split("/");
                    let lastPart = tmpParts[tmpParts.length-1];
                    if (curItem.emotion != lastPart)
                    {
                        wasModified = true;
                        Emotions.log(`Строка ${i+1}: для реплики "${currentTextId}" заменяем эмоцию "${lastPart}" на "${curItem.emotion}"`, "ok");
                        
                        tmpParts[tmpParts.length-1] = curItem.emotion;
                        fullIcon = tmpParts.join("/");
                        line = line.replace( match[0], match[1] + fullIcon + match[3] );
                    }
                });

                if (wasModified) {
                    lines[i] = line;
                }
            }
        }

        let text = lines.join("\n");
        let savepath = "";
        savepath = DataReader.saveDayScenarioText(Emotions._curDay, text, function(success) {
            if (!success) {
                Emotions.log("JSON файл " + Emotions._curDay + " дня не был сохранен в " + savepath, "err");
                Emotions._updateDayJsonFinish();
                return;
            }
            Emotions.log("JSON файл " + Emotions._curDay + " дня сохранен в " + savepath, 'ok');
            // finish!
            Emotions._updateDayJsonFinish();
        });
    }


    static _updateDayJsonFinish() {
        state.curDayId    = Emotions._prevDayId;
        state.curDayTitle = Emotions._prevDayTitle;
    }


    // -----------------------------------------------------------------
    // обновляет http://shurf771.com/work/js/OpenHouseEmotions/index.htm
    // -----------------------------------------------------------------

    static updateOpenHouseEmotionsTool() 
    {
        const fs = Loader.fs;
        const path = Loader.path;
        
        const baseDirTool = $("#txtOpenHouseEmotionsSrcPath").val().trim();

        if (!Loader.getFileExistSync(baseDirTool)) {
            alert("'Путь к исходникам OpenHouseEmotions' указан неверно, нету такой папки");
            return;
        }

        Emotions._baseDirTool = baseDirTool;
        UI.saveLocalStorageText( ["txtOpenHouseEmotionsSrcPath"] );

        DataReader.checkPath(function(basedir) {
            if (!basedir) {
                alert("Ошибка. Сначала надо указать путь к папке data клиентского репозитория");
                return;
            }
            Emotions._baseDir = basedir;
            try {
                let filesData = Emotions._updateOpenHouseEmotionsToolCopyPNGs();
                Emotions._updateOpenHouseEmotionsToolScanDays(function(callbackData) {
                    console.log( "_updateOpenHouseEmotionsToolScanDays result: ", callbackData );
                    Emotions._updateOpenHouseEmotionsToolGenerateJS( filesData, callbackData );
                });
            }
            catch(err) {
                console.error(err);
            }
        });
    }


    static _updateOpenHouseEmotionsToolGenerateJS(filesData, daysData)
    {
        console.log(filesData, daysData);

        let arrList = filesData.arrList;
        let arrPers = filesData.arrPers;
        let mapPersToList = filesData.mapPersToList;
        
        let mapIconsToChild = daysData.mapIconsToChild;
        let mapIconsToPopularity = daysData.mapIconsToPopularity;
        let personagesOrdered = daysData.personagesOrdered;
        let mapPersonagesOrder = daysData.mapPersonagesOrder;

        arrPers.sort((a,b) => mapPersonagesOrder[a] - mapPersonagesOrder[b]);
        
        let jsFolders = arrPers.concat();
        let jsCfg = {};
        let jsFiles = {};

        for (let p=0; p<jsFolders.length; p++)
        {
            let jsFolder = jsFolders[p];
            let jsCfgFolder = {};
            let jsFilesFolder = [];

            let arrPersIconsItems = mapPersToList[jsFolder];

            // CFG..titlePrefix
            jsCfgFolder["titlePrefix"] = Emotions._getPrefix( arrPersIconsItems );

            // CFG..childIcons
            // FILES.[]
            let hasChildIcons = false;
            let jsChildIcons = {};
            for (let i=0; i < arrPersIconsItems.length; i++) 
            {
                let iconItem = arrPersIconsItems[i];
                jsFilesFolder.push({
                    "name": iconItem.name,
                    "popularity": mapIconsToPopularity[iconItem.icon] || 0
                });
                
                if (mapIconsToChild[iconItem.icon]) {
                    hasChildIcons = true;
                    jsChildIcons[iconItem.name] = mapIconsToChild[iconItem.icon];
                }
            }

            if (hasChildIcons) {
                jsCfgFolder["childIcons"] = jsChildIcons;
            }

            jsCfg[jsFolder] = jsCfgFolder;
            jsFiles[jsFolder] = jsFilesFolder;
        }

        let js = {
            "FOLDERS" : jsFolders,
            "CFG"     : jsCfg,
            "FILES"   : jsFiles
        };
        console.log(js);

        let pathJs = Emotions.path.resolve(Emotions._baseDirTool, "config.js");
        let strJS = "var _CONFIG = " + JSON.stringify(js, null, 4) + ";";

        Loader.saveFile(pathJs, strJS, function() {
            Emotions.log(`Все готово! Осталось только залить на FTP`, "ok");
        });
    }


    static _getPrefix(items) 
    {
        let sum = 0;
        let total = items.length;
        items.forEach((item) => {
            let underscores = getCharOccurrencesCount(item.name, "_");
            sum += underscores;
        });
        let avgunderscores = Math.round(sum / total);
        let firstname = items[0].name;
        let tmpArr = firstname.split("_");
        tmpArr.length = avgunderscores;
        return tmpArr.join("_") + "_";
    }

    static _updateOpenHouseEmotionsToolCopyPNGs() 
    {
        const fs = Loader.fs;
        const path = Loader.path;

        let pathLocations = path.resolve( Emotions._baseDir, 'gamedata/locations' );
        let daysFolders = fs.readdirSync(pathLocations, {"withFileTypes": true});
        //console.log( daysFolders );

        Emotions.logClear();
        Emotions.log(`Сканирую ${pathLocations} в поиске png-шек эмоций`);

        let arrList = [];
        let arrPers = [];
        let mapPersToList = {};
        
        for (let d = 0; d < daysFolders.length; d++) 
        {
            let direntDay = daysFolders[d];
            if (direntDay.name != ".DS_Store" && direntDay.isDirectory()) 
            {
                let persIconsPath = path.resolve( pathLocations, direntDay.name, 'personage_icons' );
                if (Loader.getFileExistSync(persIconsPath)) {
                    let persesFolders = fs.readdirSync(persIconsPath, {"withFileTypes": true});
                    //console.log( persIconsPath, daysFolders );

                    for (let p = 0; p < persesFolders.length; p++) {
                        let direntPers = persesFolders[p];
                        if (direntPers.name != ".DS_Store" && direntPers.isDirectory()) 
                        {
                            let dayPersPath = path.resolve( persIconsPath, direntPers.name );
                            let pngFiles = fs.readdirSync(dayPersPath, {"withFileTypes": true});

                            for (let f = 0; f < pngFiles.length; f++) 
                            {
                                let pngFile = pngFiles[f];
                                if (pngFile.name != ".DS_Store" && !pngFile.isDirectory()) 
                                {
                                    let fileItem = {
                                        "path": path.resolve( dayPersPath, pngFile.name ),
                                        "name": pngFile.name.replace(/\.\w+$/, ""),
                                        "pers": direntPers.name
                                    };
                                    fileItem["icon"] = fileItem.pers + "/" + fileItem.name;
                                    arrList.push( fileItem );

                                    if (!mapPersToList[fileItem.pers]) {
                                        mapPersToList[fileItem.pers] = [];
                                        arrPers.push( fileItem.pers );
                                    }
                                    mapPersToList[fileItem.pers].push( fileItem );
                                }
                            }
                        }
                    }
                }
            }
        }

        Emotions.log(`Найдено ${arrList.length} картинок для ${arrPers.length} персонажей`);
        console.log( arrList );

        for (let persName in mapPersToList) 
        {
            let destPathBase = path.resolve(Emotions._baseDirTool, "img", persName);
            Emotions.log(`Копирую все png ${persName} в ${destPathBase}`);
            
            Loader.checkOrCreatePathFolders( destPathBase, true );

            let arrFilesItems = mapPersToList[persName];
            arrFilesItems.forEach((fileItem) => {
                let destPath = path.resolve( destPathBase, fileItem.name + ".png" );
                fs.copyFileSync(fileItem.path, destPath);
            });

            Emotions.log(`Скопировано ${arrFilesItems.length} картинок`);
        }

        return {
            arrList : arrList,
            arrPers : arrPers,
            mapPersToList : mapPersToList
        };
    }


    static _updateOpenHouseEmotionsToolScanDays(callback) 
    {
        let options = { "dontModifyPathVar": true };
        let day = 0;
        let callbackData = {
            "totalComics": 0,
            "mapIconsToPopularity": {},
            "mapIconsToChild": {},
            "personagesOrdered": [],
            "mapPersonagesOrder": {}
        };

        function __loadNextDay() {
            let json = null;
            day = day + 1;
            try {
                DataReader.readDayScenarioJson(day, function(json_) {
                    json = json_;
                }, 
                options);
            }
            catch (err) {
                console.log("no more days found, " + (day-1) + "was last");
            }

            if (json) {
                __parseDay(json );
            }
            else {
                Emotions.log(`Всего найдено ${callbackData.totalComics} комиксовых фраз`);
                callback( callbackData );
            }
        }

        function __parseDay( json ) {
            // console.log( json );
            Emotions.log(`Сканирую день ${day}...`);
            Emotions._getAllEmotionsPopularity( json, callbackData );
            __loadNextDay();
        }

        __loadNextDay();
    }


    static _getAllEmotionsPopularity(arrActions, dataDest) {
        const mapIconsToPopularity = dataDest["mapIconsToPopularity"];
        const mapIconsToChild = dataDest["mapIconsToChild"];
        const personagesOrdered = dataDest["personagesOrdered"];
        const mapPersonagesOrder = dataDest["mapPersonagesOrder"];

        for (let i=0; i<arrActions.length; i++) 
        {
            let objAction = arrActions[i];
            if (objAction["action"] == "show_comics") {
                dataDest["totalComics"]++;
                for (let p=0; p<objAction["personages"].length; p++) {
                    let persObj = objAction["personages"][p];
                    if (persObj["speaker"]) {
                        let iconVal = null;
                        if (persObj["icon"]) {
                            iconVal = persObj["icon"];
                        } 
                        else if (persObj["icons"]) {
                            // first icon
                            iconVal = persObj["icons"][0]["icon"];
                            if (persObj["icons"][1]) {
                                let icons1 = persObj["icons"][1];
                                mapIconsToChild[iconVal] = {
                                    icon: icons1.icon,
                                    x: icons1.x,
                                    y: icons1.y
                                };
                            }
                        }
                        if (iconVal) {
                            if (iconVal in mapIconsToPopularity) {
                                mapIconsToPopularity[iconVal] = mapIconsToPopularity[iconVal] + 1;
                            } else {
                                mapIconsToPopularity[iconVal] = 1;
                            }
                            
                            let personage = iconVal.substring( 0, iconVal.indexOf("/") );
                            if (!mapPersonagesOrder[personage]) {
                                mapPersonagesOrder[personage] = personagesOrdered.length + 1;
                                personagesOrdered.push( personage );
                            }
                        }
                    }
                }
            }
            if (objAction["actions"] && Array.isArray(objAction["actions"])) {
                Emotions._getAllEmotionsPopularity( objAction["actions"], dataDest );
            }
        }
    }


    static logClear()
    {
        $("#emotionsLog").empty();
    }


    static log(message, level)
    {
        let domLog = $("#emotionsLog");

        let domEntry = $("<span></span>");
        domEntry.text( message + "\n" );
        if (level) {
            domEntry.addClass(level);
        }
        domLog.append( domEntry );
        domLog.scrollTop(domLog.prop("scrollHeight"));

        if (level == "err")  console.error( message );
        if (level == "warn") console.warn( message );
    }

}