class CompareScenarios
{
    static _data = {};
    static _preLog = null;
    static _curHeaderDiv = null;
    static _hiddens = {};

    static _aliases = {
        "пруд"          : "day13_pond",
        "duck"          : "day13_pond",
        "sarah_monitor" : "day1_work_zone"
    };


    static compare() 
    {
        state.reloadAllCallback = null;
        CompareScenarios.showClear();

        if (!state.curDayId) {
            UI.alertError("Текущий день не определен");
            return;
        }
        
        let newJsonStr = _generateFinalJSON();
        newJsonStr = newJsonStr.replace(/\/\/.*/g, ""); // remove comments from json
        try {
            CompareScenarios._data.jsonNew = JSON.parse(newJsonStr);
        }
        catch (err) {
            console.log("compare ERROR json parsing: ", err);
        }

        DataReader.readDayScenarioJson(state.curDayId, CompareScenarios._curJson_loaded);
    }


    static compareAgain(downloadLocalization) 
    {
        CompareScenarios.showClear();

        if (downloadLocalization) {
            state.reloadAllCallback = CompareScenarios.compare;
            step1LoadSpreadsheets(false);
        } 
        else {
            CompareScenarios.compare();
        }
    }


    static _curJson_loaded(json) 
    {
        CompareScenarios._data.jsonCur = json;
        console.log("jsons: ", CompareScenarios._data);

        $("#comparePath").text( DataReader.dayScenarioFilePath );
        
        CompareScenarios._preLog = $("#compareRoot");
        CompareScenarios._curHeaderDiv = null;

        let jsonOld = CompareScenarios._data.jsonCur;
        let jsonNew = CompareScenarios._data.jsonNew;

        for (let i=0; i<jsonNew.length; i++)
        {
          let newQuest = jsonNew[i];
          let oldQuest = null;
  
          for (let j=0; j<jsonOld.length; j++) {
            if (jsonOld[j].name == newQuest.name) {
              oldQuest = jsonOld[j];
              break;
            }
          }
  
          CompareScenarios._compare(newQuest, oldQuest);
        }

        CompareScenarios._initListeners();
    }


    static _initListeners()
    {
        let domHeaders = $(".compHeader");

        domHeaders.click(function(){
            let h = $(this).attr("shu-header");
            let div = $(`div[shu-header=${h}]`);
            if (div.hasClass("hidden")) {
                div.removeClass("hidden");
                CompareScenarios._hiddens[h] = false;
            } else {
                div.addClass("hidden");
                CompareScenarios._hiddens[h] = true;
            }
        });

        for (const h in CompareScenarios._hiddens) {
            if (CompareScenarios._hiddens[h]) {
                $(`div[shu-header=${h}]`).addClass("hidden");
            }
        }

        $("#compareRoot p b").click(function(){
            let clipboard = nw.Clipboard.get();
            clipboard.set($(this).text(), 'text');
        });
    }


    static _compare(newQuest, oldQuest)
    {
      if (!oldQuest) {
        CompareScenarios._logHeader(newQuest.name);
        CompareScenarios._logError("Новый квест!");
        return;
      }

      let headerAdded = false;
      function header() {
        if (!headerAdded) {
            CompareScenarios._logHeader(newQuest.name);
            headerAdded = true;
        }
      }

      let newTalksArr = [];
      let oldTalksArr = [];
      let newTalksMap = {};
      let oldTalksMap = {};

      let errorsInOldTalks = [];
      let errorsInNewTalks = [];

      CompareScenarios._getAllTalksRecursive(newQuest, newTalksArr, newTalksMap, null, errorsInNewTalks);
      CompareScenarios._getAllTalksRecursive(oldQuest, oldTalksArr, oldTalksMap, errorsInOldTalks, errorsInNewTalks);

      //console.log("~~~~~~~~~~~~~  Q :" + newQuest.name + "  ~~~~~~~~~~~~~");

      //console.log("oldTalksMap:", oldTalksMap);
      //console.log("newTalksMap:", newTalksMap);

      if (errorsInNewTalks.length > 0) {
        console.log("errorsInNewTalks:", errorsInNewTalks);
        header();
        CompareScenarios._logErrors(errorsInNewTalks);
      }

      if (errorsInOldTalks.length > 0) {
        console.log("errorsInOldTalks:", errorsInOldTalks);
        header();
        CompareScenarios._logErrors(errorsInOldTalks);
      }

      for (let qi=0; qi<oldTalksArr.length; qi++)
      {
        let talkOld = oldTalksArr[qi];
        let talkNew = newTalksMap[talkOld.text_id];

        if (!talkNew) {
          header();
          CompareScenarios._logOldTalksRedundant(talkOld);
        }
      }

      for (let qi=0; qi<newTalksArr.length; qi++)
      {
        let talkNew = newTalksArr[qi];
        let talkOld = oldTalksMap[talkNew.text_id];

        if (!talkOld) {
          header();
          CompareScenarios._logNewTalksMissing(talkNew);
        }
        else {
          let oldPers = String( talkOld.personage || talkOld.map_object ).trim();
          let newPers = CompareScenarios._alias( String( talkNew.personage ).trim() );

          if (newPers != oldPers) {
            header();
            CompareScenarios._logInvalidPersonage(talkNew.text_id, newPers, oldPers);
          }
        }
      }
    }

    static _getAllTalksRecursive(json, arrDest, mapDest, errorsArr, googleDocErrorsArr) 
    {
        if (Array.isArray(json)) {
            for (let i=0; i<json.length; i++) {
                CompareScenarios._getAllTalksRecursive( json[i], arrDest, mapDest, errorsArr, googleDocErrorsArr );
            }
            return;
        }

        if (json.action == "show_comics") 
        {
            let text_id = json.text_id;
            if (mapDest[text_id]) {
                if (googleDocErrorsArr) {
                    googleDocErrorsArr.push(`повторное использование ключа <b>${text_id}</b>`);
                }
            }

            mapDest[ text_id ] = json;
            arrDest.push( json );

            if (json.personages && json.personages.length > 0) {
                json.personages.forEach(personage => {
                    if (personage.speaker) {
                        if (json.personage && errorsArr) {
                            if (errorsArr) errorsArr.push(`два говорящих одновременно персонажа в show_comics для фразы <b>${text_id}</b>`);
                        }
                        json.personage = personage.name;
                    }
                });
                if (!json.personage && errorsArr) {
                    if (errorsArr) errorsArr.push(`не указан говорящий персонаж в show_comics для фразы <b>${text_id}</b>`);
                }
            } else {
                if (errorsArr) errorsArr.push(`пустой show_comics.personages для фразы <b>${text_id}</b>`);
            }
        }

        else if (json.action == "talk") 
        {
            let text_id = json.text_id;
            mapDest[ text_id ] = json;
            arrDest.push( json );
        }

        else if (json.action == "show_messenger") 
        {
            let photo = null;
            if (json.personages && json.personages.length > 0) {
                json.personages.forEach(personage => {
                    if (personage.text_id) {
                        if (json.personage && errorsArr) {
                            if (errorsArr) errorsArr.push(`два говорящих одновременно персонажа в show_messenger для фразы <b>${text_id}</b>`);
                        }
                        json.personage = personage.name;
                        json.text_id = personage.text_id;
                    }
                    else if (personage.photo) {
                        photo = personage.photo;
                    }
                });
                if (!photo && !json.personage && errorsArr) {
                    if (errorsArr) errorsArr.push(`не указан говорящий персонаж в show_messenger`);
                }
            } else {
                if (errorsArr) errorsArr.push(`пустой show_messenger.personages`);
            }

            if (json.text_id && json.personage)
            {
                mapDest[ json.text_id ] = json;
                arrDest.push( json );
            }
        }

        else if (json.actions && Array.isArray(json.actions)) 
        {
            CompareScenarios._getAllTalksRecursive( json.actions, arrDest, mapDest, errorsArr, googleDocErrorsArr );
        }
    }

    static _questName(code) {
        let m = code.match(/\d+(\.\d+)?/);
        if (m) {
            let id = m[0];
            for (let q=0; q<state.quests.length; q++) {
                let quest = state.quests[q];
                if (quest.id == id)
                    return " - " + quest.title;
            }
        }
        return "";
    }


    static _logHeader(msg) {
        let h = msg.replace(/\W/g, "");
        let dom = $(`<h4 class="compHeader"></h4>`);
        dom.text(msg + CompareScenarios._questName(msg));
        dom.attr("shu-header", h);
        CompareScenarios._preLog.append( dom );

        CompareScenarios._curHeaderDiv = $("<div></div>");
        CompareScenarios._curHeaderDiv.attr("shu-header", h);
        CompareScenarios._preLog.append( CompareScenarios._curHeaderDiv );
    }

    static _logNewTalksMissing(talk) {
        let dom = $(`<p class="new"></p>`);
        let msg = `новая реплика <b>${talk.text_id}</b> для <b>${talk.personage}</b>`;
        dom.html(msg);
        (CompareScenarios._curHeaderDiv || CompareScenarios._preLog).append( dom );
    }

    static _logOldTalksRedundant(talk) {
        let dom = $(`<p class="err"></p>`);
        let msg = `лишняя реплика <b>${talk.text_id}</b>`;
        dom.html(msg);
        (CompareScenarios._curHeaderDiv || CompareScenarios._preLog).append( dom );
    }

    static _logInvalidPersonage(text_id, newPers, oldPers) {
        let dom = $(`<p class="warn"></p>`);
        let msg = `неправильный персонаж для реплики <b>${text_id}</b>, должен быть <b>${newPers}</b>, а указан ${oldPers}`;
        dom.html(msg);
        (CompareScenarios._curHeaderDiv || CompareScenarios._preLog).append( dom );
    }


    static _logErrors(arrMsg) {
        arrMsg.forEach(CompareScenarios._logError);
    }

    static _logError(msg) {
        let dom = $(`<p class="err"></p>`);
        dom.html(msg);
        (CompareScenarios._curHeaderDiv || CompareScenarios._preLog).append( dom );
    }


    static _logPrint(msg) {
        let dom = $(`<p></p>`);
        dom.text(msg);
        (CompareScenarios._curHeaderDiv || CompareScenarios._preLog).append( dom );
    }


    static showClear() 
    {
        $("#compareJsonsDiv").show();
        $("#compareRoot").empty();
    }

    static _alias(s) {
        if (CompareScenarios._aliases[s]) 
            return CompareScenarios._aliases[s];
        return s;
    }
}