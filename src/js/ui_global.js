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

function btnPresetApply_click()
{
    UIDefaults.presetApply();
}

function btnPresetEdit_click()
{
    // Open a text file with default text editor.
    nw.Shell.openItem("presets.json");
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

// --- bonus 2.1 ---

function btnMoveDayVisualsNew_click()
{
    CodeGenerator.copyVisualsNew();
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

function btnDeleteAnimationsFromVisualNew_click()
{
    CodeGenerator.deleteVisualsNewThatHaveAnimations();
}

// --- bonus 6 ---


function btnGenerateSnippetsGenerate_click()
{
    CodeGenerator.snippetsGenerate();
}

function btnenerateSnippetsCopy_click()
{
    CodeGenerator.snippetsCopy();
}

function btnGenerateSnippetsClear_click()
{
    CodeGenerator.snippetsClear();
}


// --- bonus 7 ---


function btnLocalReuseRefreshCombobox_click()
{
    let dom_localReuseSheetTarget = $("#localReuseSheetTarget");
    let dom_localReuseSheetSource = $("#localReuseSheetSource");
    let arrSheetNames = state?.m3localization?.SheetNames;
    if (!arrSheetNames) {
        console.error("Localization table is not loaded");
        return;
    }
    dom_localReuseSheetTarget.empty();
    dom_localReuseSheetSource.empty();
    for (let i=0; i<arrSheetNames.length; i++) {
        let strSheet = arrSheetNames[i];
        dom_localReuseSheetTarget.append( $("<option>").val(strSheet).text(strSheet) );
        dom_localReuseSheetSource.append( $("<option>").val(strSheet).text(strSheet) );
    }
}


function btnLocalReuseStart_click()
{
    XLSXReader.reuseLocalizationStart();
}


function btnLocalReuseCopyClipboard_click()
{
    let s = $("#txtLocalReuseResult").val();
    let clipboard = nw.Clipboard.get();
    clipboard.set(s, 'text');
}