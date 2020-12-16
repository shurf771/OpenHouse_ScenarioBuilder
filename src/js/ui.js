class UI
{
    static configureUI() {
        // global keys
        $(document).keydown(function(e) {
            console.log(e);
            if (e.key == "F5") {
                btnReload_click();
            }
        });

        // buttons
        $(".btn").click(function(e) {
            let btn = $(e.currentTarget);
            var attr = btn.attr("shu-onclick");
            if (attr && window[attr]) {
                var paramsattr = btn.attr("shu-onclick-params");
                if (paramsattr) {
                    window[attr](paramsattr);
                } else {
                    window[attr]();
                }
            } else {
                UI.alertError(`can't find function '${attr}' for this button click`);
            }
        });

        $("#txtDataPath").change(function(e) {
            DataReader.checkPath();
        });

        // text-inputs init values
        UI.loadLocalStorageText(null);

        // toggle alerts
        $("#alertsStatus").click(function() {
            $("#alerts .alert").toggle();
        });

        // toggle settings
        $("#defaultSettingHeader").click(function() {
            $("#defaultSettingContainer").toggle();
            $("#defaultSettingFoot").toggle();
        });

        // toggle contents visible
        UI.contentsToggle(false);
        $("#contentsButton").click(function(){
            UI.contentsToggle(true);
        });

        // contents buttons init
        $("#contents p").click(UI.contentsItemClicked);
    }

    // enable / disable all buttons
    static enableButtons(ids, selector, isEnabled)
    {
        if (!ids) {
            if (!selector) {
                selector = "button";
            }
            if (isEnabled) {
                $(selector).removeAttr("disabled");
            }
            else {
                $(selector).attr("disabled", "disabled");
            }
        }
        else {
            ids.forEach((id) => {
                if (isEnabled) {
                    $("#"+id).removeAttr("disabled");
                }
                else {
                    $("#"+id).attr("disabled", "disabled");
                }
            });
        }
    }


    // LocalStorageText - load all or passed textboxes from storage
    static loadLocalStorageText(ids, forceDefault)
    {
        let mapResult = {};
        if (!ids) {
            ids = UI._getAllElementsIDs(".localStorageText");
        }

        for (let index = 0; index < ids.length; index++) {
            const id = ids[index];
            let domText = $("#"+id);
            let defValue = domText.attr("shu-default") || "";
            let val = (forceDefault ? defValue : (localStorage.getItem(id) || defValue));
            domText.val(val);
            mapResult[id] = val;
        }
        return mapResult;
    }

    
    // LocalStorageText - save all or passed textboxes to storage
    static saveLocalStorageText(ids)
    {
        if (!ids) {
            ids = UI._getAllElementsIDs(".localStorageText");
        }

        for (let index = 0; index < ids.length; index++) {
            const id = ids[index];
            let domText = $("#"+id);
            let val = domText.val().trim();
            localStorage.setItem(id, val);
        }
    }


    static _getAllElementsIDs(selector)
    {
        let ids = [];
        let allElements = $(selector);
        for (let index = 0; index < allElements.length; index++) {
            const element = allElements[index];
            ids.push( $(element).attr("id") );
        }
        return ids;
    }


    // show X-step <section> and hide others
    static step(x)
    {
        $(".step").hide();
        $(".step"+x).show();
    }


    // change header with text
    static initStatus(text) {
        if (!UI._hStatusTick) {
            UI._hStatusTick = setInterval(UI._initStatusTick, 200);
            UI._statusStack = [];
        }
        UI._statusStack.push(text);
    }

    // change header with text
    static _initStatusTick() {
        if (UI._statusStack && UI._statusStack.length)
        {
            let text = UI._statusStack.shift();
            $("#alertsStatus").text(text);
        }
    }

    static alertError(message) {
        UI.alert("alert-danger", message);
        console.error(message);
    }

    // add alert into "log container"
    static alert(level, message) {
        let domAlert = $("<div />");
        domAlert.addClass("alert");
        domAlert.addClass(level);
        domAlert.attr("role", "alert");
        domAlert.text(message);
        $("#alerts").append(domAlert);
    }

    static clearAlerts() {
        $("#alerts .alert").remove();
    }


    // generate days-pick buttons
    static daysPickerGenerate(days) 
    {
        let domContainer = $("#pickDaysContainer");
        domContainer.html("");

        for (let i=0; i<days.length; i++)
        {
            const day = days[i];
            let domButton = $('<button class="bg-teal btn margnied"></button>');
            domButton.attr("shu-location", day.location);
            domButton.attr("shu-id", day.id);
            domButton.text(day.location);
            domButton.bind("click", btnPickDay_click );
            
            domContainer.append(domButton);
        }
    }


    static currentDay(title, id) 
    {
        $("#curDayTitle").html(`${title} <small>(episode_id = ${id})</small>`);
        $("#lblStep3DownloadDay").text( trainlingChars(String(id), 2, "0", "") );
    }


    static questsGenerate(blocks) 
    {
        let domContainer = $("#questsContainer");
        domContainer.empty();

        UI.clearContentsCurDay();

        for (let i = 0; i < blocks.length; i++) 
        {
            const block = blocks[i];
            switch (block.type)
            {
                case BlockTypes.HEADER:
                    UI._questGenerateHeader(block, domContainer);
                    break;
                case BlockTypes.TEXT:
                    UI._questGenerateText(block, domContainer);
                    break;
                case BlockTypes.DAY_END:
                    UI._questGenerateEpisodeEnd(block, domContainer);
                    break;
            }
        }
    }

    static _questGenerateHeader(block, domParent) 
    {
        let alertClass = (block.is_quest_group_complete ? "alert-warning" : "alert-info");
        let htmlHeader = 
            `<div class="alert alert-json-header ${alertClass}" role="alert">
                <strong></strong> <span><span>
            </div>`;
        let domHeader = $(htmlHeader);
        domHeader.children("strong").text( block.id );
        domHeader.children("span").text( block.title );

        let id = "curday-header-" + block.id;
        id = id.replace(/\./g, "-");
        domHeader.attr("id", id);
        
        domParent.append(domHeader);

        UI.addContentsCurDayItem( block.id + " - " + block.title, "#"+id );
    }

    static _questGenerateText(block, domParent) 
    {
        let domPre = $('<pre></pre>');
        domPre.addClass("json");
        domPre.addClass("jsonPre");
        domPre.text(block.text);

        hljs.highlightBlock(domPre[0]);
        
        domParent.append(domPre);
    }

    static _questGenerateEpisodeEnd(block, domParent) 
    {
        let htmlHeader = 
            `<div class="alert alert-json-header alert-warning" role="alert">
                Конец эпизода
            </div>`;
        let domHeader = $(htmlHeader);
        domParent.append(domHeader);

        UI._questGenerateText(block, domParent);
    }


    // show/hide contetns div
    static contentsToggle(invert) {
        let isContentsHide = (localStorage.getItem("contentsHide") == "true");
        if (invert) {
            isContentsHide = !isContentsHide;
            localStorage.setItem("contentsHide", isContentsHide);
        }

        if (isContentsHide) {
            $("#contents").hide();
            $("#contentsButtonText").text("<<");
        } else {
            $("#contents").show();
            $("#contentsButtonText").text(">>");
        }
    }

    // clicked <p> in #contents
    static contentsItemClicked() {
        let attrGoto = $(this).attr("shu-goto");
        $('html, body').animate({
            scrollTop: $(attrGoto).offset().top
        }, 50);
    }

    static clearContentsCurDay() {
        $("#contentsCurDay").empty();
    }

    static addContentsCurDayItem(name, gotoAttr) {
        let domItem = $("<p></p>");
        domItem.attr("shu-goto", gotoAttr);
        domItem.text(name);
        domItem.click(UI.contentsItemClicked);
        $("#contentsCurDay").append(domItem);
    }
}