import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";

function ValueNotSet({resolveLanguageKey}: WithLanguageType) {

    return (
        <TooltipDisplayer tooltip={resolveLanguageKey("tooltip")}>
            <div className="text-muted-foreground hover:cursor-pointer border border-muted-foreground rounded-full w-4 h-4 flex items-center justify-center">
                !
            </div>
        </TooltipDisplayer>
    )
}

export default compose(
    withLanguage("src/modules/core/components/custom/valueNotSet.tsx")
)(ValueNotSet)