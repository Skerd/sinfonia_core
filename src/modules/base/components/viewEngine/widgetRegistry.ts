import type {ComponentType} from "react";
import type {
    AuditSinglePostHint,
    CompoundFormWidgetRenderer,
    SheetFieldRenderer,
    WidgetContribution,
} from "@coreModule/clients/panel/moduleContributions/widgetContribution.types.ts";
import {getSortedWidgetContributions} from "@coreModule/clients/panel/moduleContributions/loadWidgetContributions.ts";
import {getCoreWidgetContribution} from "./registry/coreContribution.ts";
import type {WidgetMeta} from "./widgetMeta.ts";

export {registerIcon, resolveIcon, type ViewConfigIcon} from "./registry/icons.ts";

/**
 * Token → everything the engine knows about a widget. Filled from core's own contribution
 * first, then each module's `widgetContribution` (sorted by `order`), so later entries win.
 */
const WIDGET_REGISTRY: Record<string, ComponentType<any>> = {};
/** Design-time descriptions (Studio only; an absent entry means "undescribed", not "unsupported"). */
const WIDGET_META: Record<string, WidgetMeta> = {};
/** Default prop name for `#ReferencesRender` when `itemDataProp` is omitted. */
const REFERENCES_DEFAULT_ITEM_PROP: Record<string, string> = {};
/** Module sheet-field renderers. Core's own live in `sheet/fields` and run after these. */
const SHEET_FIELD_RENDERERS: Record<string, SheetFieldRenderer> = {};
/** Form tokens that own their own FormField (default props). */
const COMPOUND_FORM_WIDGETS = new Set<string>();
/** Compound form tokens with their own props mapping. */
const COMPOUND_FORM_WIDGET_RENDERERS: Record<string, CompoundFormWidgetRenderer> = {};
/** Edit-form write gate keys for compound widgets that do not gate on their field name. */
const FORM_WRITE_ACCESS_KEYS: Record<string, string> = {};
/** Audit `singlePost` hints by widget / linked-sheet token. */
const AUDIT_SINGLE_POST_HINTS: Record<string, AuditSinglePostHint> = {};

let contributionsStatus: "idle" | "applying" | "done" = "idle";

function applyContribution(contribution: WidgetContribution): void {
    Object.assign(WIDGET_REGISTRY, contribution.widgets);
    Object.assign(WIDGET_META, contribution.widgetMeta);
    Object.assign(REFERENCES_DEFAULT_ITEM_PROP, contribution.referencesDefaultItemProps);
    Object.assign(SHEET_FIELD_RENDERERS, contribution.sheetFieldRenderers);
    Object.assign(AUDIT_SINGLE_POST_HINTS, contribution.auditSinglePostHints);
    Object.assign(COMPOUND_FORM_WIDGET_RENDERERS, contribution.compoundFormWidgetRenderers);
    Object.assign(FORM_WRITE_ACCESS_KEYS, contribution.formWriteAccessKeys);
    for (const token of [
        ...(contribution.compoundFormWidgets ?? []),
        ...Object.keys(contribution.compoundFormWidgetRenderers ?? {}),
    ]) {
        COMPOUND_FORM_WIDGETS.add(token);
    }
}

/**
 * Merges core and module contributions on first use. Deferred rather than done at import so
 * the card → sheet → renderer → registry import cycle has finished evaluating by then.
 */
function ensureContributionsApplied(): void {
    if (contributionsStatus !== "idle") {
        return;
    }
    contributionsStatus = "applying";
    applyContribution(getCoreWidgetContribution());
    for (const contribution of getSortedWidgetContributions()) {
        applyContribution(contribution);
    }
    contributionsStatus = "done";
}

export function resolveWidget(token: string): ComponentType<any> | null {
    ensureContributionsApplied();
    return WIDGET_REGISTRY[token] ?? null;
}

export function getRegisteredWidgetTokens(): string[] {
    ensureContributionsApplied();
    return Object.keys(WIDGET_REGISTRY);
}

/** Design-time description for a token, or `undefined` when it has none. */
export function getWidgetMeta(token: string): WidgetMeta | undefined {
    ensureContributionsApplied();
    return WIDGET_META[token];
}

export function getAllWidgetMeta(): Record<string, WidgetMeta> {
    ensureContributionsApplied();
    return WIDGET_META;
}

export function getReferencesDefaultItemProp(token: string): string | undefined {
    ensureContributionsApplied();
    return REFERENCES_DEFAULT_ITEM_PROP[token];
}

export function getSheetFieldRenderer(token: string): SheetFieldRenderer | undefined {
    ensureContributionsApplied();
    return SHEET_FIELD_RENDERERS[token];
}

/** Whether a form token manages its own `FormField` (must not be wrapped in another). */
export function isCompoundFormWidget(token: string): boolean {
    ensureContributionsApplied();
    return COMPOUND_FORM_WIDGETS.has(token);
}

export function getCompoundFormWidgetRenderer(token: string): CompoundFormWidgetRenderer | undefined {
    ensureContributionsApplied();
    return COMPOUND_FORM_WIDGET_RENDERERS[token];
}

/** The write key an edit form gates a compound widget on, when it is not the field name. */
export function getFormWriteAccessKey(token: string): string | undefined {
    ensureContributionsApplied();
    return FORM_WRITE_ACCESS_KEYS[token];
}

export function getAuditSinglePostHint(token: string): AuditSinglePostHint | undefined {
    ensureContributionsApplied();
    return AUDIT_SINGLE_POST_HINTS[token];
}

/*
 * Runtime registration. Contributions are merged first, so an explicit registration always
 * wins over a contributed entry for the same token.
 */

export function registerWidget(token: string, component: ComponentType<any>): void {
    ensureContributionsApplied();
    WIDGET_REGISTRY[token] = component;
}

export function registerWidgetMeta(token: string, meta: WidgetMeta): void {
    ensureContributionsApplied();
    WIDGET_META[token] = meta;
}

export function registerReferencesDefaultItemProp(token: string, itemDataProp: string): void {
    ensureContributionsApplied();
    REFERENCES_DEFAULT_ITEM_PROP[token] = itemDataProp;
}

export function registerSheetFieldRenderer(token: string, renderer: SheetFieldRenderer): void {
    ensureContributionsApplied();
    SHEET_FIELD_RENDERERS[token] = renderer;
}

export function registerAuditSinglePostHint(token: string, hint: AuditSinglePostHint): void {
    ensureContributionsApplied();
    AUDIT_SINGLE_POST_HINTS[token] = hint;
}
