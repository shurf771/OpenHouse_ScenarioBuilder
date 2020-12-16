class PsdPngMover
{
    static fs = require('fs');
    static path = require('path');


    static _baseDir = null;

    
    static execute()
    {
        UI.saveLocalStorageText( ["txtPSDPngsMoveSrcPath", "txtPSDPngsMoveDayNum"] );

        // empty table here

        DataReader.checkPath(function(basedir) {
            if (!basedir) {
                alert("Ошибка. Сначала надо указать путь к папке data клиентского репозитория");
                return;
            }
            PsdPngMover._baseDir = basedir;
            PsdPngMover._execute();
        });
    }

    
    static _execute()
    {
        const fs   = PsdPngMover.fs;
        const path = PsdPngMover.path;
        
        let day      = $("#txtPSDPngsMoveDayNum").val().trim();
        let pathSrc  = $("#txtPSDPngsMoveSrcPath").val().trim();

        let filesArr = fs.readdirSync(pathSrc);
        console.log(filesArr);

        let pathDestInitial = path.resolve( PsdPngMover._baseDir, `gamedata/locations/initial/objects/day${day}` );
        let pathDestDay     = path.resolve( PsdPngMover._baseDir, `gamedata/locations/day${day}/objects/day${day}` );

        $("#psdPngMoveHeader1").text(`gamedata/locations/initial/objects/day${day}`);
        $("#psdPngMoveHeader2").text(`gamedata/locations/day${day}/objects/day${day}`);
        $("#psdPngMoveHeader3").text('остаются на месте');

        let arrInitial = [];
        let arrDay = [];
        let arrNone = [];
        let arrInitialFilenames = [];
        let arrDayFilenames = [];
        let arrNoneFilenames = [];

        for (let i=0; i<filesArr.length; i++)
        {
            let fileName = filesArr[i];
            if (!/png$/i.test(fileName)) {
                continue;
            }

            let src = path.resolve(pathSrc, fileName);
            let dest = null;

            // initial
            try {
                dest = path.resolve(pathDestInitial, fileName);
                fs.accessSync(dest, fs.constants.F_OK);
            } catch (err) {
                dest = null;
            }
            if (dest) {
                arrInitial.push({
                    "type" : 1,
                    "src"  : src,
                    "dest"  : dest
                });
                arrInitialFilenames.push(fileName);
                continue;
            }

            // day
            try {
                dest = path.resolve(pathDestDay, fileName);
                fs.accessSync(dest, fs.constants.F_OK);
            } catch (err) {
                dest = null;
            }
            if (dest) {
                arrDay.push({
                    "type" : 2,
                    "src"  : src,
                    "dest"  : dest
                });
                arrDayFilenames.push(fileName);
                continue;
            }

            arrNoneFilenames.push(fileName);
            arrNone.push({
                "type" : 3,
                "src"  : src,
                "dest"  : null
            });
        }

        let arrs      = [ arrInitial, arrDay, arrNone ];
        let arrsNames = [ arrInitialFilenames, arrDayFilenames, arrNoneFilenames ];

        for (let i=0; i<arrs.length; i++)
        {
            let arr = arrs[i];
            let domTd = $("#tdPSDPngMove" + (i+1)).empty();
            let domPre = $("<pre></pre>");
            domPre.text( arrsNames[i].join("\n") );
            domTd.append(domPre);

            for (let j=0; j<arr.length; j++)
            {
                let item = arr[j];
                if (item.dest) {
                    try {
                        fs.renameSync(item.src, item.dest);
                    } catch(err) {
                        console.error("Error moving ", item, err);
                    }
                }
            }
        }

        console.log("arrInitial: ", arrInitial);
        console.log("arrDay: ", arrDay);
        console.log("arrNone: ", arrNone);
    }


}