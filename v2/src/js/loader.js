class Loader
{
    static fs = require('fs');
    static path = require('path');
    static https = require('https');
    

    static getFileInfo(filepath, callback, userParams) 
    {
        const fs = Loader.fs;
        const path = Loader.path;

        console.log("getFileInfo:", path.resolve(filepath));

        // Check if the file exists in the current directory.
        fs.access(filepath, fs.constants.F_OK, (err) => {
            if (err) {
                callback(null, userParams); // not exists
                return;
            }
            fs.stat(filepath, function(err, stats) {
                if (!stats) {
                    console.error("Error in getFileInfo: " + filepath, err);
                    callback(null, userParams);
                }
                else {
                    callback(stats, userParams);
                }
            });
        });
    }    
    
    static getFileExistSync(filepath) 
    {
        const fs = Loader.fs;
        if (fs.existsSync(filepath)) {
            return true;
        }
        return false;
    }

    static getFilesInfo(arrayFilepaths, callback, userParams) 
    {
        let results = [];
        let i = -1;
        function __next() {
            i = i + 1;
            Loader.getFileInfo( arrayFilepaths[i], function(status,up) {
                results.push(status);
                if (results.length >= arrayFilepaths.length) {
                    callback(results, userParams);
                } else {
                    __next();
                }
            }, 
            null );
        }
        __next();
    }


    static saveFile(filepath, data, callback, userParams)
    {
        const fs = Loader.fs;

        //const data = new Uint8Array(Buffer.from('Hello Node.js'));
        
        Loader.checkOrCreatePathFolders(filepath);

        fs.writeFile(filepath, data, (err) => {
            if (err) {
                console.error("Error saving file: " + filepath, err);
                return;
            }
            console.log('The file has been saved!');
            if (callback) callback(userParams);
        });
    }


    static checkOrCreatePathFolders(filepath, isDirectory)
    {
        const fs = Loader.fs;
        const path = Loader.path;

        var dirname = (isDirectory ? filepath : path.dirname(filepath));

        if (!fs.existsSync(dirname)) {
            try {
                fs.mkdirSync(dirname, { recursive: true });
            }
            catch (err) {
                console.error("Error creating directory!");
                console.error(path.resolve(dirname));
                console.error(err);
                UI.alertError("Error creating directory! check console for details");
            }
        }
    }


    static downloadFile(url, dest, callback, userParams)
    {
        const fs = Loader.fs;
        const https = Loader.https;

        Loader.checkOrCreatePathFolders(dest);

        let file = fs.createWriteStream(dest);
        let request = https.get(url, function(response) 
        {
            console.log(response);
            if ([301, 302, 307].indexOf(response.statusCode) > -1) {
                console.log("redirect " + url + " => " + response.headers.location);
                Loader.downloadFile(response.headers.location, dest, callback, userParams); 
                return;
            }
            response.pipe(file);
            file.on('finish', function() {
                file.close( (err) => callback(userParams) );  // close() is async, call callback after close completes.
            });
        }).on('error', function(err) {
            console.error(err);
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            if (callback) callback(userParams);
        });
    }


    static loadXLSX(path, callback, userParams)
    {
        console.log("loadXLSX " + path);

        const fs = Loader.fs;

        let buffer = fs.readFileSync(path, null).buffer;
        let uint8Array = new Uint8Array(buffer);
        let workbook = XLSX.read(uint8Array, {type: 'array'});

        callback(workbook, userParams);
    }


    static loadJSON(path, callback, userParams)
    {
        const fs = Loader.fs;

        let str = null;
        try {
            let buf = fs.readFileSync(path);
            str = buf.toString();
            str = str.replace(/\/\/.*/g, ""); // remove comments from json
        } catch (err) {
            console.log("loadJSON ERROR reading file: ", err);
            callback(null, userParams);
            return;
        }

        let json = null;
        try {
            json = JSON.parse(str);
        }
        catch (err) {
            console.log("loadJSON ERROR json parsing: ", err);
            callback(null, userParams);
            return;
        }

        callback(json, userParams);
    }


    static loadText(path, callback, userParams)
    {
        const fs = Loader.fs;

        let str = null;
        try {
            let buf = fs.readFileSync(path);
            str = buf.toString();
        } catch (err) {
            console.log("loadText ERROR reading file: ", err);
            callback(null, userParams);
            return;
        }

        callback(str, userParams);
    }


    static saveText(filepath, text, callback, userParams)
    {
        const fs = Loader.fs;

        fs.writeFile(filepath, text, (err) => {
            if (err) {
                console.error("Error saving file: " + filepath, err);
                callback(false, userParams);
                return;
            }
            console.log('The file has been saved!');
            callback(true, userParams);
        });
    }


    /**
     *  Makes an ajax request
     */
    static ajaxRequest(url, method, data, dataType, onSuccess, onError, requestTimeoutMs) {
        let params = {
            method   : (method ? method : "POST"),
            url      : url,
            dataType : (dataType ? dataType : "json"),
            timeout  : (requestTimeoutMs > 0 ? requestTimeoutMs : 15000)
        };
        if (data) {
            params.data = data;
        }
        $.ajax(params).done(function(response) {
            if (onSuccess != null) {
                onSuccess(response);
            }
        }).fail(function() {
            if (onError != null) {
                onError();
            } else {
                if (onSuccess != null) {
                    onSuccess(null);
                }
            }
        });
    }
}