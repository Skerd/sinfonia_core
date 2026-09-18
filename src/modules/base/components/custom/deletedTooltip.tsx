import withLanguage, { WithLanguageType } from "@baseModule/helpers/hocs/withLanguage.tsx";
import TooltipDisplayer from "@baseModule/components/custom/tooltipDisplayer.tsx";
import type { ReactNode } from "react";
import {formatDate} from "@baseModule/helpers/general/dateTime.ts";
import {getName} from "@baseModule/helpers/general/names.ts";
import type { DeletedData } from "armonia/src/modules/core/types/shared.types.ts";
import { useSelector } from "react-redux";
import { RootState } from "@baseModule/helpers/redux/store/generalStore.ts";

type DeletedTooltipProps = WithLanguageType & {
    children: ReactNode;
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

    const rows = [
        deletedAt && { labelKey: "deletedAt", value: formatDate(deletedAt, { timeZone: timezone }) },
        deletedBy && { labelKey: "deletedBy", value: getName(deletedBy) },
    ].filter((row): row is { labelKey: string; value: string } => !!row);

    return (
        <TooltipDisplayer
            tooltipRender={() => (
                <div className="flex flex-col gap-y-1">
                    {rows.map(({ labelKey, value }) => (
                        <div key={labelKey} className="flex items-center gap-x-1">
                            <p>{resolveLanguageKey(labelKey)}:</p>
                            <p className="font-semibold">{value}</p>
                        </div>
                    ))}
                </div>
            )}
        >
            {children}
        </TooltipDisplayer>
    );
}

export default withLanguage("src/modules/core/components/custom/deletedTooltip.tsx")(DeletedTooltip);