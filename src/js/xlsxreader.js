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
        let jsonQuests = state.jsons.jsonQuests

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
                UI.alertError(`can't find sheet '${state.curDayTitle}' in m3:localization`);
                return;
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
        for (let index = READ_FROM_LINE; index < jsonLocalization.length; index++) {
            const row = jsonLocalization[index];

            // check if 1st column empty (error)
            if (row.length > 0 && !row[0] && row[4] && row[5]) {
                UI.alertError(`Колонка location пустая! Строка ${index+1}, id = ${row[4]}`);
            }

            // row AND 1st column of row are not empty, day location == currentDay
            if (row.length > 0 && (row[0] == state.curDayTitle || row[0] == "initial" || (row[0] && row[0].replace("day","D") == state.curDayTitle)))
            {
                // AND other important (2,4,5) columns are not all empty
                if (row[2] || row[4] || row[5]) 
                {
                    const rowObj = XLSXReader.rowToDictionary(row, headerRow, localizationColumnsInclude);
                    rowObj.id    = String(rowObj.id);
                    
                    // next quest
                    let questNamePattern = /(quest|fade)\.([\d\.]+).name/;
                    if (questNamePattern.test(rowObj.id))
                    {
                        let match = rowObj.id.match(questNamePattern);
                        if (match) {
                            let qid = match[2];
                            if (questsMap[qid]) {
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

}