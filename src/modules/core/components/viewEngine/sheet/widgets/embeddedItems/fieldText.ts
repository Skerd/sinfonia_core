import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import { resolvePath } from "../../../engine/refs.ts";
import { formatTemporal } from "../../../engine/format.ts";

/*
 * Text and value logic for `#SheetEmbeddedItemsList` fields: what each configured field
 * shows for one item, and the compact summary line. Empty array entries still render.
 */

export type EmbeddedItemFieldConfig = {
    /** Dot-path within each item object (e.g. `"notes"`, `"media"`). */
    name: string;
    /** How to render this field's value. */
    type: "expandableText" | "text" | "url" | "mediaStrip" | "linkedRef";
    /** Extra Tailwind class applied to the rendered element. */
    className?: string;
    /** Sub-paths on `parent` (defaults to `name`) joined for display. */
    valuePath?: string[];
    /** Dot-path to the object that `valuePath` segments resolve on (defaults to `name`). */
    parent?: string;
    joinSeparator?: string;
    format?: "date" | "dateTime";
    languageKeyCategory?: string;
    /** Optional sheet language key prefixed before the value (e.g. `"Price: 5"`). */
    labelKey?: string;
    /**
     * Dot-path to a currency object on the item (`{symbol?, abbreviation?}`).
     * When set, the field value is shown as e.g. `€12.5` / `12.5 EUR`.
     */
    currencyField?: string;
    /** Linked-sheet wiring when `type` is `"linkedRef"`. */
    linkedSheetModel?: string;
    linkedSheetWidget?: string;
    linkedSheetEntityProp?: string;
    icon?: string;
    /** When true, the field value is an ISO country code shown as a flag in the icon slot. */
    flagFromValue?: boolean;
};

function normalizeExternalHref(href: string): string | null {
    const trimmed = href.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^\/\//.test(trimmed)) return `https:${trimmed}`;
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:/i.test(trimmed)) return null;
    return `https://${trimmed}`;
}

export function hrefForText(text: string, asUrlField: boolean): string | null {
    const trimmed = text.trim();
    if (!trimmed) return null;
    if (asUrlField) return normalizeExternalHref(trimmed);
    if (/^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)) return normalizeExternalHref(trimmed);
    return null;
}

function formatAmountWithCurrency(amountText: string, currency: unknown): string {
    const amount = amountText.trim();
    if (!amount) return "";
    if (!currency || typeof currency !== "object") return amount;
    const c = currency as {symbol?: unknown; abbreviation?: unknown};
    const symbol = typeof c.symbol === "string" ? c.symbol.trim() : "";
    const abbreviation = typeof c.abbreviation === "string" ? c.abbreviation.trim() : "";
    if (symbol) return `${symbol}${amount}`;
    if (abbreviation) return `${amount} ${abbreviation}`;
    return amount;
}

export function resolveEmbeddedFieldText(
    item: Record<string, any>,
    field: EmbeddedItemFieldConfig,
    resolveLanguageKey: ResolveLanguageKey,
): string {
    let raw: unknown;

    if (field.valuePath?.length) {
        const parentPath = field.parent ?? field.name;
        const parent = resolvePath(item, parentPath);
        if (parent == null || typeof parent !== "object") return "";
        const parts = field.valuePath.map((p) => resolvePath(parent as Record<string, any>, p));
        raw = parts.filter((part) => part != null && part !== "").join(field.joinSeparator ?? " ");
    } else {
        raw = resolvePath(item, field.name);
    }

    if (field.languageKeyCategory && typeof raw === "boolean") {
        const key = `${field.languageKeyCategory}.${raw ? "true" : "false"}`;
        const resolved = resolveLanguageKey(key);
        raw = resolved !== key ? resolved : raw;
    } else if (
        field.languageKeyCategory &&
        (typeof raw === "string" || typeof raw === "number") &&
        String(raw).trim()
    ) {
        const key = `${field.languageKeyCategory}.${String(raw).trim()}`;
        const resolved = resolveLanguageKey(key);
        if (resolved !== key) raw = resolved;
    }

    if (field.format === "date" || field.format === "dateTime") {
        return formatTemporal(raw, field.format) ?? "";
    }

    const text = String(raw ?? "").trim();
    if (field.currencyField) {
        return formatAmountWithCurrency(text, resolvePath(item, field.currencyField));
    }
    return text;
}

export function resolveLinkedRefStub(item: Record<string, any>, field: EmbeddedItemFieldConfig): Record<string, any> | null {
    const raw = resolvePath(item, field.parent ?? field.name);
    if (raw == null) return null;
    if (typeof raw === "string" && raw.length > 0) return {_id: raw};
    if (typeof raw === "object" && !Array.isArray(raw)) {
        const id = (raw as {_id?: unknown})._id;
        if (typeof id === "string" && id.length > 0) return raw as Record<string, any>;
    }
    return null;
}

export function buildCompactSummaryParts(
    item: Record<string, any>,
    fields: EmbeddedItemFieldConfig[],
    summaryFieldNames: string[],
    resolveLanguageKey: ResolveLanguageKey,
): {text: string; href: string | null}[] {
    return summaryFieldNames
        .map((name) => {
            const field = fields.find((f) => f.name === name);
            const text = field
                ? resolveEmbeddedFieldText(item, field, resolveLanguageKey)
                : String(item[name] ?? "").trim();
            if (!text) return null;
            return {text, href: hrefForText(text, field?.type === "url")};
        })
        .filter((part): part is {text: string; href: string | null} => part != null);
}

export function sortItems(
    items: Record<string, any>[],
    sortField?: string,
    sortDescending?: boolean,
): Record<string, any>[] {
    if (!sortField) return items;
    const sorted = [...items].sort((a, b) => {
        const av = resolvePath(a, sortField);
        const bv = resolvePath(b, sortField);
        const at = av != null ? new Date(av as string | number).getTime() : 0;
        const bt = bv != null ? new Date(bv as string | number).getTime() : 0;
        const aValid = Number.isFinite(at) ? at : 0;
        const bValid = Number.isFinite(bt) ? bt : 0;
        return sortDescending ? bValid - aValid : aValid - bValid;
    });
    return sorted;
}
