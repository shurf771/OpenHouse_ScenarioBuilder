class QuestsFastInit
{
    scenarioPathDefault = "C:\\work\\integra\\designshow\\client\\data\\gamedata\\configs\\scenarios\\scenarios_ep01.json";
    scenarioPath;

    onceParsed;

    scenario = {
        exists: false,
        time: 0,        // max(ctime, mtime)
        lines: null,    // array of strings ~ "name": "quest.201", // Вынести старый стелаж
        questsMapById: null, // map :  quests[i].id => quests[i]
        quests: null    // array of quests definitions: 
                        // { id = "quest.201", title = "Вынести старый стелаж", startLine = 150, stopLine = 193, stopInitLine = 168 }
    };

    log = { };


    // return false if dont want to reload log-file
    checkAutoLoadFile(forceReload) {
        return true;
    }


    setDelegate(delegate) {
        // settingGet: function(key)
        // settingSet: function(key, value)
        this.delegate = delegate;
    }


    onShow() {
        this.scenarioPath = this.scenarioPathDefault;
        let settingsScenarioPath = this.delegate.settingGet("quests_fast_init_scenario_path");
        if (settingsScenarioPath) {
            this.scenarioPath = settingsScenarioPath;
        }
        this.changeScenarioPath(null);

        $("#scenarioPath").on( 'click', this.scenarioPath_click.bind(this) );
        $("#cmbScenarioPaths").on( 'change', this.cmbScenarioPaths_change.bind(this) );
        $("#qfi_quest_id").on( 'change', this.cmbScenarioQuestId_change.bind(this) );
        $("#qfi_scenario_refresh").on( 'click', this.scenarioRefresh_click.bind(this) );
        $("#qfi_log_replace_all").on( 'click', this.replaceAll_click.bind(this) );
        $("#qfi_log_copy_all").on( 'click', this.copyAll_click.bind(this) );

        this.lockGUI = true;
        this.reloadScenario();

        if (!this.onceParsed) {
            this.onDefaultParseCompleted(RESULTS, RESULTS_ARR);
        }

        this.lockGUI = false;
        this.generateGUI();
    }


    destroy() {
        this.onceParsed = null;
        this.resetScenarioField();
        this.resetLogField();

        $("#full_log_body").empty();
        $("#scenarioPath").off( 'click' );
        $("#cmbScenarioPaths").off( 'change' );
        $("#qfi_quest_id").off( 'change' );
        $("#qfi_scenario_refresh").off( 'click' );
        $("#qfi_log_replace_all").off( 'click' );
        $("#qfi_log_copy_all").off( 'click' );
    }


    // ------------------------------------------
    //   Scenario path picker
    // ------------------------------------------

    changeScenarioPath(newScenarioPath)
    {
        let settingPaths = this.delegate.settingGet("quests_fast_init_scenario_paths");
        if (!settingPaths) {
            settingPaths = [ this.scenarioPathDefault ];
            this.delegate.settingSet("quests_fast_init_scenario_paths", settingPaths);
        }

        if (newScenarioPath && this.scenarioPath != newScenarioPath) {
            this.scenarioPath = newScenarioPath;
            this.delegate.settingSet("quests_fast_init_scenario_path", this.scenarioPath);
            var exist = false;
            for (let i=0; i<settingPaths.length; i++) {
                if (settingPaths[i] == this.scenarioPath) {
                    exist = true;
                    break;
                }
            }
            if (!exist) {
                settingPaths.push(this.scenarioPath);
                this.delegate.settingSet("quests_fast_init_scenario_paths", settingPaths);

                this.reloadScenario();
            }
        }

        $("#scenarioPath").text( this.scenarioPath );
    }

    scenarioPath_click() {
        var isVisible = $("#scenarioPathTools").toggle().is(":visible");
        if (isVisible)
        {
            let settingPaths = this.delegate.settingGet("quests_fast_init_scenario_paths");
            var combobox = $("#cmbScenarioPaths");
            combobox.empty();
            combobox.append( $("<option />").text(this.scenarioPath) );
            for (var i=0; i<settingPaths.length; i++) {
                if (this.scenarioPath != settingPaths[i]) {
                    combobox.append( $("<option />").text(settingPaths[i]) );
                }
            }
            combobox.append( $("<option />").text("enter a new path...") );
        }
    }
  
    cmbScenarioPaths_change() {
        var val = $("#cmbScenarioPaths").val();
        if (val == "enter a new path...") {
            val = prompt(val);
        }
        $("#scenarioPathTools").hide();
        this.changeScenarioPath(val);
    }


    // ------------------------------------------
    //   Load scenario, pick quest
    // ------------------------------------------

    
    scenarioRefresh_click() {
        this.reloadScenario();
        this.generateGUI();
    }

    cmbScenarioQuestId_change() {
        var val = $("#qfi_quest_id").val();
        console.log("combobox pick new current quest: ", val);
        this.delegate.settingSet("quests_fast_init_cur_qid", val);
        this.updateScenarioQuestActions();
        this.generateGUI();
    }


    resetScenarioField() {
        this.scenario = {
            exists: false,
            time: 0,        // max(ctime, mtime)
            lines: null,    // array of strings ~ "name": "quest.201", // Вынести старый стелаж
            questsMapById: null, // map :  quests[i].id => quests[i]
            quests: null    // array of quests definitions: 
                            // { id = "quest.201", title = "Вынести старый стелаж", startLine = 150, stopLine = 193, stopInitLine = 168 }
        };
    }


    resetLogField() {
        this.log = { };
    }


    isScenarioChanged() {
        try {
            let stats = fs.statSync(this.scenarioPath);
            let maxtime = Math.max(stats.mtimeMs || 0, stats.ctimeMs || 0);
            if (maxtime > this.scenario.time) {
                this.scenario.time = maxtime;
                return true;
            }
        } 
        catch (err) {
            console.log("isScenarioChanged ERROR reading file: ", err);
        }
        return false;
    }


    reloadScenario() {
        this.resetScenarioField();

        try {
            let buf = fs.readFileSync(this.scenarioPath);
            let str = buf.toString();
            this.scenario.lines  = str.split("\n");
            this.scenario.exists = true;
            this.scenario.path = this.scenarioPath;
            this.isScenarioChanged();
        } 
        catch (err) {
            console.log("reloadScenario ERROR reading file: ", err);
        }

        if (!this.scenario.exists) {
            this.redrawQuestsCombobox();
            return;
        }

        let prevQuest     = null;
        let quests        = [];
        let questsMapById = {};

        for (let i=0; i<this.scenario.lines.length; i++)
        {
            const line = this.scenario.lines[i];
            let matches = line.match(/^\s*"name"\s*:\s*"([^"]+)"\s*,\s*(\/\/\s*)?(.*)?$/);
            if (matches) {
                let newQuest = {
                    index     : quests.length,
                    id        : matches[1], 
                    title     : matches[3], 
                    startLine : i, 
                    stopLine  : i+1
                };
                quests.push(newQuest);
                questsMapById[newQuest.id] = newQuest;

                if (prevQuest) {
                    prevQuest.stopLine = i - 1;
                }
                prevQuest = newQuest;
            }
            else {
                // find end of init block : "wait_modals_close" or at least "unlock_scene" actions
                if (prevQuest && !prevQuest.stopInitLine) {
                    if (line.indexOf('"wait_modals_close"') >= 0) {
                        prevQuest.stopInitLine = i;
                    }
                    else if (line.indexOf('"unlock_scene"') >= 0) {
                        prevQuest.stopInitLine = i;
                    }
                }
            }
        }

        if (prevQuest) {
            prevQuest.stopLine = this.scenario.lines.length-1;
        }

        this.scenario.quests        = quests;
        this.scenario.questsMapById = questsMapById;
        this.scenario.needUpdateScenarioQuests = true;
        this.redrawQuestsCombobox();

        let currentVal = $("#qfi_quest_id").val();
        if (!currentVal && quests.length > 0) {
            $("#qfi_quest_id").val( quests[0].id );
        }

        if (this.scenario.needUpdateScenarioQuests) {
            this.updateScenarioQuestActions();
        }
    }


    redrawQuestsCombobox() {
        let combobox = $("#qfi_quest_id");
        let currentVal = combobox.val();

        if (!currentVal) {
            currentVal = this.delegate.settingGet("quests_fast_init_cur_qid");
        }
        this.availableQuestsIds = {};

        combobox.empty();

        if (!this.scenario.exists || !this.scenario.quests) {
            combobox.append( $("<option />").text( "invalid scenario json" ) );
            return;
        }

        let quests = this.scenario.quests;
        
        for (var i=0; i<quests.length; i++) {
            const q = quests[i];
            const title = (q.title ? q.id + " - " + q.title : q.id);
            combobox.append( $("<option />").val(q.id).text(title) );
            this.availableQuestsIds[q.id] = true;
        }

        combobox.val(currentVal);
        if (currentVal != combobox.val()) {
            this.updateScenarioQuestActions();
        }
    }


    updateScenarioQuestActions() {
        let qId = $("#qfi_quest_id").val();
        console.log( "updateScenarioQuestActions", qId );
        if (!qId) {
            return;
        }

        const quest = this.scenario.questsMapById[qId];
        if (!quest) {
            console.log( "Error: invalid qID !" );
            return;
        }

        quest.actions = [];
        for (let i = quest.startLine; i <= (quest.stopInitLine || quest.stopLine); i++)
        {
            const raw = this.scenario.lines[i];
            let action = this.parseActionInfo( raw, quest.actions );
            if (action) {
                action.line = i;
                action.raw = raw;
                quest.actions.push(action);
            }
        }


        this.scenario.needUpdateScenarioQuests = false;
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        console.log(this.scenario); // TODO: comment (too much data)
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    }


    getScenarioActionsParseConfigs() {
        if (this.scenarioActionsParseConfigs)
            return this.scenarioActionsParseConfigs;
        this.scenarioActionsParseConfigs = [
            {
                action: "zoom_camera",
                preSearch: [ '"zoom_camera"' ],
                matches: [
                    { key: 2,    pattern: /("action"\s*:\s*")(zoom_camera)(")/, replace: {"action": 2} },
                    { key: null, pattern: /("zoom"\s*:\s*)([-.\d]+)/,           replace: {"zoom": 2}, overwritable: true }
                ]
            },
            {
                action: "move_camera_fast",
                preSearch: [ '"move_camera_fast"' ],
                matches: [
                    { key: 2,    pattern: /("action"\s*:\s*")(move_camera_fast)(")/, replace: {"action": 2} },
                    { key: null, pattern: /("position"\s*:\s*{"x"\s*:\s*)([-.\d]+)(\s*,\s*"y"\s*:\s*)([-.\d]+)(\s*})/, 
                                 replace: {"x": 2, "y": 4}, overwritable: true }
                ]
            },
            {
                action: "set_position",
                preSearch: [ '"set_position"' ],
                matches: [
                    { key: 2,    pattern: /("action"\s*:\s*")(set_position)(")/, replace: {"action": 2} },
                    { key: 2,    pattern: /("personage"\s*:\s*")(\w+)(")/,       replace: {"personage": 2} },
                    { key: null, pattern: /("position"\s*:\s*{"x"\s*:\s*)([-.\d]+)(\s*,\s*"y"\s*:\s*)([-.\d]+)(\s*})/, 
                                 replace: {"x": 2, "y": 4}, overwritable: true }
                ]
            },
            {
                action: "look",
                preSearch: [ '"look"' ],
                matches: [
                    { key: 2,    pattern: /("action"\s*:\s*")(look)(")/,         replace: {"action": 2} },
                    { key: 2,    pattern: /("personage"\s*:\s*")(\w+)(")/,       replace: {"personage": 2} },
                    { key: null, pattern: /("at"\s*:\s*")(\w+)(")/,              replace: {"at": 2}, overwritable: true }
                ]
            }
        ];
        return this.scenarioActionsParseConfigs;
    }


    parseActionInfo(raw) {
        const configs = this.getScenarioActionsParseConfigs();

        for (let i=0; i<configs.length; i++)
        {
            const config = configs[i];

            // preSearch (simple search)
            let preSearchOK = true;
            for (let j=0; j<config.preSearch.length; j++) {
                if (raw.indexOf(config.preSearch[j]) == -1) {
                    preSearchOK = false;
                    break;
                }
            }
            if (!preSearchOK) continue;

            // check all matches
            let actionKeyParts = [];
            let matchResults = [];
            let matchesOK = true;
            let matchesKeys = {};
            for (let j=0; j<config.matches.length; j++) {
                const matchCfg = config.matches[j];
                let arrParts = raw.match(matchCfg.pattern);
                if (!arrParts) {
                    matchesOK = false;
                    break;
                }
                matchResults.push(arrParts);
                if (matchCfg.key) {
                    actionKeyParts.push( arrParts[matchCfg.key] );
                }
                for (let k in matchCfg.replace) {
                    matchesKeys[k] = arrParts[ matchCfg.replace[k] ];
                }
            }
            if (!matchesOK) continue;

            // create Action_Key , and build action
            let actionKey = actionKeyParts.join("_");
            let action = {
                actionKey: actionKey,
                config: config,
                matchResults: matchResults,
                keys: matchesKeys
            };

            // html title
            let htmlTitle = raw.trim();
            for (let boldKey in matchesKeys) {
                let boldVal = matchesKeys[boldKey];
                let boldPattern = new RegExp(`(?<!>)(${boldVal})(?!<)`);
                htmlTitle = htmlTitle.replace(boldPattern, "<b>$1</b>");
            }
            action.htmlTitle = htmlTitle;

            return action;
        }

        return null;
    }


    // ------------------------------------------
    //  Parsing log
    // ------------------------------------------


    allowRedrawDefaultResults() {
        return true;
    }


    // return true - make default log parser do his job, then go to the onDefaultParseCompleted()
    runParse() {
        return true;
    }


    onDefaultParseCompleted(resultsMap, resultsArray) {
        console.log("[QuestsFastInit] parsing...");

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        console.log("MAP: ", resultsMap, "ARRAY: ", resultsArray); // TODO: comment (too much data)
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        this.onceParsed = true;

        const supportedActions = {
            "zoom_camera"      : true,
            "move_camera_fast" : true,
            "set_position"     : true,
            "look"             : true
        };

        let logActions = [];

        // make sure new actions differ from old ones
        let actionsSignitureArr = [];
        for (let i=0; i<resultsArray.length; i++) {
            const r = resultsArray[i];
            if (supportedActions[r.actionName]) {
                actionsSignitureArr.push(r.i + ":" + r.key);
                logActions.push(r);
            }
        }
        let actionsSigniture = actionsSignitureArr.join("|");

        if (this.log && this.log.oldActionsSigniture) {
            if (actionsSigniture == this.scenario.oldActionsSigniture) {
                console.log("[onDefaultParseCompleted] skip refreshing, nothing important was changed...");
                return;
            }
        }
    
        this.log.oldActionsSigniture = actionsSigniture;
        this.log.logActions = logActions;
        
        this.generateGUI();
    }



    // ------------------------------------------
    //  GUI
    // ------------------------------------------


    generateGUI() {
        if (this.lockGUI) return;
        console.log("generating gui...");
        let domRoot = $(".qfi_body").empty();

        // cur scenario quest actions
        let qId = $("#qfi_quest_id").val();
        let scenarioQuest = null;
        let scenarioActions = null;
        if (qId) {
            scenarioQuest = this.scenario.questsMapById[qId];
            if (scenarioQuest) {
                scenarioActions = scenarioQuest.actions;
            }
        }

        const rows = [];
        this.scenario.rows = rows;

        // prepare log actions 
        let lastScenarioRowFound = -1;
        let logActionInfos = [];
        let logActionInfoByKey = {};
        let lastRowOfActionGroup = {}; // i => actionName

        if (this.log.logActions)
        {
            for (let i=0; i<this.log.logActions.length; i++) {
                const logRaw = this.log.logActions[i].text_1;
                const logActionInfo = {
                    info   : this.log.logActions[i],
                    action : this.parseActionInfo(logRaw),
                    used   : false
                };
                if (logActionInfo.action)
                {
                    logActionInfo.action.raw = logRaw;
                    logActionInfos.push(logActionInfo);
                    logActionInfoByKey[logActionInfo.info.key] = logActionInfo;
                }
            }
        }

        for (let i=0; i<scenarioActions.length; i++) {
            const scenarioAction = scenarioActions[i];
            const actionKey = scenarioAction.actionKey;
            const actionName = scenarioAction.config.action;
            let row = { i: i, scenarioAction: scenarioAction };
            if (logActionInfoByKey[actionKey]) {
                logActionInfoByKey[actionKey].used = true;
                row.logInfo   = logActionInfoByKey[actionKey].info;
                row.logAction = logActionInfoByKey[actionKey].action;
            }
            rows.push(row);

            lastScenarioRowFound = Math.max(lastScenarioRowFound, scenarioAction.line);

            lastRowOfActionGroup[i] = actionName;
            if (lastRowOfActionGroup[i-1] == actionName) {
                delete lastRowOfActionGroup[i-1];
            }
        }

        let stillUnusedActions = false;
        // unused log actions -> to blocks' ends
        for (let i=0; i<logActionInfos.length; i++) {
            const logActionInfo = logActionInfos[i];
            if (!logActionInfo.used) {
                let actionName = logActionInfo.info.actionName;
                for (let r=0; r<rows.length; r++) {
                    const row = rows[r];
                    if (lastRowOfActionGroup[row.i] == actionName) {
                        const newRow = { 
                            i         : -1,
                            logInfo   : logActionInfo.info,
                            logAction : logActionInfo.action,
                            afterLine : rows[r].scenarioAction.line
                        };
                        rows.splice(r+1, 0, newRow);
                        if (!logActionInfo.used) {
                            newRow.firstUse = true;
                        }
                        logActionInfo.used = true;
                        r = r + 1;

                        lastScenarioRowFound = Math.max(lastScenarioRowFound, newRow.afterLine);
                    }
                }
                if (!logActionInfo.used) {
                    stillUnusedActions = true;
                }
            }
        }

        // unused log actions -> no place to put new actions
        if (stillUnusedActions) {
            // a. try to find last confirmed row, and add new rows after it
            // b. if no rows at all, find the best line in whole quest block
            if (lastScenarioRowFound == -1) {
                lastScenarioRowFound = scenarioQuest.startLine;
                for (let j=lastScenarioRowFound; j<(scenarioQuest.stopInitLine || scenarioQuest.stopLine); j++) {
                    const line = this.scenario.lines[j];
                    if (line.indexOf('"action"') >= 0) {
                        lastScenarioRowFound = j;
                        break;
                    }
                }
            }

            for (let i=0; i<logActionInfos.length; i++) {
                const logActionInfo = logActionInfos[i];
                if (!logActionInfo.used) {
                    const newRow = { 
                        i         : -1,
                        logInfo   : logActionInfo.info,
                        logAction : logActionInfo.action,
                        afterLine : lastScenarioRowFound,
                        firstUse  : true
                    };
                    rows.push(newRow);
                    logActionInfo.used = true;
                }
            }
        }

    
        // generate html finaly
        const context = {};
        for (let i=0; i<rows.length; i++) {
            const row = rows[i];
            row.i = i; // previous "i" are broken
            this.createRow(row, domRoot, context);
        }

        console.log("created DOM with rows:", rows);
    }
    

    createRow(row, parent, context) {
        let domRow = $("<div />").addClass("row actions_row").attr("row_i", row.i);
        let domCellLeft = $("<div />").addClass("col-5 qfi_l");
        let domCellMid = $("<div />").addClass("col-2 qfi_c");
        let domCellRight = $("<div />").addClass("col-5 qfi_r");

        let rowActionName = null;

        // left tile : log action
        if (row.logAction) {
            rowActionName = row.logAction.config.action;
            let tileLog = this.createRowTile( row.logAction, {row: row} );
            domCellLeft.append(tileLog);
        }

        // right tile : scenario action
        if (row.scenarioAction) {
            rowActionName = row.scenarioAction.config.action;
            let tileScenario = this.createRowTile( row.scenarioAction, {row: row, scenario: true} );
            domCellRight.append(tileScenario);
        }

        // center tile : button
        let buttonCfg = null;
        if (!row.scenarioAction) {
            // new button
            buttonCfg = { class: "bg-green", action: "add" };
        } 
        else if (row.scenarioAction && row.logAction) {
            let isEqual = true;
            for (let k in row.scenarioAction.keys) {
                if (row.scenarioAction.keys[k] != row.logAction.keys[k]) {
                    isEqual = false;
                    break;
                }
            }
            for (let k in row.logAction.keys) {
                if (row.scenarioAction.keys[k] != row.logAction.keys[k]) {
                    isEqual = false;
                    break;
                }
            }
            if (!isEqual) {
                // replace button
                buttonCfg = { class: "bg-cyan", action: "replace" };
            }
        }

        if (buttonCfg) {
            let domButton = $("<button />").addClass(buttonCfg.class + " s").html("&Rarr;");
            domButton.attr({
                "row_i": row.i,
                "shu_action": buttonCfg.action
            });
            domButton.on("click", this.onAddReplaceClick.bind(this));
            domCellMid.append(domButton);
            row.copyButtonAction = buttonCfg.action;
        }

        if (context) {
            if (context.lastRowActionName && context.lastRowActionName != rowActionName) {
                parent.append(
                    $("<hr />").addClass("actions_divide")
                );
            }
            context.lastRowActionName = rowActionName;
        }

        domRow.append([ domCellLeft, domCellMid, domCellRight ])
        parent.append(domRow);
        return domRow;
    }


    createRowTile(action, params) {
        let htmlTitle = action.htmlTitle;
        let domTile = $("<div />").addClass("action_tile");

        let domTitle = $("<span />").addClass("title").html(htmlTitle);
        let domLineNumber = $("<span />").addClass("line").text(action.line + 1);

        if (params.scenario) {
            let domDeleteButton = $("<span />").addClass("kill_action").text("x");
            domDeleteButton.on("click", this.onKillScenarionAction.bind(this));
            domTile.append([
                $("<div />").addClass("at_l").append( domLineNumber ),
                $("<div />").addClass("at_c").append( domTitle ),
                $("<div />").addClass("at_r").append( domDeleteButton )
            ]);
        }
        else {
            domTile.append([
                $("<div />").addClass("at_c").append( domTitle )
            ]);
        }

        return domTile;
    }


    onKillScenarionAction(e) {
        const btn = $(e.currentTarget);
        let row_i = btn.parents("div.actions_row").attr("row_i");
        let row = this.scenario.rows[row_i];
        let scenarioAction = row.scenarioAction;
        console.log("[onKillScenarionAction]", row_i, scenarioAction);
        this.deleteLine( scenarioAction.line );
    }


    onAddReplaceClick(e) {
        const btn = $(e.currentTarget);
        let row_i = btn.attr("row_i");
        let shu_action = btn.attr("shu_action");
        let row = this.scenario.rows[row_i];
        console.log("[onAddReplaceClick]", row_i, shu_action, row);
        this.addReplaceLine(shu_action, row);
    }


    replaceAll_click(e) {
        this.copyReplaceAll(true);
    }

    copyAll_click(e) {
        this.copyReplaceAll(false);
    }


    // ------------------------------------------
    //  Modify scenario json
    // ------------------------------------------


    copyReplaceAll(isReplace) {
        this.lockOverwriteScenario = true;
        for (let i=0; i < this.scenario.rows.length; i++) {
            const row = this.scenario.rows[i];
            if (row.copyButtonAction && row.copyButtonAction == "replace") {
                this.addReplaceLine(row.copyButtonAction, row);
            }
            else if (row.copyButtonAction && row.copyButtonAction == "add" && row.firstUse) {
                this.addReplaceLine(row.copyButtonAction, row);
            }
            else if (isReplace && row.scenarioAction && !row.logAction) {
                this.deleteLine(row.scenarioAction.line);
            }
        }
        this.lockOverwriteScenario = false;
        this.overwriteScenario(true);
    }


    deleteLine(line) {
        if (!this.scenario.deletedLines) this.scenario.deletedLines = {};
        this.scenario.deletedLines[line] = true;
        this.overwriteScenario(true);
    }


    addReplaceLine(action, row) {
        let afterLine = ("afterLine" in row ? row.afterLine : row.scenarioAction.line);
        let oldText = this.scenario.lines[afterLine];
        let newText = row.logAction.raw;
        let isOK = false;
        console.log("[addReplaceLine]", afterLine, oldText, "->", newText);

        if (action == "replace") {
            let matches = row.scenarioAction.config.matches;
            let newKeys = row.logAction.keys;
            for (let i=0; i<matches.length; i++) {
                const cfgMatch = matches[i];
                if (cfgMatch.overwritable) {
                    let parts = oldText.match(cfgMatch.pattern);
                    if (parts) {
                        let replaceParts = [];
                        let rpi = 1;
                        while (replaceParts.length < parts.length-1)
                            replaceParts.push("$"+(rpi++));
                        for (let rkey in cfgMatch.replace) {
                            let rkeyIndex = cfgMatch.replace[rkey];
                            replaceParts[rkeyIndex-1] = newKeys[rkey];
                        }
                        newText = oldText.replace(cfgMatch.pattern, replaceParts.join(""));
                        console.log(oldText, "->", newText);
                        this.scenario.lines[afterLine] = newText;
                        isOK = true;
                    }
                    else {
                        console.error("unexpected invalid text or pattern!", row, newText, cfgMatch);
                    }
                }
            }
        }
        else if (action == "add") {
            let trailingSpaces = oldText.replace(/(^\s*).+$/, "$1");
            let isCommaAtEnd   = /,\s*$/.test(oldText);

            if (isCommaAtEnd) {
                newText = trailingSpaces + newText + ",";
            } else {
                oldText = oldText + ",";
                newText = trailingSpaces + newText;
            }

            this.scenario.lines[afterLine] = oldText;

            if (!this.scenario.extraLines) this.scenario.extraLines = {};
            if (!this.scenario.extraLines[afterLine]) this.scenario.extraLines[afterLine] = [];
            this.scenario.extraLines[afterLine].push(newText);
            isOK = true;
        }

        if (isOK) {
            this.overwriteScenario(true);
        }
    }


    overwriteScenario(reloadAfter) {
        if (this.lockOverwriteScenario) {
            return;
        }
        if (this.isScenarioChanged()) {
            let s = Math.round((Date.now() - this.scenario.time) / 1000);
            alert(`Scenario file was changed ${s} seconds ago!\nClose alert to reload.\nLast action will not be applied`);
            this.reloadScenario();
            this.generateGUI();
            return;
        }

        let oldLines = this.scenario.lines;
        let deletedLines = this.scenario.deletedLines;
        let extraLines = this.scenario.extraLines;
        let lines = [];

        for (let i=0; i<oldLines.length; i++) {
            if (!deletedLines || !deletedLines[i]) {
                lines.push( oldLines[i] );
            }
            if (extraLines && extraLines[i]) {
                for (let j=0; j<extraLines[i].length; j++) {
                    lines.push( extraLines[i][j] );
                }
            }
        }

        try {
            let str = lines.join("\n");
            fs.writeFileSync(this.scenario.path, str);
        } 
        catch (err) {
            console.log("overwriteScenario ERROR writing file: ", err);
            alert("Error overwriting file");
            return;
        }

        if (reloadAfter) {
            this.reloadScenario();
            this.generateGUI();
        }
    }

}