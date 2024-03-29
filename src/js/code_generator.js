class CodeGenerator
{
    static fs = require('fs');
    static path = require('path');

    static _baseDir = null;
    static _isIdle = {};


    // -----------------------------------------------------------------
    // Сгенерировать snippets
    // -----------------------------------------------------------------

    static snippetsGenerate() 
    {
        CodeGenerator._isIdle = {
            'chainsaw_idle': true,
            'CombatPose_cycle': true,
            'computer_work_cycle': true,
            'drums_idle': true,
            'guitar_idle': true,
            'idle_bag_in_hand': true,
            'IDLE_bag': true,
            'idle_bench': true,
            'idle': true,
            'idle02': true,
            'idle03': true,
            'jump_idle': true,
            'listen': true,
            'lotus_idle_ad': true,
            'lotus': true,
            'painting_floor_idle': true,
            'play_idle': true,
            'play_stand_idle': true,
            'read_idle': true,
            'rolling_idle': true,
            'sit_idle': true,
            'sit_listen': true,
            'Sit_Listen': true,
            'sit_on_sand_idle': true,
            'Sit_Talk': true,
            'sit_talk': true,
            'sitting_floor_idle': true,
            'sleep_idle': true,
            'stand_idle': true,
            'Sweeps_cycle': true,
            'table_soccer_idle': true,
            'table_socker_idle': true,
            'take_hands': true,
            'talk_sit': true,
            'talk': true,
            'tap_sit': true,
            'tap_stand': true,
            'tap_walk': true,
            'ukulele_sit': true,
            'ukulele_stand': true,
            'Walk_cycle_bag': true,
            'watering_plants_idle': true
        };

        const fs = Loader.fs;
        const path = Loader.path;

        CodeGenerator.snippetsClear();

        let strPersonages = $("#txtGenerateSnippetsPersonagesList").val().trim().replace(/\s/g,"");
        if (!strPersonages) {
            CodeGenerator.snippetsLog("Не указаны персонажи", "err");
            return;
        }
        
        UI.saveLocalStorageText( ["txtGenerateSnippetsPersonagesList"] );

        DataReader.checkPath(function(basedir) {
            if (!basedir) {
                alert("Ошибка. Сначала надо указать путь к папке data клиентского репозитория");
                return;
            }
            CodeGenerator._baseDir = basedir;
            try {
                UI.enableButtons(null, ".workButton", false); // diable all buttons
                
                // /Users/user/dev/rbx3mclient/data/shared/gamedata/tables/map_personages.json
                let pathPersonages = path.resolve(basedir, `shared/gamedata/tables/map_personages.json`);
                // /Users/user/dev/rbx3mclient/data/shared/gamedata/tables/map_animals.json
                let pathAnimals = path.resolve(basedir, `shared/gamedata/tables/map_animals.json`);

                Loader.loadJSON(pathPersonages, function(jsonPers) {
                    console.log("JSON read @ " + pathPersonages + " : ", jsonPers);
                    Loader.loadJSON(pathAnimals, function(jsonAnimals) {
                        console.log("JSON read @ " + pathAnimals + " : ", jsonAnimals);
                        CodeGenerator._snippetsGenerate(
                            { strPersonages: strPersonages },
                            [ jsonPers, jsonAnimals ]
                        );

                        UI.enableButtons(null, ".workButton", true); // enable all buttons

                        let domLog = $("#snippetsGenerateResult");
                        hljs.highlightBlock(domLog[0]);
                    });
                });
            }
            catch(err) {
                console.error(err);
                UI.enableButtons(null, ".workButton", true); // enable all buttons
            }
        });
    }


    static _snippetsGenerate(cfg, jsons)
    {
        let jsonResult = {};
        let mapCache = {};

        let arrPersonageNames = cfg.strPersonages.split(",");
        console.log(arrPersonageNames);

        let mapPersonageGonfigsByName = {};

        for (let j = 0; j < jsons.length; j++) {
            const json = jsons[j];
            for (let p = 0; p < json.length; p++) {
                const eachPersCfg = json[p];
                mapPersonageGonfigsByName[eachPersCfg.name] = eachPersCfg;
            }
        }

        let listToWork = [];
        
        for (let i = 0; i < arrPersonageNames.length; i++) {
            const persName = arrPersonageNames[i];
            let persConfig = mapPersonageGonfigsByName[persName];
            
            if (persConfig && persConfig.inherits) {
                let inheretedPers = mapPersonageGonfigsByName[persConfig.inherits];
                if (inheretedPers) {
                    console.log(`${persName} inherirs ${persConfig.inherits}, so we use his congif`);
                    persConfig = inheretedPers;
                }
            }

            if (persConfig) {
                listToWork.push({ persName: persName, persConfig: persConfig });
            } else {
                console.error(persName + " was not found in map_personages and map_animals");
            }
        }

        let mapAnimNameToPerses = {}; // animation names that are shared between several personages

        for (let i = 0; i < listToWork.length; i++) {
            const listItem = listToWork[i];
            const persConfig = listItem.persConfig;
            if (persConfig.external_animations) {
                persConfig.external_animations.push( {name: "idle"} );
                for (let j = 0; j < persConfig.external_animations.length; j++) {
                    const animName = persConfig.external_animations[j].name;
                    if (mapAnimNameToPerses[animName]) {
                        mapAnimNameToPerses[animName].push( listItem.persName );
                    } else {
                        mapAnimNameToPerses[animName] = [ listItem.persName ];
                    }
                }
            }
        }

        for (let i = 0; i < listToWork.length; i++) {
            const listItem = listToWork[i];
            CodeGenerator._snippetsGenerateForPers( listItem.persName, listItem.persConfig, jsonResult, mapCache, mapAnimNameToPerses );
        }

        CodeGenerator.snippetsLog( JSON.stringify(jsonResult, null, "\t") );
    }

    static _snippetsGenerateForPers(persName, persConfig, jsonResult, mapCache, mapAnimNameToPerses)
    {
        console.log(persName, persConfig);

        if (persConfig.external_animations) 
        {
            for (let i = 0; i < persConfig.external_animations.length; i++) {
                const anim = persConfig.external_animations[i];
                const animName = anim.name;
                let animPrefix = animName.toLowerCase().replace(/[_\W]/g, "");
                let persLetter = persName[0];

                // --- just a name of animation ---
                /*
                let obj = {
                    prefix      : `${animPrefix}`,
                    description : `${mapAnimNameToPerses[animName].join(",")} anim : ${animName}`,
                    body        : [
                        `"${animName}"`
                    ]
                };
                if (!mapCache[obj.prefix])  {
                    mapCache[obj.prefix] = true;
                    jsonResult[obj.description] = obj;
                }
                */

                // --- IDLE : ii ---
                if ( CodeGenerator._isIdle[animName] )
                {
                    let obj = {
                        prefix      : `ii${persLetter}${animPrefix}`,
                        description : `set_idle_animation '${persName}' : '${animName}'`,
                        body        : [
                            `{ "action": "set_idle_animation", "personage": "${persName}", "name": "${animName}", "force_play": true },`
                        ]
                    };
                    if (!mapCache[obj.prefix])  {
                        mapCache[obj.prefix] = true;
                        jsonResult[obj.description] = obj;
                    }
                }
                else 
                {
                    // --- ANIM : aa ---
                    let obj = {
                        prefix      : `aa${persLetter}${animPrefix}`,
                        description : `play_model_animation '${persName}' : '${animName}'`,
                        body        : [
                            `{ \"action\": \"play_model_animation\", \"personage\": \"${persName}\", \"name\": \"${animName}\" },`
                        ]
                    };
                    if (!mapCache[obj.prefix])  {
                        mapCache[obj.prefix] = true;
                        jsonResult[obj.description] = obj;
                    }

                    // --- ANIM : ww (+ wait_seconds) ---
                    /*
                    obj = {
                        prefix      : `ww${persLetter}${animPrefix}`,
                        description : `play_model_animation + wait_seconds '${persName}' : '${animName}'`,
                        body        : [
                            `{ \"action\": \"play_model_animation\", \"personage\": \"${persName}\", \"name\": \"${animName}\", \"wait_seconds\": 1.51 },`
                        ]
                    };
                    if (!mapCache[obj.prefix])  {
                        mapCache[obj.prefix] = true;
                        jsonResult[obj.description] = obj;
                    }
                    */
                }
            }
        }
    }

    static snippetsClear()             { CodeGenerator.commonLogClear("#snippetsGenerateResult"); }
    static snippetsCopy()              { CodeGenerator.commonLogCopy("#snippetsGenerateResult"); }
    static snippetsLog(message, level) { CodeGenerator.commonLogLog("#snippetsGenerateResult", message, level); }



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

        CodeGenerator.questsConfigClear();

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

    static questsConfigClear()             { CodeGenerator.commonLogClear("#questConfigGenerateResult"); }
    static questsConfigCopy()              { CodeGenerator.commonLogCopy("#questConfigGenerateResult"); }
    static questsConfigLog(message, level) { CodeGenerator.commonLogLog("#questConfigGenerateResult", message, level); }





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
    //   Перенос JSON визуалов дня из map_objects_visuals_dayXX.json.new
    // -----------------------------------------------------------------

    static copyVisualsNew() {
        CodeGenerator.visualsNewLogClear();

        ///////---------------------------------------------------
        // CodeGenerator.visualsNewLog( "test " );
        // CodeGenerator.visualsNewLog( "test Warn", "warn" );
        // CodeGenerator.visualsNewLog( "test Err", "err" );

        const fs = Loader.fs;
        const path = Loader.path;

        let dayNum = Number.parseInt($("#txtMoveDayVisualsNewNum").val().trim());
        if (!dayNum) {
            CodeGenerator.visualsNewLog("Не указан номер дня!", "err");
            return;
        }
        
        CodeGenerator._curDay = dayNum;
        UI.saveLocalStorageText( ["txtMoveDayVisualsNewNum"] );

        DataReader.checkPath(function(basedir) {
            if (!basedir) {
                alert("Ошибка. Сначала надо указать путь к папке data клиентского репозитория");
                return;
            }
            CodeGenerator._baseDir = basedir;
            try {
                UI.enableButtons(null, ".workButton", false); // disable all buttons
                CodeGenerator._copyVisualsNew(
                    dayNum,
                    function(callbackData) {
                        console.log( "_copyVisualsNew result: ", callbackData );
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


    static _copyVisualsNew(dayNum, callback) 
    {
        const path = Loader.path;
        const baseDir = CodeGenerator._baseDir;
        
        let pathVisualOld = path.resolve(baseDir, `shared/gamedata/tables/map_objects_visuals_day${dayNum}.json`);
        let pathVisualNew = path.resolve(baseDir, `shared/gamedata/tables/map_objects_visuals_day${dayNum}.json.new`);
        let rawFileOld;
        let rawFileNew;
        let jsonFileNew;
        let lines;
        let replace_first;
        let replace_last;
        let isCommaEndingInReplaceBlock;
        let strReplaceBlock;
        let jsonReplaceBlock;
        let mapReplacableVisualsNames;
        let mapNewVisualsNames;
        let jsonReplaceWith;

        rawFileNew = Loader.loadText(pathVisualNew);
        if (!rawFileNew) {
            CodeGenerator.visualsNewLog("не найден файл", "err");
            CodeGenerator.visualsNewLog(pathVisualNew);

            // 'episode' вместо 'day'
            CodeGenerator.visualsNewLog("пробую 'episode' вместо 'day'");
            pathVisualOld = pathVisualOld.replace(/map_objects_visuals_day/, "map_objects_visuals_episode");
            pathVisualNew = pathVisualNew.replace(/map_objects_visuals_day/, "map_objects_visuals_episode");
            rawFileNew = Loader.loadText(pathVisualNew);
            
            if (!rawFileNew) {
                CodeGenerator.visualsNewLog("не найден файл", "err");
                CodeGenerator.visualsNewLog(pathVisualNew);
                
                CodeGenerator.visualsNewLog("забыл включить psd_import ?", "err");
                return callback();
            }
        }

        try {
            jsonFileNew = JSON.parse(rawFileNew);
        }
        catch (err) {
            CodeGenerator.visualsNewLog("невозможно прочитать файл", "err");
            CodeGenerator.visualsNewLog(pathVisualNew, "err");
            CodeGenerator.visualsNewLog(err, "err");
            console.log("loadJSON ERROR json parsing: ", err);
            return callback();
        }

        if (!jsonFileNew.length || jsonFileNew.length == 0) {
            CodeGenerator.visualsNewLog(pathVisualNew, "err");
            CodeGenerator.visualsNewLog("пустой. ничего не делаю", "err");
            return callback();
        }

        rawFileOld = Loader.loadText(pathVisualOld);
        if (!rawFileOld || rawFileOld.trim().length == 0) {
            CodeGenerator.visualsNewLog(pathVisualOld);
            CodeGenerator.visualsNewLog("был пустой или не существовал, поэтому .new просто скопирован на его место");
            Loader.saveText(
                pathVisualOld, rawFileNew,
                function (p) {
                    console.log("Saved to " + pathVisualOld + " [OK]");
                    callback(true);
                }
            );
            return;
        }

        lines         = rawFileOld.split("\n");
        replace_first = 0;
        replace_last  = lines.length - 1;

        let lastFoundNonEpmtyLine = 0;

        for (let l=0; l<lines.length; l++)
        {
            const line = lines[l];
            if (l > 0 && /^\s*\/\//.test(line)) {
                replace_last = Math.min(lastFoundNonEpmtyLine, l - 1);
                break;
            }
            else if (/\S/.test(line)) {
                lastFoundNonEpmtyLine = l;
            }
        }

        if (/^\s*\[\s*$/.test(lines[replace_first])) replace_first++;
        if (/^\s*\]\s*$/.test(lines[replace_last]))  replace_last--;

        const patternCommaEnd = /}\s*,\s*/;
        if (patternCommaEnd.test( lines[replace_last]) ) {
            lines[replace_last] = lines[replace_last].replace(patternCommaEnd, "}");
            isCommaEndingInReplaceBlock = true;
        }

        let tmpArrLines = [];
        for (let l=replace_first; l<=replace_last; l++)
        {
            const line = lines[l];
            tmpArrLines.push(line);
        }

        strReplaceBlock = "[" + tmpArrLines.join("\n") + "]";
        //console.log("strReplaceBlock: ", strReplaceBlock);

        jsonReplaceBlock = JSON.parse(strReplaceBlock);
        console.log("jsonReplaceBlock: ", jsonReplaceBlock);

        // statistics
        let statNewVisuals = [];
        let statModifiedVisuals = [];
        let statNRemain = 0;

        // build maps
        mapReplacableVisualsNames = {};
        mapNewVisualsNames = {};
        
        for (let i=0; i<jsonReplaceBlock.length; i++) {
            const visual = jsonReplaceBlock[i];
            mapReplacableVisualsNames[visual.name] = visual;
        }

        for (let i=0; i<jsonFileNew.length; i++) {
            const visual = jsonFileNew[i];
            mapNewVisualsNames[visual.name] = visual; // ? not really needed
            const oldVisual = mapReplacableVisualsNames[visual.name];

            // yes, exist
            if (oldVisual) {
                // equal
                if (CodeGenerator._compareVisuals(visual, oldVisual)) {
                    statNRemain += 1;
                } 
                // different
                else {
                    for (let k in visual) {
                        oldVisual[k] = visual[k];
                    }
                    statModifiedVisuals.push( visual.name );
                }
            }
            // new visual
            else {
                jsonReplaceBlock.push( visual );
                statNewVisuals.push( visual.name );
            }
        }

        // write stats
        CodeGenerator.visualsNewLog(`>>>> Визуалов осталось как были: ${statNRemain} шт.`, "err");
        CodeGenerator.visualsNewLog(`>>>> Новые визуалы: ${statNewVisuals.length} шт.`, "err");
        for (let i=0; i<statNewVisuals.length; i++) {
            CodeGenerator.visualsNewLog("  " + statNewVisuals[i]);
        }
        CodeGenerator.visualsNewLog(`>>>> Измененные визуалы: ${statModifiedVisuals.length} шт.`, "err");
        for (let i=0; i<statModifiedVisuals.length; i++) {
            CodeGenerator.visualsNewLog("  " + statModifiedVisuals[i]);
        }


        // build final replacing block
        strReplaceBlock = JSON.stringify(jsonReplaceBlock, null, 2);
        let newBlockLines = strReplaceBlock.split("\n");

        // remove 1st and last lines
        if (newBlockLines.length > 0) newBlockLines.shift();
        if (newBlockLines.length > 0) newBlockLines.pop();

        if (newBlockLines.length > 0 && isCommaEndingInReplaceBlock) {
            newBlockLines[newBlockLines.length-1] += ",";
        }

        // build whole file from parts
        let queue = [
            // [ array_of_lines,  index_from,  index_to ]
            [ lines,         0,              replace_first-1        ],
            [ newBlockLines, 0,              newBlockLines.length-1 ],
            [ lines,         replace_last+1, lines.length-1         ]
        ];
        let newLines = [];

        for (let qi=0; qi<queue.length; qi++) {
            let q = queue[qi];
            for (let i=q[1]; i<=q[2]; i++) {
                newLines.push(q[0][i]);
            }
        }

        rawFileOld = newLines.join("\n");

        /*  
            // --- закоментил, тошо сбивает с толку, что new продолжает отличаться от json. пусть будут идентичными
        // round tooooo long float numbers ~ 72.1199999999999 => 72.12
        rawFileOld = rawFileOld.replace(/(\d+\.\d{4,})/g, function(match) {
            return String(Math.floor(parseFloat(match) * 10) / 10);
        });
        */

        CodeGenerator.visualsNewLog("Saving...", "warn");
        Loader.saveText(
            pathVisualOld, rawFileOld,
            function (p) {
                CodeGenerator.visualsNewLog("Saved to " + pathVisualOld + " [OK]", "warn");
                callback(true);
            }
        );
    }


    static _compareVisuals(v1, v2) {
        return ( !!v1.offset    == !!v2.offset )
            && ( !!v1.size      == !!v2.size )
            && ( v1.offset.x    == v2.offset.x )
            && ( v1.offset.y    == v2.offset.y )
            && ( v1.size.width  == v2.size.width )
            && ( v1.size.height == v2.size.height );
    }

    static visualsNewLogClear()             { CodeGenerator.commonLogClear("#moveDayVisualsNewReport"); }
    static visualsNewLogCopy()              { CodeGenerator.commonLogCopy("#moveDayVisualsNewReport"); }
    static visualsNewLog(message, level)    { CodeGenerator.commonLogLog("#moveDayVisualsNewReport", message, level); }


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



    static commonLogClear(logElementSelector) 
    {
        $(logElementSelector).empty();
    }

    static commonLogCopy(logElementSelector) 
    {
        let s = $(logElementSelector).text();
        let clipboard = nw.Clipboard.get();
        clipboard.set(s, 'text');
    }


    static commonLogLog(logElementSelector, message, level)
    {
        let domLog = $(logElementSelector);

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