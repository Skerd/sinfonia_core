import {useId, type ComponentType, type ReactNode} from "react";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Item, ItemMedia} from "@coreModule/components/ui/item.tsx";
import {useRestrictedField} from "@coreModule/components/custom/infoRowGroup.tsx";
import {accessFieldPathExists} from "@coreModule/helpers/hocs/withAccess.tsx";
import {useAccessFieldsRead} from "./accessFields.tsx";
import DisplayValue, {type DisplayValueType} from "./displayValue.tsx";
import TruncatedValue from "./truncatedValue.tsx";

export type DisplayRowIcon = ComponentType<{size?: number | string; className?: string}>;

type DisplayRowProps = {
    /** Wins over `path`. */
    show?: boolean;
    path?: string;
    type?: DisplayValueType;
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
 * Card-body label/value row. ACL matches `InfoRow`: a denied field is omitted
 * and reported to `InfoRowGroup`. Allowed values go through `DisplayValue`.
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
    format,
    size,
    dontRenderValue = false,
    children,
}: DisplayRowProps) {
    const id = useId();
    const contextRead = useAccessFieldsRead();

    let allowed = true;
    if (showProp !== undefined) {
        allowed = showProp;
    } else if (path) {
        allowed = contextRead !== undefined && accessFieldPathExists(contextRead, path);
    }

    useRestrictedField(id, label, !allowed);

    if (!allowed) return null;

    return (
        <Item
            size="xs"
            role="listitem"
            className={cn("w-fit max-w-full min-w-0 flex-nowrap gap-1 border-0 p-0 text-muted-foreground", className)}
        >
            {(iconReplacement || Icon) && (
                <ItemMedia variant="icon">
                    <TooltipDisplayer tooltipRender={tooltipRender ? tooltipRender : undefined} tooltip={tooltip}>
                        <div>{iconReplacement ? iconReplacement : !!Icon && <Icon size={18} />}</div>
                    </TooltipDisplayer>
                </ItemMedia>
            )}
            {!hideTitle && (
                <span className="shrink-0 text-sm font-medium">
                    {label}
                    {!dontRenderValue && ":"}
                </span>
            )}
            {!dontRenderValue && (
                <div className="min-w-0 hover:cursor-default">
                    <TruncatedValue text={plainTooltipText(value)}>
                        <DisplayValue value={value} type={type} format={format} size={size} show>
                            {children}
                        </DisplayValue>
                    </TruncatedValue>
                </div>
            )}
        </Item>
    );
}

function plainTooltipText(value: unknown): string {
    if (value == null || value === "") return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    if (typeof value === "object" && !Array.isArray(value) && ("prefix" in value || "number" in value)) {
        const {prefix, number} = value as {prefix?: string; number?: string};
        return `${prefix || ""} ${number || ""}`.trim();
    }
    return "";
}
