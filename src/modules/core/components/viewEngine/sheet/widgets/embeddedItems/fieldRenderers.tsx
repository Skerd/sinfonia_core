import type { Media } from "armonia/src/modules/core/types";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import ExpandableText from "@coreModule/components/viewEngine/widgets/display/expandableText.tsx";
import DisplayCard from "@coreModule/components/viewEngine/widgets/display/displayCard.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import { resolveIcon, resolveWidget } from "../../../widgetRegistry.ts";
import { resolvePath } from "../../../engine/refs.ts";
import { linkedReferenceSheet } from "../../linkedSheet/linkedSheetHost.tsx";
import SheetMediaFilesStrip from "../sheetMediaFilesStrip.tsx";
import {
    hrefForText,
    resolveEmbeddedFieldText,
    resolveLinkedRefStub,
    type EmbeddedItemFieldConfig,
} from "./fieldText.ts";

/* One configured field of an embedded item, as a tile, text line or linked card. */

export function ExternalTextLink({
    href,
    children,
    className,
}: {
    href: string;
    children: string;
    className?: string;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("text-primary underline-offset-2 hover:underline", className)}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </a>
    );
}

/** A `mediaStrip` field: the item's media as file tiles under an optional label. */
export function renderMediaStripField(
    item: Record<string, any>,
    field: EmbeddedItemFieldConfig,
    resolveSheet: ResolveLanguageKey,
    key: string | number,
    cardColumns: number | undefined,
) {
    const value = resolvePath(item, field.name);
    const media = Array.isArray(value) ? value : value != null && typeof value === "object" ? [value] : [];
    if (media.length === 0) return null;
    const label = field.labelKey ? resolveSheet(field.labelKey) : null;
    return (
        <div key={key} className={cn("min-w-0 flex flex-col gap-1", cardColumns && "col-span-full")}>
            {label ? <span className="text-xs font-medium text-muted-foreground">{label}</span> : null}
            <SheetMediaFilesStrip
                media={media as Media[]}
                resolveLanguageKey={resolveSheet}
                canDownload
                canRemove={false}
                isBig={false}
                className={field.className}
            />
        </div>
    );
}

/** A `linkedRef` field: a card that opens the referenced entity's sheet. */
export function renderLinkedRefField(
    item: Record<string, any>,
    field: EmbeddedItemFieldConfig,
    resolveSheet: ResolveLanguageKey,
    key: string | number,
    _cardColumns: number | undefined,
) {
    const stub = resolveLinkedRefStub(item, field);
    if (!stub) return null;
    const id = stub._id as string;
    const widgetToken = field.linkedSheetWidget?.startsWith("#") ? field.linkedSheetWidget : "";
    const model = field.linkedSheetModel ?? "";

    const display = field.valuePath?.length
        ? resolveEmbeddedFieldText(item, field, resolveSheet)
        : typeof stub.name === "string"
          ? stub.name
          : typeof stub.title === "string"
            ? stub.title
            : id;
    const title = field.labelKey ? String(resolveSheet(field.labelKey)) : display;

    const sheet =
        widgetToken && resolveWidget(widgetToken) && model && id
            ? linkedReferenceSheet(model, {
                  widgetToken,
                  fetchId: id,
                  entityProp: field.linkedSheetEntityProp || "entity",
                  // A bare ref shows its display text under both common title keys while it loads.
                  entity: Object.keys(stub).length > 1 ? {...stub} : {_id: id, ...(display ? {title: display, name: display} : {})},
              })
            : undefined;

    return (
        <div key={key} className="min-w-0">
            <DisplayCard
                show
                title={title}
                tooltip={title}
                Icon={field.icon ? (resolveIcon(field.icon) ?? undefined) : undefined}
                value={field.labelKey ? display : null}
                dontRenderValue={!field.labelKey}
                linkedReferenceSheet={sheet}
            />
        </div>
    );
}

export function renderScalarEmbeddedField(
    item: Record<string, any>,
    field: EmbeddedItemFieldConfig,
    resolveSheet: ResolveLanguageKey,
    key: string | number,
    cardColumns: number | undefined,
) {
    const text = resolveEmbeddedFieldText(item, field, resolveSheet);
    if (!text) return null;
    const label =
        typeof field.labelKey === "string" && field.labelKey.length > 0
            ? resolveSheet(field.labelKey)
            : null;
    const spanFull = Boolean(cardColumns);
    const wrapClass = spanFull ? "col-span-full min-w-0" : "min-w-0";

    if (field.type === "expandableText") {
        const Icon = field.icon ? resolveIcon(field.icon) ?? undefined : undefined;
        const asTile = Boolean(field.icon) || Boolean(cardColumns && label);
        if (asTile) {
            return (
                <div key={key} className={wrapClass}>
                    <DisplayCard
                        show
                        title={label ? String(label) : text}
                        tooltip={label ? String(label) : text}
                        Icon={Icon}
                        value={text}
                        expandable
                        maxLength={250}
                    />
                </div>
            );
        }
        const display = label ? `${label}: ${text}` : text;
        return (
            <div key={key} className={wrapClass}>
                <ExpandableText show className={field.className ?? "text-sm"}>
                    {display}
                </ExpandableText>
            </div>
        );
    }

    const href = hrefForText(text, field.type === "url");
    const Icon = field.icon ? resolveIcon(field.icon) ?? undefined : undefined;
    const flagCode =
        field.flagFromValue && /^[A-Za-z]{2}$/.test(text.trim())
            ? text.trim().toUpperCase()
            : undefined;
    const asTile = Boolean(field.icon) || Boolean(field.flagFromValue) || Boolean(cardColumns && label);

    if (asTile) {
        return (
            <div key={key} className="min-w-0">
                <DisplayCard
                    show
                    title={label ? String(label) : text}
                    tooltip={label ? String(label) : text}
                    Icon={flagCode ? undefined : Icon}
                    flagCode={flagCode}
                    value={text}
                    externalHref={href ?? undefined}
                />
            </div>
        );
    }

    const valueNode = href ? (
        <ExternalTextLink href={href} className={field.className ?? "text-sm"}>
            {text}
        </ExternalTextLink>
    ) : (
        text
    );
    return (
        <p key={key} className={href ? "text-sm min-w-0" : cn(field.className ?? "text-sm", "min-w-0")}>
            {label ? (
                <>
                    {label}: {valueNode}
                </>
            ) : (
                valueNode
            )}
        </p>
    );
}
