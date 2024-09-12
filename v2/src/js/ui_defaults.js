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
                "order": 50,
                "descr": "Дефолтная позиция joe",
                "type": "position",
                "textValue": "0, 0"
            },
            "talk.animations" : {
                "descr": "Вставлять анимации-заглушки в баблы (talk)",
                "type": "bool",
                "textValue": "1"
            },
            "talk.animation.main" : {
                "descr": "Анимация-заглушка в баблах (talk) для main",
                "type": "string",
                "textValue": "joy"
            },
            "talk.animation.sarah" : {
                "descr": "Анимация-заглушка в баблах (talk) для sarah",
                "type": "string",
                "textValue": "idea"
            },
            "talk.animation.jimmy" : {
                "descr": "Анимация-заглушка в баблах (talk) для jimmy",
                "type": "string",
                "textValue": "idea"
            },
            "talk.animation.ellie" : {
                "descr": "Анимация-заглушка в баблах (talk) для ellie",
                "type": "string",
                "textValue": "idea"
            },
            "comics.animations" : {
                "descr": "Вставлять заглушки анимаций 'через talk' в комиксы",
                "type": "bool",
                "textValue": "1"
            },
            "comics.animation.main" : {
                "descr": "Анимация 'через talk' в комиксы для main",
                "type": "string",
                "textValue": "joy"
            },
            "comics.animation.sarah" : {
                "descr": "Анимация 'через talk' в комиксы для sarah",
                "type": "string",
                "textValue": "idea"
            },
            "comics.animation.jimmy" : {
                "descr": "Анимация 'через talk' в комиксы для jimmy",
                "type": "string",
                "textValue": "idea"
            },
            "comics.animation.ellie" : {
                "descr": "Анимация 'через talk' в комиксы для ellie",
                "type": "string",
                "textValue": "idea"
            },
            "comics.animation.joe" : {
                "descr": "Анимация 'через talk' в комиксы для joe",
                "type": "string",
                "textValue": "idea"
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
                UIDefaults.data[k] = json[k];
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
}