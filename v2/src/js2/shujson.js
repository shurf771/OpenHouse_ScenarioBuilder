let SHUJSON_METAKEY = "_#shu-meta-key#";

class ShuJSON
{
    static setDefaultKeysOrder(defaultKeysArr) {
        ShuJSON._defaultKeysArr = defaultKeysArr;
    }


    static decode(text) 
    {
        try {
            text = text.replace(/\/\/.*/g, ""); // remove comments from json
            return JSON.parse(text);
        }
        catch (err) {
            console.error(err);
        }
        return null;
    }


    static encode(_obj) 
    {
        let prefixItem = "\t"
        let str = "";

        function _encode(objOrArr, prefixes) {
            if (Array.isArray(objOrArr)) {
                _encodeArr(objOrArr, prefixes);
            } else if (typeof objOrArr == "object") {
                _encodeObj(objOrArr, prefixes);
            } else {
                if (typeof objOrArr == "boolean" || objOrArr == "true" || objOrArr == "false") {
                    str += objOrArr;
                } else {
                    let num = Number.parseFloat(objOrArr);
                    if (isNaN(num)) {
                        str += '"' + objOrArr + '"';
                    } else {
                        str += objOrArr;
                    }
                }
            }
        }

        function _encodeArr(arr, prefixes) {
            str += "[\n";
            for (let i=0, n=arr.length; i<n; i++)
            {
                let item = arr[i];
                str += prefixes + prefixItem;
                _encode(item, prefixes + prefixItem);
                if (i < n-1) {
                    str += ",\n";
                }
            }
            str += "\n" + prefixes + "]";
        }

        function _encodeObj(obj, prefixes) {
            let prefixes0 = prefixes;
            prefixes += prefixItem;

            _correctMeta(obj);

            let meta = obj[SHUJSON_METAKEY];
            let keys = meta["keysArr"];

            let isOneLine = false;
            if ("isOneLine" in meta) {
                isOneLine = meta["isOneLine"];
            } else {
                if (!meta["hasChildObjects"] && meta["keysCount"] < 7) {
                    isOneLine = true;
                }
            }

            if (isOneLine) {
                str += "{ ";
            } else {
                str += "{\n";
            }

            for (let i=0, n=keys.length; i<n; i++)
            {
                let key = keys[i];
                let item = obj[key];
                
                if (isOneLine) {
                    str += '"' + key + '": ';
                } else {
                    str += prefixes + '"' + key + '": ';
                }

                _encode(item, prefixes);
                if (i < n-1) {
                    str += ", ";
                }
                
                if (isOneLine) {
                    str += "";
                } else {
                    str += "\n";
                }
            }

            if (isOneLine) {
                str += " }";
            } else {
                str += prefixes0 + "}";
            }
        }

        function _correctMeta(obj) {
            if (!(SHUJSON_METAKEY in obj))
                obj[SHUJSON_METAKEY] = {};
            let meta = obj[SHUJSON_METAKEY];

            let keysArr = [];
            let hasChildObjects = false;

            for (let key in obj) {
                if (key == SHUJSON_METAKEY)
                    continue;
                let item = obj[key];
                if (typeof item == "object" || Array.isArray(item)) {
                    hasChildObjects = true;
                }
                keysArr.push(key);
            }

            meta["keysCount"] = keysArr.length;
            meta["keysArr"] = keysArr;
            meta["hasChildObjects"] = hasChildObjects;

            ShuJSON._sortKeysArr(obj);
        }

        _encode(_obj, "");
        return str;
    }


    static _sortKeysArr(obj) {
        let keysOrder = obj[SHUJSON_METAKEY]["keysSortOrder"] || ShuJSON._defaultKeysArr;
        if (!keysOrder || keysOrder.length == 0)
            return;

        let keys = obj[SHUJSON_METAKEY]["keysArr"];
        keys.sort(function(a,b) {
            if (a == b) return 0;
            let ai = keysOrder.indexOf(a); if (ai<0) ai = 9999;
            let bi = keysOrder.indexOf(b); if (bi<0) bi = 9999;
            if (ai > bi)
                return 1;
            return -1;
        });
    }
}