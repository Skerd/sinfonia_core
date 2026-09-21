import {useId, useMemo, type ComponentType, type ReactNode} from "react";
import {useSelector} from "react-redux";
import TooltipDisplayer from "@baseModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Item, ItemMedia} from "@coreModule/components/ui/item.tsx";
import {useRestrictedField} from "@coreModule/components/customUnchecked/infoRowGroup.tsx";
import {accessFieldPathExists} from "@baseModule/helpers/context/accessContext.tsx";
import {RootState} from "@baseModule/helpers/redux/store/generalStore.ts";
import {useAccessFieldsRead} from "@baseModule/components/viewEngine/widgets/display/accessFields.tsx";
import DisplayValue, {
    displayPlainText,
    type DisplayValueType,
} from "@baseModule/components/viewEngine/widgets/display/displayValue.tsx";
import TruncatedValue from "@baseModule/components/viewEngine/widgets/display/truncatedValue.tsx";

export type DisplayRowIcon = ComponentType<{size?: number | string; className?: string}>;

const LOCAL_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

type DisplayRowProps = {
    /** Wins over `path`. */
    show?: boolean;
    path?: string;
    type?: DisplayValueType;
    languageKeyCategory?: string;
    format?: Intl.DateTimeFormatOptions;
    size?: number;
    icon?: DisplayRowIcon;
    iconReplacement?: ReactNode;
    label: string;
    tooltip?: string;
    tooltipRender?: () => ReactNode;
    value: unknown;
    className?: string;
    dontRenderValue?: boolean;
    children?: (formatted: ReactNode) => ReactNode;
};

/**
 * Card-body label/value row. A denied field is omitted and reported to
 * `InfoRowGroup`. Allowed values go through `DisplayValue`.
 */
export default function EntityCardRow({
    icon: Icon,
    iconReplacement,
    tooltip,
    tooltipRender,
    label,
    value,
    className,
    show: showProp,
    path,
    type,
    languageKeyCategory,
    format,
    size,
    dontRenderValue = false,
    children,
}: DisplayRowProps) {
    const id = useId();
    const contextRead = useAccessFieldsRead();
    const timezone = useSelector((state: RootState) => state.authentication.user?.timezone);
    const timeZone = timezone || LOCAL_TIME_ZONE;
    const labelText = label ?? "";
    const tooltipText = tooltip;

    let allowed = true;
    if (showProp !== undefined) {
        allowed = showProp;
    } else if (path && (path === "statistics" || path.startsWith("statistics."))) {
        // Computed aggregates — not model ACL keys. Backend decides the payload.
        allowed = true;
    } else if (path) {
        /*
         * Fail closed: with no `AccessFields` ancestor there is no read map to consult, so the
         * row is dropped AND reported as restricted. That is the safe default, but it is silent,
         * and outside an `EntityCard` shell (a sheet, an `extraDialogs` dialog, a standalone
         * card) it means a card can claim "N fields hidden" for fields the user fully owns.
         * Those call sites are expected to pass `show=` instead; warn when one forgets.
         */
        if (import.meta.env.DEV && contextRead === undefined) {
            console.warn(
                `DisplayRow path="${path}" has no AccessFields ancestor, so it is hidden and ` +
                    `counted as restricted. Pass show={...} outside an EntityCard shell.`,
            );
        }
        allowed = contextRead !== undefined && accessFieldPathExists(contextRead, path);
    }

    useRestrictedField(id, labelText, !allowed);

    /* `TruncatedValue` only shows this once the box actually overflows, so formatting it eagerly
       on every render paid for a date/currency format that is usually never read. */
    const tooltipValueText = useMemo(
        () => (dontRenderValue ? "" : displayPlainText(value, type, {timeZone, format})),
        [dontRenderValue, value, type, timeZone, format],
    );

    if (!allowed) return null;

    return (
        <Item
            size="xs"
            role="listitem"
            className={cn("w-fit max-w-full min-w-0 flex-nowrap gap-1 border-0 p-0 text-muted-foreground", className)}
        >
            {(iconReplacement || Icon) && (
                <ItemMedia variant="icon">
                    <TooltipDisplayer tooltipRender={tooltipRender} tooltip={tooltipText}>
                        <div>{iconReplacement ? iconReplacement : !!Icon && <Icon size={18} />}</div>
                    </TooltipDisplayer>
                </ItemMedia>
            )}
            <span className="shrink-0 text-sm font-medium">
                {labelText}
                {!dontRenderValue && ":"}
            </span>
            {!dontRenderValue && (
                <div className="min-w-0 hover:cursor-default">
                    <TruncatedValue text={tooltipValueText}>
                        <DisplayValue
                            value={value}
                            type={type}
                            languageKeyCategory={languageKeyCategory}
                            format={format}
                            size={size}
                            show
                        >
                            {children}
                        </DisplayValue>
                    </TruncatedValue>
                </div>
            )}
        </Item>
    );
}
