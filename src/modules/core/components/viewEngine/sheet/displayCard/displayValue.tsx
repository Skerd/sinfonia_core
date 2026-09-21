import type {ReactNode} from "react";
import type {FieldBinding} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {formatNumber} from "@coreModule/helpers/general/numbers.ts";
import {MdiIcon} from "@coreModule/components/custom/mdiIcons/mdiIcon.tsx";
import {filterAccessibleValuePath} from "../../engine/access.ts";
import {affix, currencyStubFromValuePath, currencyStubText, formatTemporal} from "../../engine/format.ts";
import {resolvePath} from "../../engine/refs.ts";
import type {ViewRendererContext, WidgetProps} from "../../engine/types.ts";
import {wpRecord, wpText} from "../../engine/widgetProps.ts";
import {currencyList, stringBadgeList} from "./valueLists.tsx";

export type DisplayCardValue = {
    value: unknown;
    /** `DisplayValue` type for the card; cleared when a currency stub was baked into text. */
    type: string | undefined;
};

/**
 * `valuePath` segments under `parent` (the row when absent), joined or first-truthy.
 * Currency cards get a `{amount, currency}` stub instead: `DisplayValue` rejects "€ 123".
 */
function valueFromPaths(wp: WidgetProps, ctx: ViewRendererContext, data: Record<string, any>, displayType: string | undefined): unknown {
    const parentPath = wpText(wp, "parent");
    const parent = wp.parent ? resolvePath(data, wp.parent) : data;
    // A missing linked parent is an empty value, not a reason to drop the card (use `dependent` for that).
    if (!parent) return null;

    const rawPaths = (wp.valuePath as unknown[]).filter((p): p is string => typeof p === "string" && p.length > 0);
    const paths = parentPath ? filterAccessibleValuePath(ctx.access, parentPath, rawPaths) : rawPaths;
    if (paths.length === 0) return null;

    if (displayType === "currency" && !wp.pickFirstTruthyValuePath) {
        return currencyStubFromValuePath(parent, paths);
    }

    const categories = wpRecord<Record<string, string>>(wp, "languageKeyCategoriesByPath");
    const parts = paths.map((path) => {
        let part: unknown = resolvePath(parent, path);
        const category = categories?.[path] ?? categories?.[path.split(".")[0]];
        if (category && typeof part === "string" && part.length > 0) {
            part = ctx.resolveLanguageKey(`${category}.${part}`);
        }
        if (wp.format === "locale" && typeof part === "number") {
            part = formatNumber(part);
        }
        return part;
    });

    if (wp.pickFirstTruthyValuePath) {
        return parts.find((part) => part != null && part !== "") ?? null;
    }
    return parts.filter((part) => part != null && part !== "").join(wp.joinSeparator ?? " ");
}

function rawValue(
    binding: FieldBinding,
    ctx: ViewRendererContext,
    displayType: string | undefined,
    skipPreFormat: boolean,
): unknown {
    const wp = binding.widgetProps ?? {};
    const {data} = ctx;
    const at = () => (data ? resolvePath(data, binding.name) : undefined);

    switch (wp.valueType) {
        case "currencyList":
            return data ? currencyList(at(), wp, ctx.resolveLanguageKey) : null;
        case "stringBadgeList":
            return data ? stringBadgeList(at(), wp.maxItems) : null;
    }
    if (wp.valueType === "mdiIcon" && data && !skipPreFormat) {
        const icon = at();
        return icon == null || icon === "" ? null : <MdiIcon icon={String(icon)} size={0.7} showFallback />;
    }
    if (Array.isArray(wp.valuePath) && data) {
        return valueFromPaths(wp, ctx, data, displayType);
    }
    return at();
}

const isPlain = (v: unknown): v is string | number => typeof v === "string" || typeof v === "number";

/**
 * The value a `#DisplayCard` shows, in pipeline order:
 * raw value → `bodyWidget` → number/date format → language category → yes/no → prefix/suffix
 * → currency stub text.
 *
 * A display `type` or a `bodyWidget` owns formatting, so the pre-format steps are skipped for
 * them (the language category still applies, except to `enum` cards which translate themselves).
 */
export function resolveDisplayCardValue(
    binding: FieldBinding,
    ctx: ViewRendererContext,
    renderBody: (token: string) => ReactNode | undefined,
): DisplayCardValue {
    const wp = binding.widgetProps ?? {};
    const displayType = wpText(wp, "type");
    const bodyWidget = wpText(wp, "bodyWidget");
    const skipPreFormat = !!displayType || !!bodyWidget;
    const t = ctx.resolveLanguageKey;

    let value = rawValue(binding, ctx, displayType, skipPreFormat);

    if (bodyWidget) {
        const body = renderBody(bodyWidget);
        if (body !== undefined) value = body;
    }

    if (!skipPreFormat && value != null) {
        if (wp.format === "locale" && typeof value === "number") {
            value = formatNumber(value);
        }
        if (wp.format === "date" || wp.format === "dateTime") {
            value = formatTemporal(value, wp.format);
        }
    }

    const category = wpText(wp, "languageKeyCategory");
    if (category && displayType !== "enum") {
        if (typeof value === "string" && value.length > 0) {
            value = t(`${category}.${value}`);
        } else if (typeof value === "boolean") {
            value = t(`${category}.${value ? "true" : "false"}`);
        }
    }

    if (!skipPreFormat && wp.valueType === "boolean") {
        if (typeof value === "boolean") value = t(value ? "yes" : "no");
        else if (value === "true" || value === "false") value = t(value === "true" ? "yes" : "no");
    }

    if (!skipPreFormat && isPlain(value) && (wp.prefix || wp.suffix)) {
        value = affix(String(value), wp.prefix, wp.suffix);
    }

    // Currency stubs skip the text affixes above; with an affix they are baked into plain text.
    if (displayType === "currency" && (wp.prefix || wp.suffix)) {
        const text = currencyStubText(value);
        if (text != null) {
            return {value: affix(text, wp.prefix, wp.suffix), type: undefined};
        }
    }

    return {value, type: displayType};
}
