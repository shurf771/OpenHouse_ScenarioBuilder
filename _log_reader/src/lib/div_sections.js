class DivSections
{
    domDivPickSectionId = "divPickSection";
    domDivSectionClass  = "divsection";

    sections;
    onChangeSection;
    curSectionName;
    curSection;

    start(params) {
        this.sections        = params.sections;
        this.onChangeSection = params.onChangeSection;
        this.curSectionName  = params.curSectionName;

        this.redrawSectionsBar();
        this.onChangeSection( this.curSection );
    }


    redrawSectionsBar() {
        let domDivPickSection = $("#" + this.domDivPickSectionId);
        domDivPickSection.empty();

        for (let i = 0; i < this.sections.length; i++)
        {
            if (i > 0) {
                domDivPickSection.append( $("<span />").text(" | ") ); 
            }

            const section = this.sections[i];
            const domSectionDiv = $(`.divsection[shu-section=${section.name}]`); // <div class="divsection" shu-section="default">

            if (section.name == this.curSectionName) {
                this.curSection = section;
                $("<b />").text(section.name)
                        .attr("shu-name", section.name)
                        .appendTo(domDivPickSection);
                domSectionDiv.show();
            } 
            else {
                $("<a />").text(section.name)
                        .attr("shu-name", section.name)
                        .click(this.onSectionHrefClicked.bind(this))
                        .appendTo(domDivPickSection);
                domSectionDiv.hide();
            }
        }
    }


    onSectionHrefClicked(e) {
        let domA = $(e.currentTarget);
        let name = domA.attr("shu-name");
        this.curSectionName = name;
        this.redrawSectionsBar();
        this.onChangeSection( this.curSection );
    }

}