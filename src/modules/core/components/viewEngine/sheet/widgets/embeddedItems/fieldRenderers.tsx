import {Suspense, useState, type ComponentType, type ReactNode} from "react";
import type {Media} from "armonia/src/modules/core/types";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import ExpandableText from "@coreModule/components/viewEngine/widgets/display/expandableText.tsx";
import DisplayCard, {type DisplayCardLinkedSheetOuterProps} from "@coreModule/components/viewEngine/widgets/display/displayCard.tsx";
import TruncatedValue from "@coreModule/components/viewEngine/widgets/display/truncatedValue.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {Item, ItemActions, ItemMedia} from "@coreModule/components/ui/item.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {IconLink} from "@tabler/icons-react";
import {resolveIcon, resolveWidget} from "../../../widgetRegistry.ts";
import {embeddedFieldReadable} from "../../../engine/access.ts";
import type {AccessMap} from "../../../engine/types.ts";
import {resolvePath} from "../../../engine/refs.ts";
import {linkedReferenceSheet, type LinkedReferenceSheet} from "../../linkedSheet/linkedSheetHost.tsx";
import SheetMediaFilesStrip from "../sheetMediaFilesStrip.tsx";
import {
    hrefForText,
    resolveEmbeddedFieldText,
    resolveLinkedRefStub,
    type EmbeddedItemFieldConfig,
} from "./fieldText.ts";

function resourceHasPositiveRead(read: unknown): boolean {
    return (
        read === true ||
        (!!read && typeof read === "object" && Object.keys(read as object).length > 0)
    );
}

function linkedRefDisplay(
    item: Record<string, any>,
    field: EmbeddedItemFieldConfig,
    stub: Record<string, any>,
    resolveSheet: ResolveLanguageKey,
): string {
    if (field.valuePath?.length) {
        return resolveEmbeddedFieldText(item, field, resolveSheet);
    }
    if (typeof stub.name === "string") return stub.name;
    if (typeof stub.title === "string") return stub.title;
    return String(stub._id ?? "");
}

function buildLinkedReferenceSheet(
    item: Record<string, any>,
    field: EmbeddedItemFieldConfig,
    resolveSheet: ResolveLanguageKey,
): {sheet: LinkedReferenceSheet; display: string} | null {
    const stub = resolveLinkedRefStub(item, field);
    if (!stub) return null;
    const id = stub._id as string;
    const widgetToken = field.linkedSheetWidget?.startsWith("#") ? field.linkedSheetWidget : "";
    const model = field.linkedSheetModel ?? "";
    const display = linkedRefDisplay(item, field, stub, resolveSheet);
    if (!(widgetToken && resolveWidget(widgetToken) && model && id)) return null;
    return {
        display,
        sheet: linkedReferenceSheet(model, {
            widgetToken,
            fetchId: id,
            entityProp: field.linkedSheetEntityProp || "entity",
            entity: Object.keys(stub).length > 1
                ? {...stub}
                : {_id: id, ...(display ? {title: display, name: display} : {})},
        }),
    };
}

/** Readable empty value → `ValueNotSet`. Unreadable field → locked placeholder. */
function FieldGap({allowed}: {allowed: boolean}) {
    return allowed ? <ValueNotSet /> : <HiddenElement showLock />;
}

function fieldAllowed(access: AccessMap | undefined, listPath: string | undefined, field: EmbeddedItemFieldConfig): boolean {
    return embeddedFieldReadable(access, listPath, field.name);
}

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
    access?: AccessMap,
    listPath?: string,
) {
    const allowed = fieldAllowed(access, listPath, field);
    const value = allowed ? resolvePath(item, field.name) : undefined;
    const media = Array.isArray(value) ? value : value != null && typeof value === "object" ? [value] : [];
    const label = field.labelKey ? resolveSheet(field.labelKey) : null;
    if (!allowed || media.length === 0) {
        return (
            <div key={key} className={cn("min-w-0 flex flex-col gap-1", cardColumns && "col-span-full")}>
                {label ? <span className="text-xs font-medium text-muted-foreground">{label}</span> : null}
                <FieldGap allowed={allowed} />
            </div>
        );
    }
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
    access?: AccessMap,
    listPath?: string,
) {
    const allowed = fieldAllowed(access, listPath, field);
    const built = allowed ? buildLinkedReferenceSheet(item, field, resolveSheet) : null;
    const stub = allowed ? resolveLinkedRefStub(item, field) : null;
    const display = built?.display
        ?? (stub ? linkedRefDisplay(item, field, stub, resolveSheet) : "");
    const title = field.labelKey ? String(resolveSheet(field.labelKey)) : (display || field.name);

    return (
        <div key={key} className="min-w-0">
            <DisplayCard
                show={allowed}
                locked={!allowed}
                title={title}
                tooltip={title}
                Icon={field.icon ? (resolveIcon(field.icon) ?? undefined) : undefined}
                value={field.labelKey ? display : null}
                dontRenderValue={!field.labelKey && !!display}
                linkedReferenceSheet={built?.sheet}
            />
        </div>
    );
}

/**
 * Entity-card body `linkedRef`: same compact row as other body fields, with a trailing
 * sheet-open link (DisplayCard's IconLink badge) instead of a nested DisplayCard tile.
 */
export function renderEntityCardLinkedRefField(
    item: Record<string, any>,
    field: EmbeddedItemFieldConfig,
    resolveSheet: ResolveLanguageKey,
    key: string | number,
    access?: AccessMap,
    listPath?: string,
): ReactNode {
    const allowed = fieldAllowed(access, listPath, field);
    const built = allowed ? buildLinkedReferenceSheet(item, field, resolveSheet) : null;
    const stub = allowed ? resolveLinkedRefStub(item, field) : null;
    const display = built?.display
        ?? (stub ? linkedRefDisplay(item, field, stub, resolveSheet) : "");
    const label =
        typeof field.labelKey === "string" && field.labelKey.length > 0
            ? String(resolveSheet(field.labelKey))
            : null;
    const Icon = field.icon ? resolveIcon(field.icon) ?? undefined : undefined;

    return (
        <EmbeddedEntityCardLinkedRefRow
            key={key}
            label={label}
            value={display}
            gap={display ? undefined : <FieldGap allowed={allowed} />}
            Icon={Icon}
            linkedReferenceSheet={built?.sheet}
        />
    );
}

function EmbeddedEntityCardLinkedRefRow({
    label,
    value,
    gap,
    Icon,
    linkedReferenceSheet,
}: {
    label: string | null;
    value: string;
    gap?: ReactNode;
    Icon?: ComponentType<{size?: number | string; className?: string}>;
    linkedReferenceSheet?: LinkedReferenceSheet;
}) {
    const [linkedSheetOpen, setLinkedSheetOpen] = useState(false);
    const accessResourceId = linkedReferenceSheet?.resourceId ?? "";
    const LinkedSheet = linkedReferenceSheet?.LinkedSheet;
    const linkedAccess = useAccess(accessResourceId);
    const showLinkedBadge =
        linkedReferenceSheet != null &&
        LinkedSheet != null &&
        accessResourceId.length > 0 &&
        resourceHasPositiveRead(linkedAccess.read);
    const linkLabel = label ?? value;

    return (
        <>
            <Item
                size="xs"
                role="listitem"
                className="w-fit max-w-full min-w-0 flex-nowrap gap-1 border-0 p-0 text-muted-foreground"
            >
                {Icon ? (
                    <ItemMedia variant="icon">
                        <Icon size={18} />
                    </ItemMedia>
                ) : null}
                {label ? <span className="shrink-0 text-sm font-medium">{label}:</span> : null}
                <div className="min-w-0 hover:cursor-default text-sm text-foreground">
                    {gap ?? <TruncatedValue text={value}>{value}</TruncatedValue>}
                </div>
                {showLinkedBadge && LinkedSheet != null ? (
                    <ItemActions className="shrink-0">
                        <TooltipDisplayer tooltip={linkLabel}>
                            <button
                                type="button"
                                className={cn(
                                    "shrink-0 size-5 p-0 flex items-center justify-center rounded border border-border",
                                    "bg-background text-muted-foreground",
                                    "hover:bg-muted hover:text-foreground hover:cursor-pointer",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                )}
                                aria-label={linkLabel}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLinkedSheetOpen(true);
                                }}
                            >
                                <IconLink size={12} />
                            </button>
                        </TooltipDisplayer>
                    </ItemActions>
                ) : null}
            </Item>
            {LinkedSheet != null && linkedReferenceSheet != null && linkedSheetOpen ? (
                <Suspense fallback={null}>
                    <LinkedSheet
                        {...linkedReferenceSheet.linkedSheetProps}
                        {...({
                            open: true,
                            onLinkedDeleted: () => {
                                setLinkedSheetOpen(false);
                            },
                            onOpenChange: (next: boolean) => {
                                if (!next) setLinkedSheetOpen(false);
                            },
                        } satisfies DisplayCardLinkedSheetOuterProps)}
                    />
                </Suspense>
            ) : null}
        </>
    );
}

export function renderScalarEmbeddedField(
    item: Record<string, any>,
    field: EmbeddedItemFieldConfig,
    resolveSheet: ResolveLanguageKey,
    key: string | number,
    cardColumns: number | undefined,
    access?: AccessMap,
    listPath?: string,
) {
    const allowed = fieldAllowed(access, listPath, field);
    const text = allowed ? resolveEmbeddedFieldText(item, field, resolveSheet) : "";
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
                        show={allowed}
                        locked={!allowed}
                        title={label ? String(label) : (text || field.name)}
                        tooltip={label ? String(label) : (text || field.name)}
                        Icon={Icon}
                        value={text}
                        expandable={!!text}
                        maxLength={250}
                    />
                </div>
            );
        }
        if (!allowed || !text) {
            return (
                <div key={key} className={wrapClass}>
                    {label ? <span className="text-sm">{label}: </span> : null}
                    <FieldGap allowed={allowed} />
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
                    show={allowed}
                    locked={!allowed}
                    title={label ? String(label) : (text || field.name)}
                    tooltip={label ? String(label) : (text || field.name)}
                    Icon={flagCode ? undefined : Icon}
                    flagCode={flagCode}
                    value={text}
                    externalHref={href ?? undefined}
                />
            </div>
        );
    }

    if (!allowed || !text) {
        return (
            <div key={key} className={cn(field.className ?? "text-sm", "min-w-0")}>
                {label ? <span>{label}: </span> : null}
                <FieldGap allowed={allowed} />
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
