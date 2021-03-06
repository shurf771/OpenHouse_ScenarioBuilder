// --------------------------------------------------------
//  Global UI callbacks
// --------------------------------------------------------

// --- common ---

function btnReload_click()
{
    location.reload();
}

function btnDevTools_click()
{
    require('nw.gui').Window.get().showDevTools();
}

function btnClearAlerts_click()
{
    UI.clearAlerts();
}

function btnShuJSON_click()
{
    DataReader.readDayScenarioText(13, function(text) {
        ShuJSON.setDefaultKeysOrder([ "action", "name", "type", "scenario", "actions", "text_id" ]);

        let obj = ShuJSON.decode( text );
        console.log( obj );

        let str = ShuJSON.encode( obj );
        console.log( str );
        $("#TMPPRE").text( str );
    });
}


// --- step 1 ---

function btnM3LocalizationURLReset_click()
{
    UI.loadLocalStorageText( ["txtM3LocalizationURL"], true );
    UI.saveLocalStorageText( ["txtM3LocalizationURL"] );
}

function btnM3QuestsURLReset_click()
{
    UI.loadLocalStorageText( ["txtM3QuestsURL"], true );
    UI.saveLocalStorageText( ["txtM3QuestsURL"] );
}

function btnDataPathBrowse_click()
{
    let fileDialog = $("#browsePathDialog");
    fileDialog.unbind('change');
    fileDialog.change(function(e) {
        let filePath = $(this).val();
        $("#txtDataPath").val( filePath );
        UI.saveLocalStorageText( ["txtDataPath"] );
        DataReader.checkPath();
    });
    fileDialog.trigger('click');  
}


function btnStep1Load_click()
{
    step1LoadSpreadsheets(true);
}

function btnStep1LoadNoCache_click()
{
    step1LoadSpreadsheets(false);
}


// --- step 2 ---

function btnPickDay_click(e)
{
    let domBtn = $(e.currentTarget);
    let dayObj = {
        "location" : domBtn.attr("shu-location"),
        "id"       : domBtn.attr("shu-id")
    };
    step2PickDay(dayObj);
}


// --- step 3 ---

function btnStep3Back_click()
{
    gotoStep2();
}

function btnStep3Compare_click()
{
    CompareScenarios.compare();
}

function btnCompareAgainDownload_click()
{
    CompareScenarios.compareAgain(true);
}

function btnCompareAgain_click()
{
    CompareScenarios.compareAgain(false);
}

function btnDefaultsSave_click()
{
    UIDefaults.saveSettings();
    step3Prepare();
}

function btnDefaultsReset_click()
{
    UIDefaults.resetSettings();
}

function btnStep3Download_click()
{
    step3Download();
}

function btnStep3Copy_click()
{
    step3CopyToBuffer();
}

// --- bonus 1 ---


function btnAutoCopyStart_click()
{
    FilesWatcher.tryStart();
}

function btnAutoCopyStop_click()
{
    FilesWatcher.tryStop();
}

// --- bonus 2 ---


function btnPSDPngsMoveSrcPathBrowse_click()
{
    let fileDialog = $("#browsePSDPngsMoveSrcPathDialog");
    fileDialog.unbind('change');
    fileDialog.change(function(e) {
        let filePath = $(this).val();
        $("#txtPSDPngsMoveSrcPath").val( filePath );
        UI.saveLocalStorageText( ["txtPSDPngsMoveSrcPath"] );
    });
    fileDialog.trigger('click');  
}

function btnPSDPngsMove_click()
{
    PsdPngMover.execute();
}

// --- bonus 3 ---

function btnOpenHouseEmotionsSrcPathBrowse_click()
{
    let fileDialog = $("#browseOpenHouseEmotionsSrcPathDialog");
    fileDialog.unbind('change');
    fileDialog.change(function(e) {
        let filePath = $(this).val();
        $("#txtOpenHouseEmotionsSrcPath").val( filePath );
        UI.saveLocalStorageText( ["txtOpenHouseEmotionsSrcPath"] );
    });
    fileDialog.trigger('click');  
}

function btnOpenHouseEmotionsUpdate_click()
{
    Emotions.updateOpenHouseEmotionsTool();
}

function btnEmotionsUpdate_click()
{
    Emotions.updateDayJson(true);
}

function btnEmotionsUpdateDownload_click()
{
    Emotions.updateDayJson(false);
}

// --- bonus 4 ---

function btnGenerateComicsIconsPositiobs_click()
{
    CodeGenerator.copyComicsEmotionsPositions();
}

// --- bonus 5 ---

function btnGenerateQuestConfigGenerate_click()
{
    CodeGenerator.questConfigGenerate();
}

function btnGenerateQuestConfigCopy_click()
{
    CodeGenerator.questConfigCopy();
}

function btnGenerateQuestConfigClear_click()
{
    CodeGenerator.questConfigClear();
}