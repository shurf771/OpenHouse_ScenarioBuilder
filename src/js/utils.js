// adds addBeforeChar and/or addAfterChar to text until text.length >= minLen
function trainlingChars(text, minLen, addBeforeChar, addAfterChar)
{
    while (text.length < minLen)
        text = (addBeforeChar || "") + text + (addAfterChar || "");
    return text;
}


// getCharOccurrencesCount("1+2+3", "+") == 2
function getCharOccurrencesCount(text, char) {
    let result = -1;
    for (
        let index=-2; 
        index != -1; 
        result++, index = text.indexOf(char,index+1)
    );
    return result;
}

// googleDoc names into day.json valid names
function nameAlias(name) {
    if (name == "oscar") return "main";
    if (name == "alice") return "ellie";
    if (name == "balto") return "dog";
    if (name == "francesca") return "sarah";
    if (name == "guiseppe") return "gondola";
    return name;
}
