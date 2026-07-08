import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import DeletedTooltip from "@coreModule/components/custom/deletedTooltip.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";

type DeletedInfoProps = WithLanguageType & {
    deletedAt?: DeletedData["deletedAt"],
    deletedBy: DeletedData["deletedBy"],
    badge?: boolean,
    bottom?: boolean,
}

function DeletedInfo({
    resolveLanguageKey,
    deletedAt,
    deletedBy,
    badge,
    bottom
}: DeletedInfoProps) {

    if( !deletedAt && !deletedBy ){return null;}

    if( badge ){
        return (
            <div className="w-full flex justify-end" style={{border: "2px solid red"}}>
                <DeletedTooltip deletedAt={deletedAt} deletedBy={deletedBy}>
                    <Badge variant="destructive">
                        {resolveLanguageKey("deleted")}
                    </Badge>
                </DeletedTooltip>
            </div>
        )
    }

    if( bottom ){
        return (
            <DeletedTooltip deletedAt={deletedAt} deletedBy={deletedBy}>
                <div className="w-full py-0.5 flex justify-center items-center bg-destructive text-center text-white text-xs">
                    {resolveLanguageKey("deleted")}
                </div>
            </DeletedTooltip>
        )
    }

    return (
        <>
            <div className="shrink-0 w-1.5 self-stretch hover:cursor-pointer">
                {
                    (!!deletedAt || !!deletedBy) ?
                    <DeletedTooltip deletedAt={deletedAt} deletedBy={deletedBy}>
                        <div className="h-full min-h-full w-1.5 bg-destructive/50 hover:cursor-pointer" />
                    </DeletedTooltip>
                    :
                    <TooltipDisplayer tooltip={resolveLanguageKey("active")}>
                        <div className="h-full min-h-full w-1.5 bg-green-600" />
                    </TooltipDisplayer>
                }
            </div>
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/components/custom/deletedInfo/index.tsx")
)(DeletedInfo);