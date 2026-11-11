import DisplayCard from "@coreModule/components/viewEngine/widgets/display/displayCard.tsx";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {formatCurrency} from "@coreModule/helpers/general/numbers.ts";
import {bootstrapLinkedSheetData, resolvePath} from "../../../engine/refs.ts";
import {iconOrUndefined} from "../../../registry/icons.ts";
import {linkedReferenceSheet} from "../../linkedSheet/linkedSheetHost.tsx";
import {resolveWidget} from "../../../widgetRegistry.ts";

/**
 * How a compact-row part is shown: a calendar date, a date with its time (both in the app language, GLB-09), or an
 * amount in the currency found at `money` on the same row (`{money: "currency"}`).
 */
export type ReferenceCompactValueFormat = "date" | "dateTime" | {money: string};

export type ReferenceCompactRowConfig = {
    /** Tabler icon token, e.g. `#ClipboardList`. */
    icon?: string;
    /** Language key for the row label (e.g. `inspection`). */
    label: string;
    valuePath: string[];
    /**
     * Optional parallel list to `valuePath`: when set, that segment is resolved via
     * `resolveLanguageKey(\`${category}.${raw}\`)` (falls back to raw when missing).
     */
    valueLanguageKeyCategories?: (string | null | undefined)[];
    /** Optional parallel list to `valuePath`: how each segment is formatted (dates, money). */
    valueFormats?: (ReferenceCompactValueFormat | null | undefined)[];
    /**
     * The row's title from the row itself (e.g. its date) instead of the fixed `label`, which stays the fallback.
     * Several paths make a range ("Dec 1, 14:30 → Dec 6, 10:15"), joined by `labelJoinSeparator` (default " → ").
     */
    labelPath?: string | string[];
    labelFormat?: ReferenceCompactValueFormat;
    labelJoinSeparator?: string;
    joinSeparator?: string;
    linkedSheetModel: string;
    linkedSheetWidget: string;
    linkedSheetEntityProp: string;
};

const DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {...DATE_FORMATS.mediumDate, hour: "2-digit", minute: "2-digit"};

/** One raw value as text: formatted when a format is given, translated (each item of a list) under a category. */
function partText(raw: unknown, stub: Record<string, any>, t: ResolveLanguageKey, category?: string | null, format?: ReferenceCompactValueFormat | null): string | null {
    if (raw == null || raw === "") return null;
    if (format === "date" || format === "dateTime") {
        const text = formatDate(String(raw), {format: format === "date" ? DATE_FORMATS.mediumDate : DATE_TIME_FORMAT});
        return text || null;
    }
    if (format && typeof format === "object" && typeof raw === "number") {
        const code = resolvePath(stub, `${format.money}.abbreviation`);
        return typeof code === "string" && code ? formatCurrency(raw, code) : String(raw);
    }
    const translate = (value: string) => {
        if (!category) return value;
        const key = `${category}.${value}`;
        const resolved = t(key);
        return resolved !== key ? String(resolved) : value;
    };
    if (Array.isArray(raw)) {
        const items = raw.filter((item): item is string => typeof item === "string" && item.length > 0).map(translate);
        return items.length ? items.join(", ") : null;
    }
    return typeof raw === "string" ? translate(raw) : String(raw);
}

/** `valuePath` segments of the stub, formatted and translated where configured, joined. */
function compactValue(stub: Record<string, any>, config: ReferenceCompactRowConfig, t: ResolveLanguageKey): string | null {
    const parts = config.valuePath
        .map((path, i) => partText(resolvePath(stub, path), stub, t, config.valueLanguageKeyCategories?.[i], config.valueFormats?.[i]))
        .filter((v): v is string => v != null && v !== "");
    return parts.length > 0 ? parts.join(config.joinSeparator ?? " ") : null;
}

/** A `#ReferencesRender` stub as one `#DisplayCard` row (compact mode) that opens its sheet. */
export function ReferenceStubCompactRow({
    stub,
    config,
    unitId,
    unitName,
    resolveLanguageKey,
    show,
}: {
    stub: Record<string, any>;
    config: ReferenceCompactRowConfig;
    unitId: string;
    unitName: string;
    resolveLanguageKey: ResolveLanguageKey;
    show: boolean;
}) {
    const id = stub._id as string;
    const titleParts = (Array.isArray(config.labelPath) ? config.labelPath : config.labelPath ? [config.labelPath] : [])
        .map((path) => partText(resolvePath(stub, path), stub, resolveLanguageKey, null, config.labelFormat))
        .filter((part): part is string => !!part);
    const label = titleParts.length ? titleParts.join(config.labelJoinSeparator ?? " → ") : String(resolveLanguageKey(config.label));
    const sheet =
        typeof id === "string" && id.length > 0 && resolveWidget(config.linkedSheetWidget)
            ? linkedReferenceSheet(config.linkedSheetModel, {
                  widgetToken: config.linkedSheetWidget,
                  fetchId: id,
                  entityProp: config.linkedSheetEntityProp,
                  entity: bootstrapLinkedSheetData(id, stub, typeof stub.name === "string" && stub.name ? stub.name : null),
                  props: {unitId, unitName},
              })
            : undefined;

    return (
        <DisplayCard
            show={show}
            title={label}
            tooltip={label}
            Icon={iconOrUndefined(config.icon)}
            value={compactValue(stub, config, resolveLanguageKey)}
            linkedReferenceSheet={sheet}
        />
    );
}
