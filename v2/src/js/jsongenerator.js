const BlockTypes =
{
    TEXT : "text",
    HEADER : "header",
    DAY_END : "day_end",
};

const COMICS_ICON = 
{
    "main"    : "Emotions_MainChar/Emotions_MineChar_Default",
    "sarah"   : "Emotions_Mechanic/Emotions_Mechanic_Default",
    "jimmy"   : "Emotions_Jimmy/Emotions_Jimmy_Default",
    "ellie"   : "Emotions_Elly/Emotions_Mechanic_Ellie_Default",
    "charles" : "Emotions_Charles/Emotions_Charles_Default"
}


class JSONGenerator
{
    static generate(quests, defaults)
    {
        console.log(quests, defaults);
        
        JSONGenerator.defaults = defaults;
        JSONGenerator.blocks = [];
        JSONGenerator.episode_id = 0;

        JSONGenerator._generateDayStart();

        for (let i=0; i<quests.length; i++)
        {
            let quest = quests[i];
            quest.is1st = (i == 0);

            let nextQuestId = null;
            for (let j=i+1; j<quests.length; j++) {
                const nextQuest = quests[j];
                if (!nextQuest.is_quest_group_complete) {
                    nextQuestId = nextQuest.id;
                    break;
                }
            }

            JSONGenerator.episode_id = quest.episode_id;
            JSONGenerator.nextQID = (i+1<quests.length ? quests[i+1].id : null);
            JSONGenerator._generateQuest(quest, nextQuestId);
        }

        JSONGenerator._generateDayFinish();

        return JSONGenerator.blocks;
    }


    static _generateDayStart()
    {
        JSONGenerator.addBlock( TPL_DAY_START );
    }

    static _generateDayFinish()
    {
        let txt = replaces(TPL_DAY_END, {
            "__!episode_id!__" : JSONGenerator.episode_id
        });
        JSONGenerator.addBlock( txt, BlockTypes.DAY_END );
    }

    static _generateQuest(quest, nextQuestId)
    {
        // header (only for ui, has no json code)
        JSONGenerator.addBlock( "", BlockTypes.HEADER, {
            id : quest.id,
            title : quest.title,
            is_quest_group_complete : !!quest.is_quest_group_complete,
        } );

        let firstDayOpenLocation = (quest.is1st 
            ? tabs(replaces(TPL_OPEN_LOCATION, {"__!day!__": "day"+JSONGenerator.episode_id}), 3) 
            : "");
        
        let replacesParams = {
            "__!quest:id!__"          : quest.id,
            "__!quest:title!__"       : quest.title,
            "__!questblock:type!__"   : (quest.is_quest_group_complete ? "quest_group_complete" : "quest"),
            "__!defaults:camera:x!__" : JSONGenerator.defaults.camera.value.x,
            "__!defaults:camera:y!__" : JSONGenerator.defaults.camera.value.y,
            "__!startblock:prefix!__" : "",
            "__!quest:1st!__"         : firstDayOpenLocation
        };
        
        let _actMainPersesMap = {};
        let activeMainPersonages = [];

        let _talkingPersesMap = {};
        let talkingPersonages = [];

        for (let i=0; quest.rawLocalizationRows && i<quest.rawLocalizationRows.length; i++) {
            let pers = String(quest.rawLocalizationRows[i].Comment).trim().toLowerCase();
            pers = nameAlias(pers);
            if (UIDefaults.data["position."+pers]) {
                if (!_actMainPersesMap[pers]) {
                    _actMainPersesMap[pers] = {
                        "name": pers,
                        "pos": JSONGenerator.defaults["position."+pers].value,
                        "order": JSONGenerator.defaults["position."+pers].order
                    };
                    activeMainPersonages.push(_actMainPersesMap[pers]);
                }
            }
            if (!_talkingPersesMap[pers]) {
                _talkingPersesMap[pers] = {
                    "name": pers,
                    "icon": ( COMICS_ICON[pers] || "" ),
                    "order": ( JSONGenerator.defaults["position."+pers] ? JSONGenerator.defaults["position."+pers].order : 9999 )
                };
                talkingPersonages.push(_talkingPersesMap[pers]);
            }
        }
        activeMainPersonages.sort((a,b)=>{ return a.order - b.order; });
        talkingPersonages.sort((a,b)=>{ return a.order - b.order; });

        // "action": "set_position" + "action": "look" + "action": "set_idle_animation"
        let tmpStatPoss = [];
        let tmpStatLooks = [];
        let tmpStatIdles = [];
        let nonEmptyBlockEnd = "";

        for (let i=0; i<activeMainPersonages.length; i++) {
            let activeMainPersonage = activeMainPersonages[i];
            
            let tmpStatPos = replaces(TPL_PERS_SET_POS, {
                "__!pers:name!__" : activeMainPersonage.name,
                "__!pos:x!__"     : activeMainPersonage.pos.x,
                "__!pos:y!__"     : activeMainPersonage.pos.y
            });
            tmpStatPoss.push(tmpStatPos);

            let tmpStatLook = replaces(TPL_PERS_LOOK, {
                "__!pers:name!__" : activeMainPersonage.name
            });
            tmpStatLooks.push(tmpStatLook);

            let tmpStatIdle = replaces(TPL_PERS_IDLE, {
                "__!pers:name!__" : activeMainPersonage.name
            });
            tmpStatIdles.push(tmpStatIdle);

            replacesParams["__!startblock:prefix!__"] = ",\n";
            nonEmptyBlockEnd = ",\n";
        }

        replacesParams["__!personages:setidle!__"]        = tabs(tmpStatIdles.join(",\n") , 3) + nonEmptyBlockEnd;
        replacesParams["__!personages:startpositions!__"] = tabs(tmpStatPoss.join(",\n") , 3) + nonEmptyBlockEnd;
        replacesParams["__!personages:looks!__"]          = tabs(tmpStatLooks.join(",\n") , 3);


        // quest start
        let txtStartQuest = replaces(TPL_QUEST_START, replacesParams);
        txtStartQuest = tabs(txtStartQuest, 1);
        JSONGenerator.addBlock( txtStartQuest, BlockTypes.TEXT );

        // talks
        let strTalks = "";
        let strTalksArr = [];
        let lastTalkType = null;
        let talksArr = [];
        let mustArr = [];
        let talkingSessionPerses = [];
        let _mapTalkingSessionPerses = {};

        // console.log("~~~~~~~~~~ Q: " + quest.id + " ~~~~~~~~~~");

        for (let i=0; quest.rawLocalizationRows && i<quest.rawLocalizationRows.length; i++) {
            let row = quest.rawLocalizationRows[i];
            let pers = String(row.Comment).trim().toLowerCase();
            let comicsIcon = String(row.Description || "").trim();

            pers = nameAlias(pers);

            let id = String(row.id).trim();
            let talkType = id.replace(/(\w+).*/, "$1");
            if (!talkType) {
                UI.alertError(`Undefinded talkType of ${id}`)
            }
            
            if (lastTalkType != talkType) {
                if (talksArr.length > 0) {
                    talkingSessionPerses.sort((a,b)=>{ return a.order - b.order; });
                    JSONGenerator._addTalksBlock(strTalksArr, lastTalkType, talksArr, talkingSessionPerses, quest, nextQuestId);

                    if (strTalksArr.length) {
                        if (strTalks.length) strTalks += ",\n\n\n";
                        strTalks += strTalksArr.join(",\n\n");
                        strTalksArr = [];
                    }
                }
                if (talkType == "fade" || talkType == "fade2") { // reset comics actors after fade
                    _mapTalkingSessionPerses = {};
                    talkingSessionPerses = [];
                }
                talksArr = [];
                lastTalkType = talkType;
            }
            if (talkType == "idle") {
                mustArr.push({"id": id, "pers": pers, "ru": row.ru});
            } else {
                talksArr.push({"id": id, "pers": pers, "ru": row.ru, "comicsIcon": comicsIcon});
            }

            if (talkType == "quest" && !_mapTalkingSessionPerses[pers]) {
                _mapTalkingSessionPerses[pers] = true;
                talkingSessionPerses.push(_talkingPersesMap[pers]);
            }
        }

        if (talksArr.length > 0) {
            talkingSessionPerses.sort((a,b)=>{ return a.order - b.order; });
            JSONGenerator._addTalksBlock(strTalksArr, lastTalkType, talksArr, talkingSessionPerses, quest, nextQuestId);
            
            if (strTalksArr.length) {
                if (strTalks.length) strTalks += ",\n\n\n";
                strTalks += strTalksArr.join(",\n\n");
                strTalksArr = [];
            }
        }

        // console.log(" must A: " , mustArr);

        let strMustA = [];
        if (mustArr.length > 0) {
            JSONGenerator._addTalksBlock(strMustA, "idle", mustArr, null, quest, nextQuestId);
        }

        // add_idle_scenario lines
        let strAddIdles = "";
        if (!quest.coParents || quest.coParents.length == 1) {
            strAddIdles = replaces(TPL_MUSTA_SIMPLE, {"__!quest:id!__" : quest.id});
        } 
        else {
            let otherCoParentsIds = [];
            quest.coParents.sort();
            quest.coParents.forEach(id => {
                if (quest.id != id) {
                    otherCoParentsIds.push(id);
                }
            });
            let strSceneAfterId = quest.coParents.join(".");

            if (otherCoParentsIds.length == 1) {
                strAddIdles += replaces(TPL_START_SCENARIO_OR_IDLE, {
                    "__!action!__"     : "start_scenario",
                    "__!scenario!__"   : "quest." + strSceneAfterId,
                    "__!conditions!__" : tabs(JSONGenerator._generateConditions({ [otherCoParentsIds[0]]: true }), 1)
                });
                strAddIdles += "\n" + replaces(TPL_START_SCENARIO_OR_IDLE, {
                    "__!action!__"     : "add_idle_scenario",
                    "__!scenario!__"   : "quest." + quest.id + ".completed",
                    "__!conditions!__" : tabs(JSONGenerator._generateConditions({ [otherCoParentsIds[0]]: false }), 1)
                });
            }
            else if (otherCoParentsIds.length == 2) {
                strAddIdles += replaces(TPL_START_SCENARIO_OR_IDLE, {
                    "__!action!__"     : "start_scenario",
                    "__!scenario!__"   : "quest." + strSceneAfterId,
                    "__!conditions!__" : tabs(JSONGenerator._generateConditions({ [otherCoParentsIds[0]]: true, [otherCoParentsIds[1]]: true }), 1)
                });
                strAddIdles += "\n" + replaces(TPL_START_SCENARIO_OR_IDLE, {
                    "__!action!__"     : "add_idle_scenario",
                    "__!scenario!__"   : "quest." + quest.id + ".completed",
                    "__!conditions!__" : tabs(JSONGenerator._generateConditions({ [otherCoParentsIds[0]]: false, [otherCoParentsIds[1]]: false }), 1)
                });
                strAddIdles += "\n" + replaces(TPL_START_SCENARIO_OR_IDLE, {
                    "__!action!__"     : "add_idle_scenario",
                    "__!scenario!__"   : "quest." + quest.id + ".completed",
                    "__!conditions!__" : tabs(JSONGenerator._generateConditions({ [otherCoParentsIds[0]]: true, [otherCoParentsIds[1]]: false }), 1)
                });
                strAddIdles += "\n" + replaces(TPL_START_SCENARIO_OR_IDLE, {
                    "__!action!__"     : "add_idle_scenario",
                    "__!scenario!__"   : "quest." + quest.id + ".completed",
                    "__!conditions!__" : tabs(JSONGenerator._generateConditions({ [otherCoParentsIds[0]]: false, [otherCoParentsIds[1]]: true }), 1)
                });
            }
            else {
                UI.alertError("Can't handle add_idle_scenario for quest " + quest.id + ", check scene " + strSceneAfterId + " manually");
            }
        }

        // quest finish
        replacesParams = {
            "__!quest:id!__"  : replacesParams["__!quest:id!__"],
            "__!talks!__"     : tabs( strTalks + (strTalks.length > 0 ? ",\n\n" : "") , 2 ),
            "__!add_idles!__" : tabs( strAddIdles , 2 ),
            "__!must:a!__"    : tabs( strMustA.join(",\n") , 2 )
        };

        let txtEndQuest = replaces(TPL_QUEST_FINISH, replacesParams);
        txtEndQuest = tabs(txtEndQuest, 1);
        JSONGenerator.addBlock( txtEndQuest, BlockTypes.TEXT );
    }


    static _generateConditions(conditionsMap)
    {
        let arr = [];
        for (let qid in conditionsMap) {
            arr.push(
                replaces(TPL_SCENARIO_OR_IDLE_CONDITION, {
                    "__!qid!__"   : qid,
                    "__!state!__" : (conditionsMap[qid] ? "completed" : "not_completed")
                })
            );
        }
        return arr.join(",\n");
    }


    static _addTalksBlock(strTalksArr, talkType, talksArr, talkingPersonages, quest, nextQuestId)
    {
        // console.log(" talkins # " + talkType + ": " , talksArr);
        let isErrorAlerted = false;
        let lastTalker = null;
        let isTalkAnimationsOn = JSONGenerator.defaults["talk.animations"].value;
        let isComicsAnimationsOn = JSONGenerator.defaults["comics.animations"].value;
        
        for (let i=0; i<talksArr.length; i++)
        {
            let talk = talksArr[i];

            // talks
            if (talkType == "praise" || talkType == "idle")
            {
                let bubbleAnimation = (isTalkAnimationsOn 
                    ? (JSONGenerator.defaults["talk.animation." + talk.pers] && JSONGenerator.defaults["talk.animation." + talk.pers].value)
                    : null);
                let template = (bubbleAnimation ? TPL_TALK_EX : TPL_TALK);
                let str = replaces(template, {
                    "__!pers!__" : talk.pers,
                    "__!id!__" : talk.id,
                    "__!pers:talk:anim!__": bubbleAnimation
                });
                strTalksArr.push(str);
            }

            // comics
            else if (talkType == "quest")
            {
                let tplComicsPersesArr = [];
                for (let p=0; p<talkingPersonages.length; p++) {
                    let talkingPers = talkingPersonages[p];
                    let persIcon = talkingPers.icon;
                    if (talk.pers == talkingPers.name && talk.comicsIcon) {
                        persIcon = persIcon.substr(0, persIcon.indexOf("/")) + "/" + talk.comicsIcon;
                    }
                    let strComicsPers = replaces(TPL_COMICS_PERS, {
                        "__!pers!__"      : talkingPers.name,
                        "__!pers:icon!__" : persIcon,
                        "__!isspeak!__"   : (talk.pers == talkingPers.name ? "true" : "false")
                    });
                    tplComicsPersesArr.push(strComicsPers);
                }

                let template = (isComicsAnimationsOn ? TPL_COMICS_EX : TPL_COMICS);
                let strComicsAnimsArr = [];
                
                if (isComicsAnimationsOn) {
                    if (lastTalker != talk.pers)
                    {
                        // previous speaker -> idle
                        if (lastTalker && JSONGenerator.defaults["comics.animation." + lastTalker]) {
                            strComicsAnimsArr.push(replaces(TPL_COMICS_ANIM_IDLE, {
                                "__!tpl:pers!__" : lastTalker
                            }));
                        }
                        // new speaker -> talk
                        if (JSONGenerator.defaults["comics.animation." + talk.pers]) {
                            strComicsAnimsArr.push(replaces(TPL_COMICS_ANIM_TALK, {
                                "__!tpl:pers!__" : talk.pers
                            }));
                        }
                    }
                    // new speaker -> pre-talk animation
                    if (JSONGenerator.defaults["comics.animation." + talk.pers]) {
                        strComicsAnimsArr.push(replaces(TPL_COMICS_ANIM, {
                            "__!tpl:pers!__" : talk.pers,
                            "__!tpl:anim!__" : JSONGenerator.defaults["comics.animation." + talk.pers].value
                        }));
                    }
                }

                // quest icon
                let strShowQusetIcon = "";
                let strHideQusetIcon = "";
                if (talk.ru && talk.ru.indexOf("${font_color_green}") >= 0 && nextQuestId) {
                    let nextQID = 100500;
                    strHideQusetIcon = TPL_QUEST_ICON_HIDE;
                    strShowQusetIcon = replaces(TPL_QUEST_ICON, {"__!tpl:qid!__": nextQuestId});
                }

                let str = replaces(template, {
                    "__!id!__"                : talk.id,
                    "__!tpl:anims!__"         : tabs( strComicsAnimsArr.join(",\n"), 2 ),
                    "__!tpl:perses!__"        : tabs( tplComicsPersesArr.join(",\n"), 2 ),
                    "__!tpl:questicon!__"     : strShowQusetIcon,
                    "__!tpl:hidequesticon!__" : strHideQusetIcon
                });

                strTalksArr.push(str);
                lastTalker = talk.pers;
            }

            // fade
            else if (talkType == "fade" || talkType == "fade2")
            {
                let str = replaces(TPL_FADE, {
                    "__!id!__" : talk.id
                });
                strTalksArr.push(str);
            }

            // ???
            else if (!isErrorAlerted) 
            {
                isErrorAlerted = true;
                UI.alertError(`Unknown type of talk ${talkType} in '${talk.id}' in quest ${quest.id}, ru = ${talk.ru}, check column "id" to be filled correctly!`);
            }
        }

        if (talkType == "quest")
        {
            if (isComicsAnimationsOn) {
                // last speaker -> idle
                if (lastTalker && JSONGenerator.defaults["comics.animation." + lastTalker]) {
                    strTalksArr.push(replaces(TPL_COMICS_ANIM_IDLE, {
                        "__!tpl:pers!__" : lastTalker
                    }));
                }
            }
            strTalksArr.push(TPL_COMICS_CLOSE);
        }
    }


    static addBlock(text, type, options)
    {
        let block = {};
        block.text = text.replace(/^\s+?$/gm, "");
        block.type = type || BlockTypes.TEXT;
        if (options) {
            for (const key in options) {
                block[key] = options[key];
            }
        }
        
        JSONGenerator.blocks.push(block);
        return block;
    }
}


function tabs(str, n)
{
    let t = "";
    while (n-->0) t = t + "    ";
    return t + str.replace(/\n/g, "\n" + t);
}

function replaces(str, params)
{
    for (let key in params) {
        let val = params[key];
        var re = new RegExp(key, 'g');
        str = str.replace(re, val);
    }
    return str;
}



const TPL_TALK =
`{ "action": "talk", "personage": "__!pers!__", "text_id": "__!id!__" }`;

const TPL_TALK_EX =
`{ "scenario": "parallel", "actions" : [
    { "action": "play_model_animation", "personage": "__!pers!__", "name": "__!pers:talk:anim!__"},
    { "action": "talk", "personage": "__!pers!__", "text_id": "__!id!__" }
]}`;


const TPL_COMICS =
`{ "scenario": "parallel", "actions" : [__!tpl:questicon!__
    { "action": "show_comics", "text_id": "__!id!__", "personages": [
__!tpl:perses!__
    ]__!tpl:hidequesticon!__}
]}`;


const TPL_COMICS_EX =
`{ "scenario": "parallel", "actions" : [__!tpl:questicon!__
    { "scenario": "sequence", "actions" : [
__!tpl:anims!__
    ]},
    { "action": "show_comics", "text_id": "__!id!__", "personages": [
__!tpl:perses!__
    ]__!tpl:hidequesticon!__}
]}`;

const TPL_QUEST_ICON = `
    { "action": "show_quest_icon", "quest_id": __!tpl:qid!__ },`;

const TPL_QUEST_ICON_HIDE = `, "hide_quest_icon": true`;


const TPL_COMICS_ANIM_IDLE = `{ "action": "set_idle_animation", "personage": "__!tpl:pers!__", "name": "idle", "force_play": true }`;

const TPL_COMICS_ANIM_TALK = `{ "action": "set_idle_animation", "personage": "__!tpl:pers!__", "name": "talk" }`;

const TPL_COMICS_ANIM = `{ "action": "play_model_animation", "personage": "__!tpl:pers!__", "name": "__!tpl:anim!__" }`;



const TPL_COMICS_PERS =
`{ "name":"__!pers!__", "speaker":__!isspeak!__, "icon":"__!pers:icon!__" }`;


const TPL_COMICS_CLOSE =
`
{ "action": "close_comics" }`;


const TPL_FADE =
`{ "scenario": "parallel", "animation_script": "cut_scene.anim.fade_scene_in_out", "anim_config": {"text": "__!id!__"}, "actions" : [
    // TODO: экшены во время затемнения тут
]}`;



const TPL_DAY_START = '[';


const TPL_QUEST_START =
`{
    "name": "quest.__!quest:id!__", // __!quest:title!__
    "type": "__!questblock:type!__",
    "actions": [
        { "scenario": "parallel", "actions" : [__!quest:1st!__
            { "action": "lock_scene", "show_background": true },
            { "action": "zoom_camera", "zoom": 1.15, "time": 1, "transition": "easeout"},
            { "action": "move_camera_fast", "position": {"x":__!defaults:camera:x!__, "y":__!defaults:camera:y!__}, "time": 1}__!startblock:prefix!__
__!personages:setidle!__
__!personages:startpositions!__
__!personages:looks!__
        ]},

        { "action": "wait_modals_close" },
`;

const TPL_QUEST_FINISH = `
__!talks!__
        // { "action": "wait_seconds", "seconds": 9999 },

__!add_idles!__

        { "action": "unlock_scene" }
    ]
},

{
    "name": "quest.__!quest:id!__.completed",
    "type": "quest_idle",
    "actions": [
__!must:a!__
    ]
},
`;

const TPL_MUSTA_SIMPLE = `{ "action": "add_idle_scenario", "scenario_name": "quest.__!quest:id!__.completed" },`;


const TPL_START_SCENARIO_OR_IDLE =
`{ "action": "__!action!__", "scenario_name": "__!scenario!__", "condition": [
__!conditions!__
]},
`;


const TPL_SCENARIO_OR_IDLE_CONDITION = `{ "type": "quest", "quest_id": __!qid!__, "state": "__!state!__" }`;


const TPL_OPEN_LOCATION =
`
{ "action": "open_location", "area": "__!day!__" },`;


const TPL_PERS_SET_POS =
`{ "action": "set_position", "personage": "__!pers:name!__", "position": {"x":__!pos:x!__, "y":__!pos:y!__} }`;


const TPL_PERS_LOOK =
`{ "action": "look", "personage": "__!pers:name!__", "at": "E", "animate": false }`;


const TPL_PERS_IDLE =
`{ "action": "set_idle_animation", "personage": "__!pers:name!__", "name": "idle", "force_play": true, "mix_time": 0 }`;


const TPL_DAY_END = `
    {
        "name": "complete.episode.__!episode_id!__",
        "type": "episode_finish",
        "actions": [
            { "action": "wait_modals_close" },
            { "action": "show_stay_with_us"}, // Окно "оставайтесь с нами"
            { "action": "wait_modals_close" },
            { "action": "unlock_scene" },
            { "action": "add_idle_scenario", "scenario_name": "episode.__!episode_id!__.completed" }
        ]
    },

    {
        "name": "episode.__!episode_id!__.completed",
        "type": "quest_idle",
        "actions": [
        ]
    }
]
`;

