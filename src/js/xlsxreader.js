class XLSXReader
{
    static getDays(state) 
    {
        const READ_FROM_LINE = 3; // с какой строки парсить (начиная с нуля)
        const ROW_HEADER     = 1;

        if (!state.jsons) state.jsons = {};
        if (!state.jsons.jsonEpisodes) {
            state.jsons.jsonEpisodes = XLSX.utils.sheet_to_json( state.m3quests.Sheets.episodes, {"header": 1} );
        }
        let jsonEpisodes = state.jsons.jsonEpisodes

        // console.log("episodes = ", jsonEpisodes);

        let days = [];

        const headerRow = jsonEpisodes[ROW_HEADER];

        for (let index = READ_FROM_LINE; index < jsonEpisodes.length; index++) {
            const row = jsonEpisodes[index];
            
            // row AND 1st column of row are not empty!
            if (row.length > 0 && row[0])
            {
                const rowObj = XLSXReader.rowToDictionary(row, headerRow);
                days.push( rowObj );
            }
        }

        return days;
    }

    
    static getQuestsByDay(state, episode_id) 
    {
        const READ_FROM_LINE = 3; // с какой строки парсить (начиная с нуля)
        const ROW_HEADER     = 1;
        const COL_EPISODE_ID = 3;

        if (!state.jsons) state.jsons = {};
        if (!state.jsons.jsonQuests) {
            state.jsons.jsonQuests = XLSX.utils.sheet_to_json( state.m3quests.Sheets.quests, {"header": 1} );
        }
        if (!state.jsons.jsonEpisodes) {
            state.jsons.jsonEpisodes = XLSX.utils.sheet_to_json( state.m3quests.Sheets.episodes, {"header": 1} );
        }
        let jsonEpisodes = state.jsons.jsonEpisodes;
        let jsonQuests = state.jsons.jsonQuests;
        let worldNumber = episode_id;

        state.curWorldTitle = state.curDayTitle;

        // designshow style - 1 world contains may episodes, need to pick corrent localization sheet
        if (jsonEpisodes) {
            for (let j=0; j<jsonEpisodes.length; j++) {
                let jsonEpisodesRow = jsonEpisodes[j];
                if (jsonEpisodesRow[0] == state.curDayTitle && jsonEpisodesRow[8]) {
                    worldNumber = parseInt(jsonEpisodesRow[8]);
                    if (isNaN(worldNumber)) {
                        worldNumber = episode_id;
                    }
                    state.curWorldTitle = state.curWorldTitle.replace(/\d+/, worldNumber);
                    break;
                }
            }
        }

        // console.log("episodes = ", jsonQuests);

        // 1. get all quests from m3:quests / quests

        let quests = [];
        let questsMap = {};

        const questsColumnsInclude = {
            "title": true,
            "episode_id": true,
            "id": true,
            "parent_ids": true
        };

        let headerRow = jsonQuests[ROW_HEADER];
        headerRow[0] = "title";

        for (let index = READ_FROM_LINE; index < jsonQuests.length; index++) {
            const row = jsonQuests[index];

            // row AND 1st column of row are not empty, day columns == episode_id!
            if (row.length > 0 && row[0] && row[COL_EPISODE_ID] == episode_id)
            {
                const rowObj = XLSXReader.rowToDictionary(row, headerRow, questsColumnsInclude);
                rowObj.parent_ids = String(rowObj.parent_ids).replace(/;/g, ".");
                rowObj.id         = String(rowObj.id);

                if (rowObj.parent_ids.indexOf(".") >= 0) 
                {
                    if (!questsMap[rowObj.parent_ids]) 
                    {
                        // create "scene after" aka quest_group_complete
                        // and add it into quests[] and questsMap{}
                        let sceneAfterObj = { 
                            "id" : rowObj.parent_ids, 
                            "episode_id": episode_id, 
                            "is_quest_group_complete": true 
                        };
                        quests.push( sceneAfterObj );
                        questsMap[sceneAfterObj.id] = sceneAfterObj;

                        // set coParents
                        let tmpParents = rowObj.parent_ids.split(".");
                        if (tmpParents.length > 1) {
                            tmpParents.forEach(tmpParentId => {
                                if (questsMap[tmpParentId]) {
                                    questsMap[tmpParentId].coParents = tmpParents;
                                }
                            });
                        }
                    }
                }

                quests.push( rowObj );
                questsMap[rowObj.id] = rowObj;
            }
        }

        // 2. get talknigs for each quest from m3:localization / dayXX

        if (!state.jsons) state.jsons = {};
        if (!state.jsons.jsonLocalization) {
            let sheet = state.m3localization.Sheets[state.curDayTitle];
            if (!sheet && state.curDayTitle == "initial") {
                sheet = state.m3localization.Sheets["D1"];
            }
            if (!sheet) {
                let alternativeName = "D" + worldNumber;
                sheet = state.m3localization.Sheets[alternativeName];
                if (!sheet) {
                    UI.alertError(`can't find sheet '${state.curDayTitle}' (or even '${alternativeName}') in m3:localization`);
                    return;
                }
            }
            state.jsons.jsonLocalization = XLSX.utils.sheet_to_json( sheet, {"header": 1} );
        }
        let jsonLocalization = state.jsons.jsonLocalization

        headerRow = jsonLocalization[ROW_HEADER];
        const localizationColumnsInclude = {
            "location": true,
            "Description": true,
            "Comment": true,
            "id": true,
            "ru": true
        };

        let currentQuest = null;
        let beganEpisode = false;

        for (let index = READ_FROM_LINE; index < jsonLocalization.length; index++) {
            const row = jsonLocalization[index];

            // check if it is the end of current episode OR start target episode
            const pattNewEpisode = /\s*start\.episode\.(\d+)\.name\s*/;
            if (row[4] && pattNewEpisode.test(row[4])) {
                let newEpisode = parseInt(row[4].match(pattNewEpisode)[1]);
                if (newEpisode == episode_id) {
                    // only now we begin to parse localization!
                    beganEpisode = true;
                }
                else if (newEpisode > episode_id) {
                    // new episode began in localization sheet -> don't parse further
                    break;
                }
            }
            if (!beganEpisode) {
                continue;
            }

            // check if 1st column empty (error)
            if (row.length > 0 && !row[0] && row[4] && row[5]) {
                UI.alertError(`Колонка location пустая! Строка ${index+1}, id = ${row[4]}`);
            }

            // row AND 1st column of row are not empty, day location == currentDay
            if (row.length > 0 && (row[0] == state.curDayTitle || row[0] == state.curWorldTitle || row[0] == "initial" || (row[0] && row[0].replace("day","D") == state.curDayTitle)))
            {
                // AND other important (2,4,5) columns are not all empty
                if (row[2] || row[4] || row[5]) 
                {
                    const rowObj = XLSXReader.rowToDictionary(row, headerRow, localizationColumnsInclude);
                    rowObj.id    = String(rowObj.id);
                    
                    // next quest
                    let questNamePattern = /(quest|fade|start\.episode)\.([\d\.]+).name/;
                    if (questNamePattern.test(rowObj.id))
                    {
                        let match = rowObj.id.match(questNamePattern);
                        if (match) {
                            let qid = match[2];
                            if (match[1] == "start.episode") {
                                // start episode block
                                currentQuest = questsMap["start.episode"];
                                if (!currentQuest) {
                                    currentQuest = {
                                        id: `start.episode.${qid}`,
                                        episode_id: parseInt(qid),
                                        isStartEpisode: true
                                    };
                                    questsMap["start.episode"] = currentQuest;
                                    quests.unshift(currentQuest);
                                }
                            }
                            else if (questsMap[qid]) {
                                currentQuest = questsMap[qid];
                                if (!currentQuest.title) 
                                    currentQuest.title = rowObj.ru;
                                else if (currentQuest.title != rowObj.ru)
                                    currentQuest.title = rowObj.ru + " ("+currentQuest.title+")";
                            }
                            else {
                                UI.alertError(`unexpected error! can't find quest ${qid}, mentioned in localization ${rowObj.id}`);
                            }
                        }
                        else {
                            UI.alertError(`unexpected error! can't parse id ${rowObj.id} in localization`);
                        }
                    }
                    else if (currentQuest) 
                    {
                        if (!currentQuest.rawLocalizationRows) {
                            currentQuest.rawLocalizationRows = [];
                        }
                        currentQuest.rawLocalizationRows.push(rowObj);
                    }
                }
            }
            else {
                if (row.length > 0 && row[0]) {
                    UI.alertError("Invalid(?) location in m3:localization, line " + (index+1) + ", expected " + state.curDayTitle + ", got " + row[0]);
                }
            }
        }

        return quests;
    }



    // array to dictionary (keys are taken from headerRow)
    static rowToDictionary(row, headerRow, includeFields)
    {
        let obj = {};
        let i=0, n=headerRow.length;
        for (; i<n; i++) {
            let key = headerRow[i] || (""+i);
            if (!includeFields || includeFields[key]) 
            {
                obj[key] = row[i];
            }
        }
        return obj;
    }



    // ------------------------------------------------------------------------------
    //     Localization Reuse
    // ------------------------------------------------------------------------------


    static reuseLocalizationStart()
    {
        let strTarget = $("#localReuseSheetTarget").val();
        let strSource = $("#localReuseSheetSource").val();
        let iId = parseInt($("#txtLocalReuseColumnID").val().trim());
        let iRu = parseInt($("#txtLocalReuseColumnRu").val().trim());
        let iLangsArr = [...$("#txtLocalReuseColumnOthers").val().trim().match(/\d+/g)||[]];
        iLangsArr = iLangsArr.map(s => parseInt(s));
    
        let colMin = iRu;
        let colMax = iRu;
        let mapColumnImportant = { [iRu] : true };
        for (let i=0; i<iLangsArr.length; i++) {
            const eachLangId = iLangsArr[i];
            colMin = Math.min(colMin, eachLangId);
            colMax = Math.max(colMax, eachLangId);
            mapColumnImportant[eachLangId] = true;
        }
    
        console.log("find localization reuse parameters: ", strTarget, strSource, iId, iRu, iLangsArr);
    
        let sheetTarget = state.m3localization.Sheets[strTarget];
        let sheetSource = state.m3localization.Sheets[strSource];
    
        if (!sheetTarget || !sheetSource) {
            console.error("Must select source and dest sheets!");
            return;
        }
    
        let jsonTarget = XLSX.utils.sheet_to_json( sheetTarget, {"header": 1} ); // https://docs.sheetjs.com/docs/api/utilities/
        let jsonSource = XLSX.utils.sheet_to_json( sheetSource, {"header": 1} ); // !!!!!!!!!!!!
    
        let mapSourceByRu = {};
        for (let i=0; i<jsonSource.length; i++) {
            const row = jsonSource[i];
            const ru = row[iRu];
            if (ru && ru.length > 0) {
                mapSourceByRu[ ru.trim() ] = row;
            }
        }
        console.log(jsonSource);
        console.log(mapSourceByRu);
    
        let resultLines = [];
    
        let idFirstFrom = null;
        let idFirstTo = null;
        let blockLines = [];

        state.reuseLocBlocks = [];

        let domTable = $("#localReuseResultsTable").empty();
    
        for (let i=0; i<jsonTarget.length; i++) {
            const row = jsonTarget[i];
            let ru = row[iRu];
            let badLine = true;

            if (ru && ru.length > 0) {
                ru = ru.trim();
                const rowSource = mapSourceByRu[ru];
                if (rowSource) {
                    let isEqual = true;
                    for (let iLang of iLangsArr) {
                        if (rowSource[iLang] != row[iLang]) {
                            isEqual = false;
                            break;
                        }
                    }
                    if (!isEqual) {
                        let resLine = [];
                        for (let c=colMin; c<=colMax; c++) {
                            resLine.push( mapColumnImportant[c] ? rowSource[c]  : "" );
                        }
                        blockLines.push( resLine.join("\t") );
                        if (!idFirstTo) {
                            idFirstTo = row[iId];
                            idFirstFrom = rowSource[iId];
                        }
                        badLine = false;
                    }
                }
            }

            if (blockLines.length > 0 && (badLine || i == jsonTarget.length-1))
            {
                let nLines = blockLines.length;
                let iBlock = state.reuseLocBlocks.length;
                state.reuseLocBlocks.push( blockLines.join("\n") );

                let domH2 = $("<h2>").text(`${idFirstFrom} → ${idFirstTo} `);
                if (nLines > 1) {
                    domH2.append( $("<b>").text("  +" + (nLines-1)) );
                }
                let domColRight = $("<div>").addClass("col-10");
                for (let c=0; c<blockLines.length; c++) {
                    $("<p>").text(blockLines[c].replaceAll("\t", "●")).appendTo(domColRight);
                }
                let domDivRow = $("<div>").addClass("row").append([
                    $("<div>").addClass("col-2").append(
                        $("<button>")
                            .addClass("bg-green btn s")
                            .attr("shu-reuse-block-i", iBlock)
                            .text(nLines > 1 ? (`copy ${nLines}`) : "copy")
                            .on("click", XLSXReader.onReuseLocButtonBlock_clicked )
                    ),
                    domColRight
                ]);
                domTable.append([ domH2, domDivRow ]);

                resultLines.push(idFirstTo + (nLines > 1 ? ("  +" + (nLines-1)) : ""));
                blockLines.push("\n");
                blockLines.push("\n");
                resultLines = resultLines.concat(blockLines);

                blockLines = [];
                idFirstTo = null;
                idFirstFrom = null;
            }
        }
    
        $("#txtLocalReuseResult").val( resultLines.join("\n") );
        $("#localReuseResultDiv").show();
    }


    static onReuseLocButtonBlock_clicked(e) {
        let btn = $(e.currentTarget);
        let i = btn.attr("shu-reuse-block-i");
        let s = state.reuseLocBlocks[i];
        let clipboard = nw.Clipboard.get();
        clipboard.set(s, 'text');
        btn.removeClass("bg-green");
        setTimeout(() => { btn.addClass("bg-green"); }, 125);
    }

}