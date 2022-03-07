class FilesWatcher
{
    static fs = require('fs');
    static path = require('path');
    
    // path relative 'data' => path relative 'bin/osx/m3.app/Contents/Resources/data'

    static _dirs = [ // init with defaults
        { data : "shared/gamedata/tables",     bin : "gamedata/tables" },
        { data : "gamedata/configs/scenarios", bin : "gamedata/configs/scenarios" }
    ];

    static _isActive = false;
    static _baseDir = null;
    static _watchers = null;


    static setDirsToWatch(dirs) 
    {
        FilesWatcher._dirs = dirs;
    }


    static tryStart()
    {
        if (FilesWatcher._isActive) return;
        FilesWatcher._isActive = true;

        DataReader.checkPath(function(basedir) {
            if (!basedir) {
                FilesWatcher._isActive = false;
                alert("Ошибка. Сначала надо указать путь к папке data клиентского репозитория");
                return;
            }
            DataReader._baseDir = basedir;
            UI.enableButtons(null, "#btnAutoCopyStart", false);
            UI.enableButtons(null, "#btnAutoCopyStop", true);
            $("#autoCopyListPaths").show();
            $("#autoCopyLog").show();
            FilesWatcher.start();
        });
    }

    static tryStop()
    {
        if (!FilesWatcher._isActive) return;
        FilesWatcher._isActive = false;
        UI.enableButtons(null, "#btnAutoCopyStart", true);
        UI.enableButtons(null, "#btnAutoCopyStop", false);
        $("#autoCopyListPaths").hide();
        $("#autoCopyLog").hide();
        FilesWatcher.stop();
    }


    static start()
    {
        const fs = Loader.fs;
        const path = Loader.path;

        let domAutoCopyListPaths = $("#autoCopyListPaths");
        domAutoCopyListPaths.empty();

        let domAutoCopyLog = $("#autoCopyLog");
        domAutoCopyLog.empty();
        
        FilesWatcher._watchers = [];
        let watchers = FilesWatcher._watchers;

        let binDir = path.resolve(DataReader._baseDir, '..');
        binDir = path.resolve(binDir, 'bin/osx/m3.app/Contents/Resources/data');

        // windows ?
        if (!Loader.getFileExistSync(binDir)) {
            binDir = path.resolve(DataReader._baseDir, '..');
            binDir = path.resolve(binDir, `bin\\windows\\data`);
        }

        for (let i=0; i < FilesWatcher._dirs.length; i++)
        {
            let dirCfg  = FilesWatcher._dirs[i];
            let dirFrom = path.resolve(DataReader._baseDir, dirCfg.data);
            let dirTo   = path.resolve(binDir, dirCfg.bin);
            let watcher = { "dirFrom" : dirFrom, "dirTo" : dirTo, "i" : i };
            watchers.push( watcher );
            FilesWatcher.watchItem(watcher);

            let domLi = $("<li></li>");
            domLi.html(
                watcher.dirFrom.replace(DataReader._baseDir, "<b>"+DataReader._baseDir+"</b>") 
                + " --> " + watcher.dirTo.replace(binDir, "<b>"+binDir+"</b>")
            );
            domAutoCopyListPaths.append(domLi);
        }

        console.log("Watchers Start: ", watchers);
    }


    static watchItem(watcher)
    {
        const fs = Loader.fs;
        const path = Loader.path;

        let domAutoCopyLog = $("#autoCopyLog");

        watcher.fsWatcher = fs.watch(watcher.dirFrom, (eventType, filename) => {
            if (filename) 
            {
                console.log(watcher, eventType, filename);

                let domEntry = $("<span></span>");
                domEntry.text( eventType + " in " + filename + " @ " + (new Date()).toLocaleString() );
                domAutoCopyLog.append( domEntry );
                domAutoCopyLog.append( $("<br />") );
                domAutoCopyLog.scrollTop(domAutoCopyLog.prop("scrollHeight"));

                fs.copyFile(
                    path.resolve(watcher.dirFrom, filename), 
                    path.resolve(watcher.dirTo, filename), 
                    function (err) {
                        if (err) {
                            domEntry.text( domEntry.text() + " [ERROR] " + String(err) );
                        } else {
                            domEntry.text( domEntry.text() + " [OK]");
                        }
                    }
                );
            }
        });
    }


    static stop()
    {
        const fs = Loader.fs;
        const path = Loader.path;
        
        let watchers = FilesWatcher._watchers;
        FilesWatcher._watchers = null;

        for (let i=0; i < watchers.length; i++)
        {
            let watcher = watchers[i];
            let fsWatcher = watcher.fsWatcher;
            fsWatcher.close();
        }
    }

}