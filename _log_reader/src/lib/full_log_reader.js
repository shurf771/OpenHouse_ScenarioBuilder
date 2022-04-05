class FullLogReader
{
    SCROLL_POS_TO_FIX = 300;
    bookmarksConfig;

    tags;
    hideTagsMap = {};
    monoTag;
    listenScroll;
    bookmarks;
    onceParsed;


    // return false if dont want to reload log-file
    checkAutoLoadFile(forceReload) {
        return forceReload || !this.onceParsed;
    }

    // return false if dont want to parse with default parser
    runParse() {
        console.log("[FullLogReader] parsing...");

        if (!this.bookmarksConfig) {
            this.bookmarksConfig = this.getBookmarksConfig();
        }

        var raw       = $("#txtInput").val();
        var lines     = raw.split("\n");

        this.parseLines(lines);

        if (!this.listenScroll) {
            this.startScrollListen();
        }

        this.onceParsed = true;
        return false;
    }


    destroy() {
        this.tags = null;
        this.hideTagsMap = {};
        this.monoTag = null;
        this.listenScroll = null;
        this.bookmarks = null;
        this.onceParsed = null;
        $("#full_log_body").empty();
        $("#full_log_tags").empty();
    }


    parseLines(lines) {
        const domBody = $("#full_log_body").empty();
        let domChildren = [];

        this.clearTags();

        this.bookmarks = [];

        for (let i=0; i<lines.length; i++)
        {
            const line = lines[i];
            let domLine = $("<span />").text(line + "\n");

            let matchArr = line.match(/\d+\/\d+\/\d+\s\d+:\d+:\d+\|(\w):(\[[^\]]+\])?\s*(\[[^\]]+\])?/);
            
            if (matchArr) {
                // log level tags (error, warning, info, debug, ...)
                let logLevel = matchArr[1]; // D , I , W , E
                if (logLevel == "E") {
                    domLine.addClass("err");
                    this.addTag("err");
                }
                else if (logLevel == "W") {
                    domLine.addClass("warn");
                    this.addTag("warn");
                }
                else if (logLevel == "D") {
                    domLine.addClass("debug");
                    this.addTag("debug");
                }
                else if (logLevel == "I") {
                    domLine.addClass("info");
                    this.addTag("info");
                }
                else if (logLevel == "V") {
                    domLine.addClass("logv");
                    this.addTag("logv");
                }
                else {
                    domLine.addClass("other");
                    this.addTag("other");
                }

                // custom tags
                let customTag = matchArr[2];
                if (customTag) {
                    customTag = customTag.substr(1, customTag.length-2).replace(/\W/g,"_");
                    domLine.addClass(customTag);
                    this.addTag(customTag);
                }
                customTag = matchArr[3];
                if (customTag) {
                    customTag = customTag.substr(1, customTag.length-2).replace(/\W/g,"_");
                    domLine.addClass(customTag);
                    this.addTag(customTag);
                }
            } else {
                domLine.addClass("other");
                this.addTag("other");
            }

            // bookmarks
            for (let b=0; b<this.bookmarksConfig.length; b++) {
                let cfg = this.bookmarksConfig[b];
                if (cfg.disabled) continue;
                if (line.indexOf(cfg.preSearch)) {
                    let matches = line.match(cfg.match);
                    if (matches) {
                        let bookMarkText;
                        if (cfg.replace) {
                            bookMarkText = line.replace(cfg.match, cfg.replace);
                        } else {
                            bookMarkText = matches[0];
                            this.bookmarks.push({
                                line: i+1,
                                lineText: line,
                                bookMarkText: bookMarkText
                            });
                        }
                        break;
                    }
                }
            }
            
            // line number
            const domLineNumber = $("<span />").addClass("linenum").text(i+1).attr("i", i+1);
            domLine.prepend( domLineNumber );

            domChildren.push(domLine);
        }

        domBody.append(domChildren);

        for (let hideTag in this.hideTagsMap) {
            if (this.hideTagsMap[hideTag]) {
                domBody.find("." + hideTag).hide();
            }
        }

        this.drawTags();
        this.drawBookmarks(this.bookmarks);
    }


    clearTags() {
        this.tags = {
            "err": { n: 0, prior: 100 },
            "warn": { n: 0, prior: 90 },
            "debug": { n: 0, prior: 80 },
            "info": { n: 0, prior: 70 },
            "logv": { n: 0, prior: 60 },
            "other": { n: 0, prior: 50 },
            "separator": { fake: true, prior: 40}
        }
    }


    addTag(tag) {
        if (!this.tags[tag]) {
            this.tags[tag] = { n: 0, prior: 1 };
        }
        this.tags[tag].n += 1;
    }


    drawTags() {
        const domTagsDiv = $("#full_log_tags").empty();
        const list = [];
        for (let tagName in this.tags) {
            const tag = this.tags[tagName];
            tag.name = tagName;
            tag.nameLC = tagName.toLowerCase();
            list.push(tag);
        }
        list.sort((a,b) => {
            if (a.prior == b.prior) {
                // 2. by name asc
                if (true) {
                    if (a.nameLC < b.nameLC) return -1;
                    else if (a.nameLC > b.nameLC) return 1;
                    return 0;
                }
                // 2. by n desc
                else {
                    return b.n - a.n; 
                }
            }
            return b.prior - a.prior; // 1. by prior desc
        });

        for (let i=0; i < list.length; i++) {
            const tag = list[i];
            if (tag.fake) {
                domTagsDiv.append( $("<span />").text(" | ") );
            }
            else {
                const domTagBtn = $("<button />")
                    .addClass("xs")
                    .text( tag.name + " (" + tag.n + ")" )
                    .attr( "shu-name", tag.name )
                    .click( this.onTagClicked.bind(this) );
                if (!this.hideTagsMap[tag.name]) {
                    domTagBtn.addClass("bg-blue-grey");
                }
                tag.domBtn = domTagBtn;
                domTagsDiv.append(domTagBtn);
            }
        }
    }

    onTagClicked(e) {
        let btn = $(e.currentTarget);
        let name = btn.attr("shu-name");
        let isCtrl = e.ctrlKey;

        // CTRL : show ONLY this tag / hide ONLY this tag
        if (isCtrl) {
            if (!this.monoTag || this.monoTag.tag != name) {
                this.monoTag = { tag: name, show: true };
            } else {
                this.monoTag.show = !this.monoTag.show;
            }

            let arrShowTags = [];
            for (let t in this.tags) {
                if (this.tags[t].fake) continue;
                let tagBtn = this.tags[t].domBtn;
                let show = (t == name ? this.monoTag.show : !this.monoTag.show);
                if (show) {
                    arrShowTags.push(t);
                } else {
                    let lines = $("#full_log_body").find("." + t);
                    this.hideTagsMap[t] = true;
                    tagBtn.removeClass("bg-blue-grey");
                    lines.hide();
                }
            }
            for (let i=0; i<arrShowTags.length; i++) {
                let t = arrShowTags[i];
                let tagBtn = this.tags[t].domBtn;
                let lines = $("#full_log_body").find("." + t);
                this.hideTagsMap[t] = false;
                tagBtn.addClass("bg-blue-grey");
                lines.show();
            }
        }
        // default : toggle this tag
        else {
            let lines = $("#full_log_body").find("." + name);
            this.hideTagsMap[name] = !this.hideTagsMap[name];
            if (this.hideTagsMap[name]) {
                btn.removeClass("bg-blue-grey");
                lines.hide();
            } else {
                btn.addClass("bg-blue-grey");
                lines.show();
            }
        }
    }


    startScrollListen() {
        const _this = this;
        _this.listenScroll = true;
        _this.lastKnownScrollPosition = 0;
        _this.ticking = false;
        document.addEventListener("scroll", function(e) {
            _this.lastKnownScrollPosition = window.scrollY;

            if (!_this.ticking) {
                window.requestAnimationFrame(function() {
                    _this.onScrollChanged(_this.lastKnownScrollPosition);
                    _this.ticking = false;
                });

                _this.ticking = true;
            }
        });
    }


    onScrollChanged(scrollPos) {
        console.log("[onScrollChanged]", scrollPos);
        if (scrollPos >= this.SCROLL_POS_TO_FIX) {
            $("#full_log_bookmarks").addClass("fixed_bookmarks");
        } 
        else {
            $("#full_log_bookmarks").removeClass("fixed_bookmarks");
        }
    }


    drawBookmarks(bookmarks) {
        const domBookmarks = $("#full_log_bookmarks").empty();
        // line: i,
        // lineText: line,
        // bookMarkText: bookMarkText
        for (let i = 0; i < bookmarks.length; i++) {
            const bookmark = bookmarks[i];
            const domBookmart = $("<span />")
                .text(bookmark.bookMarkText + "\n")
                .prepend(
                    $("<span />")
                        .text(bookmark.line)
                        .addClass("linenum")
                )
                .attr("title", bookmark.lineText)
                .attr("shu-line", bookmark.line)
                .click(this.onBookmarkClick.bind(this))
                .appendTo(domBookmarks);
        }
    }


    onBookmarkClick(e) {
        let dom = $(e.currentTarget);
        let line = dom.attr("shu-line");
        let domLine = $("#full_log_body").find(`.linenum[i=${line}]`);
        if (domLine.length > 0) {
            domLine[0].scrollIntoView(true);
            // $("#full_log_body").find(".curline").removeClass("curline");
            domLine.addClass("curline");
        }
    }


    getBookmarksConfig() {
        return [
            {
                preSearch: "#### exec command #####",
                match: /#### exec command #####	(\w+)/
            },
            {
                preSearch: "#### exec command start #####",
                match: /#### exec command start #####	(\w+)/
            },
            {
                preSearch: "#### exec command success #####",
                match: /#### exec command success #####	(\w+)/
            },
            {
                // trash
                disabled: true,
                preSearch: "advisor:on_modals_changed",
                match: /advisor:on_modals_changed\s+(\w+)\s+(\w+)/
            },
            {
                preSearch: "[cut_scene]	action started:",
                match: /\[cut_scene\]\s+action\s+started:\s+([\w\.,-]+)/
            },
            {
                preSearch: "[scene_manager] [push]",
                match: /\[scene_manager\] \[push\]\s+(.+)$/
            },
            {
                preSearch: "show modal",
                match: /\[scene\]\s+(\w+)\s+show modal\s+(\w+)/
            },
            {
                preSearch: "pop modal",
                match: /\[scene\]\s+(\w+)\s+pop modal\s+(\w+)/
            }
        ];
    }
}