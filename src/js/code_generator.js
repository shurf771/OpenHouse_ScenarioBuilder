class CodeGenerator
{
    static fs = require('fs');
    static path = require('path');

    static _baseDir = null;
   


    // -----------------------------------------------------------------
    // Удалить из map_objects_visuals_dayXX.json.new визуалы, 
    // которые дублируют имена в map_objects_animation_visuals_dayXX.json
    // -----------------------------------------------------------------

    static deleteVisualsNewThatHaveAnimations() 
    {
        const fs = Loader.fs;
        const path = Loader.path;

        let dayNum = Number.parseInt($("#txtDeleteAnimationsFromVisualNew").val().trim());
        if (!dayNum) {
            CodeGenerator.questConfigLog("Не указан номер дня!", "err");
            return;
        }
        
        CodeGenerator._curDay = dayNum;
        UI.saveLocalStorageText( ["txtDeleteAnimationsFromVisualNew"] );
        

        DataReader.checkPath(function(basedir) {
            if (!basedir) {
                alert("Ошибка. Сначала надо указать путь к папке data клиентского репозитория");
                return;
            }
            CodeGenerator._baseDir = basedir;
            try {
                UI.enableButtons(null, ".workButton", false); // disable all buttons
                CodeGenerator._deleteVisualsNewThatHaveAnimations(
                    dayNum,
                    function(callbackData) {
                        console.log( "_deleteVisualsNewThatHaveAnimations result: ", callbackData );
                        UI.enableButtons(null, ".workButton", true); // enable all buttons
                    }
                );
            }
            catch(err) {
                console.error(err);
                UI.enableButtons(null, ".workButton", true); // enable all buttons
            }
        });
    }

    static _deleteVisualsNewThatHaveAnimations(dayNum, callback) 
    {
        const path = Loader.path;
        const baseDir = CodeGenerator._baseDir;
        
        // /Users/user/dev/rbx3mclient/data/shared/gamedata/tables/map_objects_animation_visuals_day1.json
        let pathAnims = path.resolve(baseDir, `shared/gamedata/tables/map_objects_animation_visuals_day${dayNum}.json`);

        // /Users/user/dev/rbx3mclient/data/shared/gamedata/tables/map_objects_visuals_day1.json.new
        let pathVisualNew = path.resolve(baseDir, `shared/gamedata/tables/map_objects_visuals_day${dayNum}.json.new`);


        Loader.loadJSON(pathAnims, function(jsonAnims) {
            console.log("JSON read @ " + pathAnims + " : ", jsonAnims);
            Loader.loadJSON(pathVisualNew, function(jsonVisuals) {
                console.log("JSON read @ " + pathVisualNew + " : ", jsonVisuals);
                
                let mapAnimNames = {};
                for (let i=0; i<jsonAnims.length; i++) {
                    mapAnimNames[jsonAnims[i].name] = jsonAnims[i];
                } 

                let newVisuals = [];
                for (let i=0; i<jsonVisuals.length; i++) {
                    let jsonVisual = jsonVisuals[i];
                    if (mapAnimNames[jsonVisual.name]) {
                        console.log("REMOVE " + jsonVisual.name + " from list");
                    }
                    else {
                        newVisuals.push(jsonVisual);
                    }
                }

                console.log("Completed! " + newVisuals.length + " visuals of " + jsonVisuals.length + " remain");
                
                Loader.saveText(
                    pathVisualNew,
                    JSON.stringify(newVisuals, null, 2),
                    function (p) {
                        console.log("Saved to " + pathVisualNew + " [OK]");
                        callback(newVisuals);
                    }
                );
            });
        });
    }


    // -----------------------------------------------------------------
    // Сгенерировать quest_configs.json
    // -----------------------------------------------------------------

    static questConfigGenerate() 
    {
        const fs = Loader.fs;
        const path = Loader.path;

        CodeGenerator.questConfigClear();

        let dayNum = Number.parseInt($("#txtGenerateQuestConfigDayNum").val().trim());
        if (!dayNum) {
            CodeGenerator.questConfigLog("Не указан номер дня!", "err");
            return;
        }
        
        CodeGenerator._curDay = dayNum;
        UI.saveLocalStorageText( ["txtGenerateQuestConfigDayNum"] );
        

        DataReader.checkPath(function(basedir) {
            if (!basedir) {
                alert("Ошибка. Сначала надо указать путь к папке data клиентского репозитория");
                return;
            }
            CodeGenerator._baseDir = basedir;
            try {
                UI.enableButtons(null, ".workButton", false); // diable all buttons
                CodeGenerator._scanAllDaysForActions(
                    [ 
                        {"action": "set_position"},
                        {"action": "set_idle_animation"},
                        {"action": "look"},
                        {"action": "change_world_object_state"},
                        {"action": "start_night"},
                        {"action": "end_night"}
                    ],
                    function(callbackData) {
                        console.log( "_scanAllDaysForActions result: ", callbackData );
                        
                        //CodeGenerator._copyComicsEmotionsPositionsFinish( callbackData["show_comics"] );
                        CodeGenerator._questConfigGenerate( callbackData );

                        UI.enableButtons(null, ".workButton", true); // enable all buttons
                    },
                    dayNum, dayNum
                );
            }
            catch(err) {
                console.error(err);
                UI.enableButtons(null, ".workButton", true); // enable all buttons
            }
        });
    }


    static _questConfigGenerate(callbackData) 
    {
        let arrQuestNums = [];
        let mapQNumToActionsBlocks = {};

        for (let ni=0; ni<callbackData.by_quest_id.keys.length; ni++)
        {
            let qkey = callbackData.by_quest_id.keys[ni];
            let questGroups = callbackData.by_quest_id.map[qkey];

            let arrQnums = [...qkey.matchAll(/\d+/g)];
            if (arrQnums.length < 1) {
                CodeGenerator.questConfigLog("Поломанный ключ квеста " + qkey, "err");
                continue;
            }

            for (let qi=0; qi<arrQnums.length; qi++) 
            {
                let qnum = arrQnums[qi][0];
                if (qnum.length <= 2) continue; // exclude stuff like "episode.13.completed" (?)

                if (!mapQNumToActionsBlocks[qnum])
                {
                    arrQuestNums.push(qnum);
                    mapQNumToActionsBlocks[qnum] = {};
                }

                let destActionsBlocks = mapQNumToActionsBlocks[qnum];
                let otherQuestsNums = null;
                for (let qi2=0; qi2<arrQnums.length; qi2++) {
                    if (qi2 != qi) {
                        if (!otherQuestsNums) otherQuestsNums = [];
                        otherQuestsNums.push( arrQnums[qi2][0] );
                    }
                }

                let checkComplete = "0";
                if (otherQuestsNums && otherQuestsNums.length > 0)
                    checkComplete = otherQuestsNums.join(",");

                for (let actionName in questGroups) 
                {
                    let actions = questGroups[actionName];

                    for (let ai=0; ai<actions.length; ai++)
                    {
                        let action = actions[ai];
                        let actionPrimeKey = null;
                    
                        if (actionName == "change_world_object_state") {
                            actionPrimeKey = action.world_object;
                        }                    
                        else if (actionName == "look") {
                            actionPrimeKey = action.personage;
                        }                    
                        else if (actionName == "set_idle_animation") {
                            actionPrimeKey = action.personage;
                        }                    
                        else if (actionName == "set_position") {
                            actionPrimeKey = action.personage;
                        }
                        else {
                            actionPrimeKey = actionName;
                        }
    
                        if (!destActionsBlocks[actionName]) destActionsBlocks[actionName] = {};
                        if (!destActionsBlocks[actionName][checkComplete]) destActionsBlocks[actionName][checkComplete] = {};

                        destActionsBlocks[actionName][checkComplete][actionPrimeKey] = action;
                    }
                }
            }
        }

        console.log(arrQuestNums);
        console.log(mapQNumToActionsBlocks);

        // --- finally! build the json ---

        let arrPartsQuests = [];

        for (let i=0; i<arrQuestNums.length; i++)
        {
            let qid = arrQuestNums[i];
            let qblock = mapQNumToActionsBlocks[qid];
            let arrTmpBlocks = [];

            for (let actionName in qblock)
            {
                let qActionsBlock = qblock[actionName];
                let arrTmpQActions = [];

                for (let checkComplete in qActionsBlock) 
                {
                    for (let primaryKey in qActionsBlock[checkComplete]) 
                    {
                        let action = qActionsBlock[checkComplete][primaryKey];
                        let objQAction = null;

                        if ("change_world_object_state" == actionName) 
                        {
                            objQAction = {
                                "type": "change_world_object_state",
                                "world_object": action.world_object,
                                "state": action.state
                            };
                            if (checkComplete != "0") objQAction["check_complete"] = checkComplete;
                        }

                        if ("start_night" == actionName) 
                        {
                            objQAction = {
                                "type": "start_night"
                            };
                            if (action.preset) objQAction["preset"] = action.preset;
                            if (checkComplete != "0") objQAction["check_complete"] = checkComplete;
                        }

                        if ("end_night" == actionName) 
                        {
                            objQAction = {
                                "type": "end_night"
                            };
                            if (checkComplete != "0") objQAction["check_complete"] = checkComplete;
                        }

                        if (objQAction) {
                            let str = JSON.stringify(objQAction).replace("{", "{ ").replace("}", " }").replace(/,/g, ", ").replace(/:/g, ": ");
                            arrTmpQActions.push( "        " + str );
                        }
                    }
                }

                if (arrTmpQActions.length > 0) {
                    arrTmpBlocks.push( arrTmpQActions.join(",\n") );
                }
            }

            if (arrTmpBlocks.length > 0)
            {
                let strq = `
{
    "quest_id": ${qid},
    "scenario_name": "quest.${qid}",
    "actions": [
`;
                strq += arrTmpBlocks.join(",\n\n");
                strq += `
    ]
}`;
                arrPartsQuests.push( strq );
            }
        }

        let str = arrPartsQuests.join(",\n\n");
        CodeGenerator.questConfigLog(str);

        let domLog = $("#questConfigGenerateResult");
        hljs.highlightBlock(domLog[0]);
    }


    static questConfigClear() 
    {
        $("#questConfigGenerateResult").empty();
    }

    static questConfigCopy() 
    {
        let s = $("#questConfigGenerateResult").text();
        let clipboard = nw.Clipboard.get();
        clipboard.set(s, 'text');
    }


    static questConfigLog(message, level)
    {
        let domLog = $("#questConfigGenerateResult");

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




    // -----------------------------------------------------------------
    // Сгенерировать словарь icons_default_positions для data/scripts/cut_scene/icons_settings.lua
    // и скопировать в буфер
    // -----------------------------------------------------------------

    static copyComicsEmotionsPositions() 
    {
        const fs = Loader.fs;
        const path = Loader.path;
        

        DataReader.checkPath(function(basedir) {
            if (!basedir) {
                alert("Ошибка. Сначала надо указать путь к папке data клиентского репозитория");
                return;
            }
            CodeGenerator._baseDir = basedir;
            try {
                UI.enableButtons(null, ".workButton", false); // diable all buttons
                CodeGenerator._scanAllDaysForActions(
                    [ {"action": "show_comics"} ],
                    function(callbackData) {
                        console.log( "_scanAllDaysForActions result: ", callbackData );
                        CodeGenerator._copyComicsEmotionsPositionsFinish( callbackData["show_comics"] );
                        UI.enableButtons(null, ".workButton", true); // enable all buttons
                    }
                );
            }
            catch(err) {
                console.error(err);
                UI.enableButtons(null, ".workButton", true); // enable all buttons
            }
        });
    }


    static _copyComicsEmotionsPositionsFinish(arrShowComicsActions) 
    {
        let mapResults = {};
        let arrResults = [];
        

        for (let i=0; i<arrShowComicsActions.length; i++)
        {
            let action = arrShowComicsActions[i];
            if (action.personages) {
                for (let p=0; p<action.personages.length; p++) {
                    let personage = action.personages[p];
                    if (personage.icons && personage.icons.length > 1) {
                        for (let j=1; j<personage.icons.length; j++) {
                            let icon = personage.icons[j];
                            if (!mapResults[icon.icon] && ("x" in icon) && ("y" in icon)) {
                                let newItem = {
                                    "icon": icon.icon,
                                    "x": icon.x,
                                    "y": icon.y
                                };
                                mapResults[icon.icon] = newItem;
                                arrResults.push(newItem);
                            }
                        }
                    }
                }
            }
        }

        console.log(arrResults, mapResults);

        arrResults.sort((a,b) => {
            if (a.icon > b.icon) return 1;
            if (a.icon < b.icon) return -1;
            return 0;
        });

        let tmp = [];
        for (let i=0; i<arrResults.length; i++) {
            let item = arrResults[i];
            tmp.push(`	["${item.icon}"] = { x = ${item.x}, y = ${item.y} }`);
        }

        let result = 
            "local icons_default_positions =\n" + 
            "{\n" + 
            tmp.join(",\n") + "\n" +
            "}";

        let clipboard = nw.Clipboard.get();
        clipboard.set(result, 'text');
    }





    // -----------------------------------------------------------------
    //   common
    // -----------------------------------------------------------------

    static _scanAllDaysForActions(actionFilters, callback, dayFrom, dayTo) 
    {
        if (!dayFrom) dayFrom = 0;
        if (!dayTo)   dayTo = 9999;

        let options = { "dontModifyPathVar": true };
        let day = dayFrom-1;
        
        let callbackData = {}; // { "action name" => [ array_of_actions ] }
        callbackData["by_quest_id"] = {
            "keys": [], // array of quests names
            "map": {} // map: { "quest.1234" => { "action name" => [ array_of_actions ] } }
        };

        function __loadNextDay() {
            let json = null;
            day = day + 1;
            if (day > dayTo) {
                callback( callbackData );
                return;
            }

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
                callback( callbackData );
            }
        }

        function __parseDay( json ) {
            // console.log( json );
            CodeGenerator._getActionsFromDay( json, actionFilters, callbackData );
            __loadNextDay();
        }

        __loadNextDay();
    }


    static _getActionsFromDay(arrActions, actionFilters, dataDest, mapOfCurQuest) 
    {
        for (let i=0; i<arrActions.length; i++) 
        {
            let objAction = arrActions[i];

            let destKey = null;

            for (let a=0; a<actionFilters.length; a++) {
                let filter = actionFilters[a];
                if (objAction["action"] == filter["action"]) {
                    destKey = objAction["action"];
                    break;
                }
            }

            if (destKey) 
            {
                if (!dataDest[destKey])
                    dataDest[destKey] = [];
                dataDest[destKey].push(objAction);

                if (mapOfCurQuest) {
                    if (!mapOfCurQuest[destKey])
                        mapOfCurQuest[destKey] = [];
                    mapOfCurQuest[destKey].push(objAction);
                }
            }

            if (objAction["actions"] && Array.isArray(objAction["actions"])) 
            {
                let nextQuestMapDest = mapOfCurQuest;
                if ( objAction["name"] && (objAction["type"] == "quest" || objAction["type"] == "quest_idle" || objAction["type"] == "quest_group_complete") ) {
                    let qname = objAction["name"];
                    nextQuestMapDest = dataDest["by_quest_id"]["map"][qname];
                    if (!nextQuestMapDest) {
                        nextQuestMapDest = {};
                        dataDest["by_quest_id"]["keys"].push( qname );
                        dataDest["by_quest_id"]["map"][qname] = nextQuestMapDest;
                    }
                }
                CodeGenerator._getActionsFromDay( objAction["actions"], actionFilters, dataDest, nextQuestMapDest );
            }
        }
    }



}