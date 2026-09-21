import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {IconExclamationMark} from "@tabler/icons-react";

type ValueNotSetProps = WithLanguageType & {className?: string};

function ValueNotSet({resolveLanguageKey, className}: ValueNotSetProps) {

    return (
        <TooltipDisplayer tooltip={resolveLanguageKey("tooltip")}>
            <div className={cn("text-muted-foreground hover:cursor-pointer border border-muted-foreground rounded-full size-4 flex items-center justify-center", className)}>
                <IconExclamationMark />
            </div>
        </TooltipDisplayer>
    )
}

export default withLanguage("src/modules/core/components/custom/valueNotSet.tsx")(ValueNotSet)