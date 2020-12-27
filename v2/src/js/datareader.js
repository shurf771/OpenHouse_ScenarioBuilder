class DataReader
{
    static path = require('path');
    static dayScenarioFilePath = null;

    static checkPath(callback) 
    {
        const path = DataReader.path;

        let p = $("#txtDataPath").val();

        let p1 = path.resolve(p, 'gamedata');
        let p2 = path.resolve(p, 'shared');
        
        Loader.getFilesInfo([p1, p2], function(stats) {
            console.log("checkPath: ", stats);
            if (stats[0] && stats[1]) {
                $("#dataPathError").hide();
                if (callback) callback(p);
            } else {
                $("#dataPathError").show();
                if (callback) callback(null);
            }
        });
    }
    

    static readDayScenarioJson(dayNumber, callback, options) 
    {
        const path = DataReader.path;

        let baseDir  = $("#txtDataPath").val();
        let strNum   = trainlingChars(dayNumber+"", 2, "0");
        let fileName = `scenarios_ep${strNum}.json`;

        let filePath = path.resolve(baseDir, `gamedata/configs/scenarios/${fileName}`);

        if (!options || !options.dontModifyPathVar) {
            DataReader.dayScenarioFilePath = filePath;
        }

        Loader.loadJSON(filePath, function(json) {
            // console.log("JSON read: ", json);
            callback( json );
        });
    }


    static readDayScenarioText(dayNumber, callback, options) 
    {
        const path = DataReader.path;

        let baseDir  = $("#txtDataPath").val();
        let strNum   = trainlingChars(dayNumber+"", 2, "0");
        let fileName = `scenarios_ep${strNum}.json`;

        let filePath = path.resolve(baseDir, `gamedata/configs/scenarios/${fileName}`);

        Loader.loadText(filePath, function(text) {
            callback( text );
        });
    }


    static saveDayScenarioText(dayNumber, text, callback) 
    {
        const path = DataReader.path;

        let baseDir  = $("#txtDataPath").val();
        let strNum   = trainlingChars(dayNumber+"", 2, "0");
        let fileName = `scenarios_ep${strNum}.json`;

        let filePath = path.resolve(baseDir, `gamedata/configs/scenarios/${fileName}`);

        Loader.saveText(filePath, text, function(success) {
            callback( success );
        });

        return filePath;
    }
}