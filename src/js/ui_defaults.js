class UIDefaults
{
    static init(state) 
    {
        UIDefaults.state = state;
        UIDefaults.data = {
            "camera" : {
                "order": 0,
                "descr": "Дефолтное расположение камеры",
                "type": "position",
                "textValue": "0, 0"
            },
            "position.main" : {
                "order": 10,
                "descr": "Дефолтная позиция main",
                "type": "position",
                "textValue": "0, 0"
            },
            "position.sarah" : {
                "order": 20,
                "descr": "Дефолтная позиция sarah",
                "type": "position",
                "textValue": "0, 0"
            },
            "position.jimmy" : {
                "order": 30,
                "descr": "Дефолтная позиция jimmy",
                "type": "position",
                "textValue": "0, 0"
            },
            "position.ellie" : {
                "order": 40,
                "descr": "Дефолтная позиция ellie",
                "type": "position",
                "textValue": "0, 0"
            },
            "position.joe" : {
                "order": 45,
                "descr": "Дефолтная позиция joe",
                "type": "position",
                "textValue": "0, 0"
            },
            "position.tony" : {
                "order": 50,
                "descr": "Дефолтная позиция tony",
                "type": "position",
                "textValue": "0, 0"
            },
            "position.dog" : {
                "order": 60,
                "descr": "Дефолтная позиция dog",
                "type": "position",
                "textValue": "0, 0"
            },
            "talk.animations" : {
                "descr": "Вставлять анимации-заглушки в баблы (talk)",
                "type": "bool",
                "textValue": "1"
            },
            "talk.animations.must-a" : {
                "descr": "Вставлять анимации-заглушки в баблы (talk) в айдлах (\"Must-A\")",
                "type": "bool",
                "textValue": "1"
            },
            "talk.animation.main" : {
                "descr": "Анимация-заглушка в баблах (talk) для main",
                "type": "string",
                "textValue": "idea",
                "tabIndent": 1
            },
            "talk.animation.sarah" : {
                "descr": "Анимация-заглушка в баблах (talk) для sarah",
                "type": "string",
                "textValue": "idea",
                "tabIndent": 1
            },
            "talk.animation.jimmy" : {
                "descr": "Анимация-заглушка в баблах (talk) для jimmy",
                "type": "string",
                "textValue": "idea",
                "tabIndent": 1
            },
            "talk.animation.ellie" : {
                "descr": "Анимация-заглушка в баблах (talk) для ellie",
                "type": "string",
                "textValue": "idea",
                "tabIndent": 1
            },
            "talk.animation.joe" : {
                "descr": "Анимация-заглушка в баблах (talk) для joe",
                "type": "string",
                "textValue": "idea",
                "tabIndent": 1
            },
            "talk.animation.tony" : {
                "descr": "Анимация-заглушка в баблах (talk) для tony",
                "type": "string",
                "textValue": "idea",
                "tabIndent": 1
            },
            "talk.animation.dog" : {
                "descr": "Анимация-заглушка в баблах (talk) для dog",
                "type": "string",
                "textValue": "bark",
                "tabIndent": 1
            },
            "talk.animation.other" : {
                "descr": "Анимация-заглушка в баблах (talk) для остальных",
                "type": "string",
                "textValue": "idea",
                "tabIndent": 1
            },
            "comics.animations" : {
                "descr": "Вставлять заглушки анимаций 'через talk' в комиксы",
                "type": "bool",
                "textValue": "1"
            },
            "comics.animation.main" : {
                "descr": "Анимация 'через talk' в комиксы для main",
                "type": "string",
                "textValue": "idea",
                "tabIndent": 1
            },
            "comics.animation.sarah" : {
                "descr": "Анимация 'через talk' в комиксы для sarah",
                "type": "string",
                "textValue": "idea",
                "tabIndent": 1
            },
            "comics.animation.jimmy" : {
                "descr": "Анимация 'через talk' в комиксы для jimmy",
                "type": "string",
                "textValue": "idea",
                "tabIndent": 1
            },
            "comics.animation.ellie" : {
                "descr": "Анимация 'через talk' в комиксы для ellie",
                "type": "string",
                "textValue": "idea",
                "tabIndent": 1
            },
            "comics.animation.joe" : {
                "descr": "Анимация 'через talk' в комиксы для joe",
                "type": "string",
                "textValue": "idea",
                "tabIndent": 1
            },
            "comics.animation.tony" : {
                "descr": "Анимация 'через talk' в комиксы для tony",
                "type": "string",
                "textValue": "idea",
                "tabIndent": 1
            },
            "comics.animation.reactions" : {
                "descr": "Реакция остальных на talk",
                "type": "bool",
                "textValue": "1"
            },
            "comics.animation.onlyidle" : {
                "descr": "(new) В комиксах только idle/talk без каких-либо анимаций и реакций",
                "type": "bool",
                "textValue": "1"
            },
            "comics.sprites.minimalize.ifgreater3" : {
                "descr": "(new) В комиксах, где больше 3 говорящих, показывать только последних двух",
                "type": "bool",
                "textValue": "1"
            },
            "comics.sprites.minimalize.ifgreater2" : {
                "descr": "(new) В комиксах, где больше 2 говорящих, показывать только последних двух",
                "type": "bool",
                "textValue": "1"
            },
            "comics.animation.addtalkcomments" : {
                "descr": "Добавить в конец строки коммент с названиями анимаций (talk, talksit, ...)",
                "type": "bool",
                "textValue": "1"
            },
            "generate.personages.head" : {
                "descr": "Всегда генерировать в шапке этих персов",
                "type": "string",
                "textValue": "main,sarah,jimmy,ellie,tony"
            },
            "generate.no_must_a" : {
                "descr": "Не генерировать 'Маст-А'",
                "type": "bool",
                "textValue": "0"
            },
            "rename.oscar" : {
                "descr": "Заменять везде 'oscar' на 'main'",
                "type": "bool",
                "textValue": "1"
            }
        };

        UIDefaults.resetSettings();
    }
    

    static parseValues() {
        for (const key in UIDefaults.data) 
        {
            const setting = UIDefaults.data[key];
            setting.value = setting.textValue;

            if (setting.type == "position") {
                let parts = setting.textValue.match(/([\d\.-]+)\D+?([\d\.-]+)/);
                if (parts) {
                    setting.value = {x: parseFloat(parts[1]), y: parseFloat(parts[2])};
                } else {
                    setting.value = {x: 0, y: 0};
                }
            }
            else if (setting.type == "bool") {
                setting.value = (setting.textValue == "1");
            }
        }
        console.log("default map settings:", UIDefaults.data);
    }
    

    static saveSettings() {
        let domSettings = $("#defaultSettingContainer .defaultSetting");
        for (let i=0; i<domSettings.length; i++) {
            let domSetting = $(domSettings[i]);
            let key = domSetting.attr("shu-defsetting");
            if (UIDefaults.data[key]) {
                let setting = UIDefaults.data[key];
                
                if (setting.type == "position" || setting.type == "string") {
                    setting.textValue = domSetting.val().trim();
                } 
                else if (setting.type == "bool") {
                    setting.textValue = (domSetting[0].checked ? "1" : "0");
                }
            }
        }
        localStorage.setItem("defaultMapSettings", JSON.stringify(UIDefaults.data));
        UIDefaults.parseValues();
    }


    static resetSettings() {
        let str = localStorage.getItem("defaultMapSettings");
        let json = null;
        if (str) {
            try {
                json = JSON.parse(str);
                console.log("load default map settings:", json);
            }
            catch (err) {}
        }
        if (json) {
            for (let k in json) {
                if (UIDefaults.data[k]) {
                    if ("value" in json[k])     UIDefaults.data[k]["value"]     = json[k]["value"];
                    if ("textValue" in json[k]) UIDefaults.data[k]["textValue"] = json[k]["textValue"];
                }
            }
        }

        let container = $("#defaultSettingContainer").empty();

        for (const key in UIDefaults.data) 
        {
            const setting = UIDefaults.data[key];

            let domTr = $("<tr></tr>");
            let domTdDesc = $("<td></td>");
            let domTdBody = $("<td></td>");
            let domText = $('<input class="defaultSetting" />');

            domTdDesc.text(setting.descr);
            if (setting.tabIndent) {
                domTdDesc.css("padding-left", (parseInt(setting.tabIndent) * 30) + "px");
            }

            domText.attr("shu-defsetting", key);

            if (setting.type == "position" || setting.type == "string") {
                domText.attr("type", "text");
                domText.val(setting.textValue);
            }
            else if (setting.type == "bool") {
                domText.attr("type", "checkbox");
                if (setting.textValue == 1)
                    domText.attr("checked", "checked");
                else
                    domText.removeAttr("checked");
            }

            domTr.append(domTdDesc);
            domTr.append(domTdBody);
            domTdBody.append(domText);

            container.append(domTr);
        }

        UIDefaults.parseValues();
    }



    static presetsInit() {
        try {
            UIDefaults.presets = { };
            let json = Loader.loadText("presets.json");
            json = JSON.parse(json);
            console.log("Presets: ", json);
            let domSelect = $("#pathsAndUrlsPresets");
            let curQuestsVal = (localStorage.getItem("txtM3QuestsURL") || "").trim();
            let curLocalizationVal = (localStorage.getItem("txtM3LocalizationURL") || "").trim();
            let selectedPreset = null;
            for (let i=0; i<json.length; i++) {
                const preset = json[i];
                UIDefaults.presets[preset.name] = preset;
                $("<option />").text(preset.name).val(preset.name).appendTo(domSelect);
                if (preset.localization_spreadsheets == curLocalizationVal 
                    && preset.quests_spreadsheets == curQuestsVal)
                {
                    selectedPreset = preset.name;
                }
            }
            if (selectedPreset) {
                domSelect.val(selectedPreset);
            }
        }
        catch (error) {
            console.error("Can't init presets!", error)
        }
    }


    static presetApply() {
        let curName = $("#pathsAndUrlsPresets").val();
        const preset = UIDefaults.presets[curName];
        console.log("Preset chosen: ", preset);

        let queue = [
            { textInput: "txtM3QuestsURL", field: "quests_spreadsheets" },
            { textInput: "txtM3LocalizationURL", field: "localization_spreadsheets" },
            { textInput: "txtDataPath", field: "data_path" }
        ];
        
        for (let i=0; i<queue.length; i++) {
            let q = queue[i];
            let domText = $("#"+q.textInput);
            let oldval = domText.val().trim();
            let newval = preset[q.field].trim();
            if (oldval != newval)
            {
                domText.val(newval);
                domText.css("background-color", "#CCFFCC");
                setTimeout((el) => { el.css("background-color", "#FFFFFF"); }, 300+i*50, domText);
            }
        }
    }
}