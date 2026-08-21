import {useId, type ComponentType, type ReactNode} from "react";
import {useSelector} from "react-redux";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Item, ItemMedia} from "@coreModule/components/ui/item.tsx";
import {useRestrictedField} from "@coreModule/components/custom/infoRowGroup.tsx";
import {accessFieldPathExists} from "@coreModule/helpers/hocs/withAccess.tsx";
import {formatDate} from "@coreModule/helpers/general";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {useAccessFieldsRead} from "./accessFields.tsx";
import DisplayValue, {type DisplayValueType} from "./displayValue.tsx";
import TruncatedValue from "./truncatedValue.tsx";

export type DisplayRowIcon = ComponentType<{size?: number | string; className?: string}>;

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
};

const DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {
    ...DATE_FORMAT,
    hour: "2-digit",
    minute: "2-digit",
};

const DATE_ONLY_ISO = /^\d{4}-\d{2}-\d{2}$/;

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
    hideTitle?: boolean;
    className?: string;
    dontRenderValue?: boolean;
    children?: (formatted: ReactNode) => ReactNode;
};

/**
 * Card-body label/value row. A denied field is omitted and reported to
 * `InfoRowGroup`. Allowed values go through `DisplayValue`.
 */
export default function DisplayRow({
    icon: Icon,
    iconReplacement,
    tooltip,
    tooltipRender,
    label,
    value,
    hideTitle,
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
    const timeZone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const labelText = typeof label === "string" ? label : "";
    const tooltipText = typeof tooltip === "string" ? tooltip : undefined;

    let allowed = true;
    if (showProp !== undefined) {
        allowed = showProp;
    } else if (path && (path === "statistics" || path.startsWith("statistics."))) {
        // Computed aggregates — not model ACL keys. Backend decides the payload.
        allowed = true;
    } else if (path) {
        allowed = contextRead !== undefined && accessFieldPathExists(contextRead, path);
    }

    useRestrictedField(id, labelText, !allowed);

    if (!allowed) return null;

    return (
        <Item
            size="xs"
            role="listitem"
            className={cn("w-fit max-w-full min-w-0 flex-nowrap gap-1 border-0 p-0 text-muted-foreground", className)}
        >
            {(iconReplacement || Icon) && (
                <ItemMedia variant="icon">
                    <TooltipDisplayer tooltipRender={tooltipRender ? tooltipRender : undefined} tooltip={tooltipText}>
                        <div>{iconReplacement ? iconReplacement : !!Icon && <Icon size={18} />}</div>
                    </TooltipDisplayer>
                </ItemMedia>
            )}
            {!hideTitle && (
                <span className="shrink-0 text-sm font-medium">
                    {labelText}
                    {!dontRenderValue && ":"}
                </span>
            )}
            {!dontRenderValue && (
                <div className="min-w-0 hover:cursor-default">
                    <TruncatedValue text={plainTooltipText(value, type, timeZone, format)}>
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

function plainTooltipText(
    value: unknown,
    type?: DisplayValueType,
    timeZone?: string,
    format?: Intl.DateTimeFormatOptions,
): string {
    if (value == null || value === "") return "";
    if (type === "date" || type === "dateTime") {
        return formatTemporalTooltip(value, type, timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone, format);
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    if (typeof value === "object" && !Array.isArray(value) && ("prefix" in value || "number" in value)) {
        const {prefix, number} = value as {prefix?: string; number?: string};
        return `${prefix || ""} ${number || ""}`.trim();
    }
    if (typeof value === "object" && !Array.isArray(value) && ("name" in value || "surname" in value)) {
        const {name, surname} = value as {name?: string; surname?: string};
        return [name, surname]
            .map((part) => (typeof part === "string" ? part.trim() : ""))
            .filter(Boolean)
            .join(" ");
    }
    if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        ("amount" in value || "currency" in value || "symbol" in value || "abbreviation" in value)
    ) {
        const obj = value as {
            amount?: unknown;
            number?: unknown;
            currency?: {symbol?: string; abbreviation?: string};
            symbol?: string;
            abbreviation?: string;
        };
        const amount = obj.amount ?? obj.number;
        const amountText =
            typeof amount === "number" && Number.isFinite(amount)
                ? amount.toFixed(2)
                : typeof amount === "string"
                  ? amount
                  : "";
        const symbol =
            (typeof obj.currency?.symbol === "string" && obj.currency.symbol.trim()) ||
            (typeof obj.symbol === "string" && obj.symbol.trim()) ||
            (typeof obj.currency?.abbreviation === "string" && obj.currency.abbreviation.trim()) ||
            (typeof obj.abbreviation === "string" && obj.abbreviation.trim()) ||
            "";
        return [symbol, amountText].filter(Boolean).join(" ");
    }
    return "";
}

/** Match `DisplayValue` date/dateTime formatting so truncated hover copy matches the cell. */
function formatTemporalTooltip(
    value: unknown,
    mode: "date" | "dateTime",
    timeZone: string,
    format?: Intl.DateTimeFormatOptions,
): string {
    const dateOnly = typeof value === "string" && DATE_ONLY_ISO.test(value);
    const d =
        value instanceof Date
            ? value
            : typeof value === "string" || typeof value === "number"
              ? new Date(value)
              : null;
    if (!d || Number.isNaN(d.getTime())) return typeof value === "string" ? value : "";
    return (
        formatDate(d, {
            timeZone: dateOnly && mode === "date" ? "UTC" : timeZone,
            format: format ?? (mode === "dateTime" ? DATE_TIME_FORMAT : DATE_FORMAT),
        }) || (typeof value === "string" ? value : "")
    );
}
