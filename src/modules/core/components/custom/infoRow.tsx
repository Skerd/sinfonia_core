import {useId, type ComponentType, type ReactNode} from "react";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import {Item, ItemMedia} from "@coreModule/components/ui/item.tsx";
import {useRestrictedField} from "@coreModule/components/custom/infoRowGroup.tsx";

/**
 * Structural icon type. Callers mix `@tabler/icons-react` (the library named in
 * components.json) with `lucide-react`; typing this as `LucideIcon` only ever
 * compiled by coincidence of the two libraries sharing a prop shape.
 */
export type CardIcon = ComponentType<{size?: number | string; className?: string}>;

type InfoRowProps = {
    /** False when the current user has no read permission on the field. */
    show?: boolean;
    icon?: CardIcon;
    iconReplacement?: ReactNode;
    label: string;
    tooltip?: string;
    tooltipRender?: any;
    value: ReactNode;
    hideTitle?: boolean;
    className?: string;
    dontRenderValue?: boolean;
};

function hasValue(v: ReactNode): boolean {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "boolean") return v;
    return true;
}

/**
 * A single label/value pair in a card body, built on `ui/item.tsx` so the icon
 * slot, sizing and gap come from the same primitive as the rest of the list
 * surfaces. The `Item` padding, border and full width are overridden because
 * these rows flow and wrap inside a card body rather than standing alone as
 * list items.
 *
 * A row the user may not read renders nothing and reports itself to the
 * enclosing `InfoRowGroup`, which states the restriction once per card. The
 * previous per-row padlock repeated one sentence up to six times per card and
 * displaced the fields the user could actually read.
 */
export default function InfoRow({
    icon: Icon,
    iconReplacement,
    tooltip,
    tooltipRender,
    label,
    value,
    hideTitle,
    className,
    show = true,
    dontRenderValue = false,
}: InfoRowProps) {
    const id = useId();
    useRestrictedField(id, label, !show);

    if (!show) return null;

    return (
        <Item
            size="xs"
            role="listitem"
            className={cn("w-fit gap-1 border-0 p-0 text-muted-foreground", className)}
        >
            {/*
              * The icon carries the tooltip that explains the row, so it stays
              * visible on mobile: hiding it below `md` removed the explanation
              * exactly where the label has least room to speak for itself.
              */}
            {(iconReplacement || Icon) && (
                <ItemMedia variant="icon">
                    <TooltipDisplayer tooltipRender={tooltipRender ? tooltipRender : undefined} tooltip={tooltip}>
                        <div>{iconReplacement ? iconReplacement : !!Icon && <Icon size={18} />}</div>
                    </TooltipDisplayer>
                </ItemMedia>
            )}
            {!hideTitle && (
                <span className="text-sm font-medium">
                    {label}
                    {!dontRenderValue && ":"}
                </span>
            )}
            {/*
              * A div, not a p: callers pass flow content as `value` (project
              * investment totals render a flex row of currencies). Inside a
              * paragraph the browser closes the p early and the layout breaks.
              */}
            {!dontRenderValue && (
                <div className="min-w-0 hover:cursor-default">
                    {hasValue(value) ? value : <ValueNotSet />}
                </div>
            )}
        </Item>
    );
}
