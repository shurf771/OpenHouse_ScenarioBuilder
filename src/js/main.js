let state = {};

let spreadSheets = [
    {
        "type"      : "m3quests",
        "textInput" : "txtM3QuestsURL",
        "cacheFile" : "./../cache/m3quests.xlsx",
    },
    {
        "type"      : "m3localization",
        "textInput" : "txtM3LocalizationURL",
        "cacheFile" : "./../cache/m3localization.xlsx",
    }
];


document.addEventListener("DOMContentLoaded", function() {
    start();
});


// =====================  APP Entry Point  =====================

function start()
{
    state.step = 0;

    UIDefaults.init(state);
    UI.configureUI();
    gotoStep1();

    //OHGameData = require("oh_gamedata"); // TODO: remove modules, work with simple *.js
    //OHGameData.init(OHGameData_initCompleted);
}


// =====================  Step 1 : Load Days  =====================

function gotoStep1()
{
    state.step = 1;
    state.cacheFilesExist = 0;
    state.jsons = null;

    UI.step(state.step);
    UI.initStatus("Шаг 1. Загрузка гугл-доков");

    refreshCacheStatus();
}

function refreshCacheStatus() {
    let domCacheTimes = $(".cacheTime");
    for (let index = 0; index < domCacheTimes.length; index++) {
        const domCacheTime = domCacheTimes[index];
        let file = $(domCacheTime).attr("shu-file");
        let id = $(domCacheTime).attr("id");
        Loader.getFileInfo( file, cacheStatus_callback, {"id": id} );
    }
}


function cacheStatus_callback(status, userParams)
{
    console.log(userParams.id, status, userParams);
    if (status) {
        let mtime = Math.max(status.birthtimeMs, status.mtimeMs);
        let str = Time.formatTimeDiff((new Date()).getTime(), mtime, true);
        $("#"+userParams.id).text(str + " назад");
        state.cacheFilesExist++;
    }
    else {
        $("#"+userParams.id).text("нету");
    }
}


function step1LoadSpreadsheets(useCache)
{
    state.loadingSpreadsheets = spreadSheets.length;
    state.loadingSpreadsheetsRemain = spreadSheets.length;

    UI.saveLocalStorageText(null);
    UI.initStatus("Шаг 1. Скачиваю гугл-доки...");
    
    let mapFiles = UI.loadLocalStorageText(null);
    console.log( mapFiles );

    UI.enableButtons(null, ".workButton", false); // diable all buttons

    if (!useCache || state.cacheFilesExist < spreadSheets.length)
    {
        spreadSheets.forEach((spreadSheet) => {
            Loader.downloadFile(mapFiles[spreadSheet.textInput], spreadSheet.cacheFile, step1LoadSpreadsheets_complete);
        });

        UI.initStatus("Шаг 1. Скачиваю гугл-доки... " 
                    + (state.loadingSpreadsheets-state.loadingSpreadsheetsRemain) 
                    + "/" + state.loadingSpreadsheets);
    }
    else 
    {
        step1ParseSpreadsheets();
    }
}


function step1LoadSpreadsheets_complete()
{
    state.loadingSpreadsheetsRemain--;

    UI.initStatus("Шаг 1. Скачиваю гугл-доки... " 
                + (state.loadingSpreadsheets-state.loadingSpreadsheetsRemain) 
                + "/" + state.loadingSpreadsheets);
    refreshCacheStatus();

    if (state.loadingSpreadsheetsRemain <= 0)
    {
        step1ParseSpreadsheets();
    }
}


function step1ParseSpreadsheets()
{
    console.log("step1ParseSpreadsheets");

    state.parsingSpreadsheets = spreadSheets.length;
    state.parsingSpreadsheetsRemain = spreadSheets.length;

    UI.initStatus("Шаг 1. Читаю гугл-доки...");

    spreadSheets.forEach((spreadSheet) => {
        Loader.loadXLSX(spreadSheet.cacheFile, step1ParseSpreadsheets_itemComplete, {"type": spreadSheet.type});
    });
}


function step1ParseSpreadsheets_itemComplete(workbook, userParams)
{
    state[userParams.type] = workbook;

    state.parsingSpreadsheetsRemain--;

    UI.initStatus("Шаг 1. Читаю гугл-доки... " 
        + (state.parsingSpreadsheets-state.parsingSpreadsheetsRemain) 
        + "/" + state.parsingSpreadsheets);

    if (state.parsingSpreadsheetsRemain <= 0)
    {
        //console.log("step1ParseSpreadsheets_itemComplete", state);

        UI.initStatus("Шаг 1. Готово!");
        UI.enableButtons(null, ".workButton", true); // enable all buttons
        
        if (state.reloadAllCallback) 
        {
            step2ClearCurDayJsonCache();
            step3Prepare();
        }
        else {
            gotoStep2();
        }
    }    
}


// =====================  Step 2 : Pick Day  =====================


function gotoStep2()
{
    state.step = 2;

    UI.step(state.step);
    UI.initStatus("Шаг 2. Выбор дня");

    refreshAvailableDays();
}


function refreshAvailableDays()
{
    let days = XLSXReader.getDays(state);
    state.days = days;
    console.log("days:", days);

    UI.daysPickerGenerate(state.days);

    // нет доступа ?
    if (days.length == 0) {
        if (window.confirm("Ошибка. В таблице m3:quests не найдено дней. Возможно ссылка неправильная, или на ней поставилено ограничение доступа. "
                + "Нажми ОК, чтобы перейти на страницу и может быть залогиниться там."
                + "\n\nЕсли скачается успешно, то новое окошко надо закрыть, а основное перезагрузить (F5)"
                + "\n\nЕсли после рестарта, тоже самое, то скачай руками и закинь в папку cache под именами m3quests.xlsx и m3localization.xlsx"
            )) 
        {
            let mapFiles = UI.loadLocalStorageText(null);
            let url = "";
            spreadSheets.forEach((spreadSheet) => {
                if (spreadSheet.type == "m3quests") {
                    url = mapFiles[spreadSheet.textInput];
                }
            });

            window.open(url);
        }
    }
}


function step2PickDay(dayObj)
{
    console.log("step2PickDay:", dayObj);

    state.curDayId    = parseInt(dayObj.id);
    state.curDayTitle = dayObj.location.replace('day', 'D');

    step2ClearCurDayJsonCache();

    gotoStep3();
}


function step2ClearCurDayJsonCache() {
    if (state.jsons && state.jsons.jsonLocalization)
        state.jsons.jsonLocalization = null;
}



// =====================  Step 3 : Pre-Generate  =====================


function gotoStep3()
{
    state.step = 3;

    UI.step(state.step);

    UI.currentDay(state.curDayTitle, state.curDayId);

    step3Prepare();
}


function step3Prepare()
{
    UI.initStatus("Шаг 3. Генерация JSON, постнастройка");

    state.quests = XLSXReader.getQuestsByDay(state, state.curDayId);
    state.blocks = JSONGenerator.generate(state.quests, UIDefaults.data);

    //console.log("blocks:", state.blocks);

    step3GenerateBlocks();
}


function step3GenerateBlocks()
{
    UI.questsGenerate(state.blocks);
    if (state.reloadAllCallback) {
        state.reloadAllCallback();
    }
}


function step3CopyToBuffer()
{
    let json = _generateFinalJSON();
    
    let clipboard = nw.Clipboard.get();
    clipboard.set(json, 'text');

    UI.initStatus("Шаг 3. Скопировано!");
    setTimeout(UI.initStatus, 1000, "Шаг 3. Генерация JSON, постнастройка");
}


function step3Download()
{
    let json = _generateFinalJSON();
    let strEpNum = (state.curDayId < 10 ? "0" : "") + state.curDayId;
    let fileDialog = $("#fileDialog");
    fileDialog.attr("nwsaveas", `scenarios_ep${strEpNum}.json`);
    fileDialog.unbind('change');
    fileDialog.change(function(e) {
        let filePath = $(this).val();
        console.log("filePath:", filePath);
        Loader.saveFile(filePath, json, () => {
            UI.initStatus("Шаг 3. Сохранено!");
            setTimeout(UI.initStatus, 1000, "Шаг 3. Генерация JSON, постнастройка");
        });
    });
    fileDialog.trigger('click');  
}


function _generateFinalJSON()
{
    let str = "";
    if (state.blocks) {
        for (let i=0; i<state.blocks.length; i++) {
            let block = state.blocks[i];
            str = str + block.text + "\n";
        }
    }
    return str;
}