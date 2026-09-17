import {createElement, type ReactNode} from "react";
import type {FieldBinding} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {hasAccessPath} from "../../engine/access.ts";
import {bootstrapLinkedSheetData, normalizeObjectIdRef, resolvePath} from "../../engine/refs.ts";
import type {ViewRendererContext, WidgetProps} from "../../engine/types.ts";
import {wpRecord, wpString, wpText, wpToken} from "../../engine/widgetProps.ts";
import {resolveWidget} from "../../widgetRegistry.ts";
import {linkedReferenceSheet, unitContextProps, type LinkedReferenceSheet} from "../linkedSheet/linkedSheetHost.tsx";
import {resolveLinkedSheetTarget} from "../linkedSheet/resolveLinkedSheetTarget.ts";

const CARD_VARIANTS = new Set(["default", "success", "destructive", "warning", "info"]);

/**
 * Card colour: a static `variant`, overridden by `variantLookupMap[value at variantLookupField]`
 * (raw key, then lower-cased), overridden by the 0–10 rating bands of `variantFromRatingTenScale`.
 */
export function cardVariant(wp: WidgetProps, binding: FieldBinding, data: Record<string, any> | undefined): string | undefined {
    let variant = typeof wp.variant === "string" && CARD_VARIANTS.has(wp.variant) ? wp.variant : undefined;
    if (!data) return variant;

    const lookup = wpRecord<Record<string, unknown>>(wp, "variantLookupMap");
    if (wp.variantLookupField && lookup) {
        const key = resolvePath(data, wp.variantLookupField);
        if (typeof key === "string" || typeof key === "boolean" || typeof key === "number") {
            const mapped = lookup[String(key)] ?? (typeof key === "string" ? lookup[key.toLowerCase()] : undefined);
            if (typeof mapped === "string") variant = mapped;
        }
    }

    if (wp.variantFromRatingTenScale) {
        const rating = resolvePath(data, wpString(wp, "variantFromRatingPath") ?? binding.name);
        if (typeof rating === "number" && Number.isFinite(rating)) {
            variant = rating >= 8 ? "success" : rating >= 6 ? "warning" : "destructive";
        }
    }
    return variant;
}

/** Trimmed text at a readable path, for the icon-slot swaps. */
function readableText(ctx: ViewRendererContext, path: string | undefined): string | undefined {
    if (!path || !ctx.data || !hasAccessPath(ctx.access, path)) return undefined;
    return String(resolvePath(ctx.data, path) ?? "").trim() || undefined;
}

/**
 * Icon-slot replacements, each read only when the account may read its path (the server
 * already strips unreadable paths; this is the check the Studio's access simulator narrows).
 * Missing media falls back to the card's `icon`, so the card stays labelled.
 *
 * - `flagCodePath`: a country ref's ISO code → flag.
 * - `mdiIconPath`: an MDI icon name (`unitType.icon`).
 * - `avatarPath`: a media ref (`createdBy.photo`) → photo, named after the value or the label.
 */
export function iconSlot(wp: WidgetProps, ctx: ViewRendererContext, value: unknown, label: string) {
    const avatarPath = wpText(wp, "avatarPath");
    const mediaId =
        avatarPath && ctx.data && hasAccessPath(ctx.access, avatarPath)
            ? normalizeObjectIdRef(resolvePath(ctx.data, avatarPath))?.fetchId
            : undefined;
    return {
        flagCode: readableText(ctx, wpText(wp, "flagCodePath")),
        mdiIcon: readableText(ctx, wpText(wp, "mdiIconPath")),
        avatar: mediaId ? {mediaId, name: typeof value === "string" ? value : label} : undefined,
    };
}

/** `externalLink` turns a text value into an outbound link; `internalHrefTemplate` fills `{_id}` from the ref. */
export function cardLinks(wp: WidgetProps, binding: FieldBinding, data: Record<string, any> | undefined, value: unknown) {
    const externalHref = wp.externalLink === true && typeof value === "string" && value.trim() ? value.trim() : undefined;

    let internalHref: string | undefined;
    const template = typeof wp.internalHrefTemplate === "string" ? wp.internalHrefTemplate : "";
    if (template.trim()) {
        const refPath = wpString(wp, "linkedRefPath") ?? binding.name;
        const id = normalizeObjectIdRef(data ? resolvePath(data, refPath) : undefined)?.fetchId;
        if (id) internalHref = template.replaceAll("{_id}", id);
    }
    return {externalHref, internalHref};
}

/** `titleActions` token, or the references view-mode toggle for `showViewModeToggle`. */
export function headerActions(wp: WidgetProps, ctx: ViewRendererContext): ReactNode | undefined {
    const token = wpToken(wp, "titleActions") ?? (wp.showViewModeToggle === true ? "#ReferencesViewModeToggle" : undefined);
    const Actions = token ? resolveWidget(token) : null;
    if (!Actions) return undefined;
    return token === "#ReferencesViewModeToggle"
        ? createElement(Actions, {sheetLanguageKey: ctx.resolveLanguageKey})
        : createElement(Actions);
}

/**
 * Nested sheet for the ref at `linkedRefPath`. Deleting the entity there clears the ref on the
 * row (`ctx.unlinkEmbeddedRefPath`) so the card re-renders empty.
 */
export function cardLinkedSheet(
    wp: WidgetProps,
    ctx: ViewRendererContext,
    value: unknown,
): LinkedReferenceSheet | undefined {
    const linkedPath = wpText(wp, "linkedRefPath");
    const target = resolveLinkedSheetTarget(wp, ctx.data);
    if (!linkedPath || !target || !ctx.data || !resolveWidget(target.widgetToken)) return undefined;

    const raw = resolvePath(ctx.data, linkedPath);
    const id = normalizeObjectIdRef(raw)?.fetchId;
    if (!id) return undefined;

    return linkedReferenceSheet(target.model, {
        widgetToken: target.widgetToken,
        fetchId: id,
        entityProp: target.entityProp,
        entity: bootstrapLinkedSheetData(id, raw, value, target.valueField),
        props: unitContextProps(ctx.referenceCardUnitContext),
        onDelete: () => ctx.unlinkEmbeddedRefPath?.(linkedPath),
    });
}
