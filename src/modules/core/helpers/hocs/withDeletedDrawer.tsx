import {ComponentType, useState} from "react";
import {compose} from "redux";
import {useSelector} from "react-redux";
import {ChevronDown, Trash2, User, Clock} from "lucide-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {formatDate, getName} from "@coreModule/helpers/general";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";

type DrawerPanelProps = WithLanguageType & {
    deletedAt?: DeletedData["deletedAt"];
    deletedBy?: DeletedData["deletedBy"];
};

function DeletedDrawerPanel({resolveLanguageKey, deletedAt, deletedBy}: DrawerPanelProps) {
    const {timezone} = useSelector((state: RootState) => state.authentication.user);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="select-none cursor-pointer text-white"
            onClick={(e) => {
                e.stopPropagation();
                setIsOpen(prev => !prev);
            }}
        >
            {/* Details — collapses to zero when closed, expands to content height when open */}
            <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isOpen ? "max-h-20" : "max-h-0 group-hover:max-h-20")}>
                <div className="px-3 py-2 space-y-1.5 text-xs border-b border-white/15">
                    {
                        !!deletedBy &&
                        <InfoRow
                            icon={User}
                            className="text-white"
                            label={resolveLanguageKey("deletedBy")}
                            tooltip={resolveLanguageKey("deletedBy")}
                            value={deletedBy ? getName(deletedBy) : undefined}
                        />
                    }
                    {
                        !!deletedAt &&
                        <InfoRow
                            icon={Clock}
                            className="text-white"
                            label={resolveLanguageKey("deletedAt")}
                            tooltip={resolveLanguageKey("deletedAt")}
                            value={deletedAt ? formatDate(new Date(deletedAt.toString()), {timeZone: timezone}) : undefined}
                        />
                    }
                </div>
            </div>

            {/* Handle — visible when closed, collapses when open */}
            <div className={cn("overflow-hidden transition-all duration-300", isOpen ? "max-h-0 opacity-0" : "max-h-12 opacity-100 group-hover:max-h-0 group-hover:opacity-0")}>
                <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-1.5 font-semibold text-xs tracking-wide uppercase">
                        <Trash2 size={12} />
                        <span>{resolveLanguageKey("deleted")}</span>
                    </div>
                    <ChevronDown size={14} className="opacity-80" />
                </div>
            </div>
        </div>
    );
}

const DeletedDrawerPanelWithLanguage = compose(
    withLanguage("src/modules/core/helpers/hocs/withDeletedDrawer.tsx")
)(DeletedDrawerPanel);

export function withDeletedDrawer<TProps extends object>(Component: ComponentType<TProps>, getDeletedData: (props: TProps) => { deletedAt?: DeletedData["deletedAt"]; deletedBy?: DeletedData["deletedBy"] } | undefined) {
    return function WithDeletedDrawer(props: TProps) {
        const data = getDeletedData(props);
        const isDeleted = !!(data?.deletedAt || data?.deletedBy);

        if (!isDeleted) {
            return <Component {...props} />;
        }

        return (
            <div className="group flex flex-col rounded-xl bg-linear-to-b from-red-600 to-red-700 shadow-[0_6px_20px_-4px_rgba(180,0,0,0.45)]">
                <div className="relative z-10 p-0.5">
                    <Component {...props} />
                </div>
                <DeletedDrawerPanelWithLanguage
                    deletedAt={data?.deletedAt}
                    deletedBy={data?.deletedBy}
                />
            </div>
        );
    };
}
