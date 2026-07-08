import withLanguage, { WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import { compose } from "redux";
import React from "react";
import { formatDate, getName } from "@coreModule/helpers/general";
import type { DeletedData } from "armonia/src/modules/core/types/shared.types.ts";
import { useSelector } from "react-redux";
import { RootState } from "@coreModule/helpers/redux/store/generalStore.ts";

type DeletedTooltipProps = WithLanguageType & {
    children: React.ReactNode;
    deletedAt?: DeletedData["deletedAt"];
    deletedBy?: DeletedData["deletedBy"];
};

function DeletedTooltip({
    resolveLanguageKey,
    children,
    deletedAt,
    deletedBy,
}: DeletedTooltipProps) {
    const { timezone } = useSelector((state: RootState) => state.authentication.user);

    if (!deletedAt && !deletedBy) {
        return <>{children}</>;
    }

    return (
        <TooltipDisplayer
            tooltipRender={() => (
                <div className="space-y-1">
                    {
                        !!deletedAt &&
                        <div className="flex items-center space-x-1">
                            <p>{resolveLanguageKey("deletedAt")}:</p>
                            <p className="font-semibold">
                                {formatDate(new Date(deletedAt.toString()), { timeZone: timezone })}
                            </p>
                        </div>
                    }
                    {
                        !!deletedBy &&
                        <div className="flex items-center space-x-1">
                            <p>{resolveLanguageKey("deletedBy")}:</p>
                            <p className="font-semibold">{getName(deletedBy)}</p>
                        </div>
                    }
                </div>
            )}
        >
            {children}
        </TooltipDisplayer>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/deletedTooltip.tsx")
)(DeletedTooltip);