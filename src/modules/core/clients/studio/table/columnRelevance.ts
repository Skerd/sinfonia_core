import type {
    TableColumnConfig,
} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import type {Relevance} from "../inspector/fieldRelevance.ts";

/**
 * Which column `meta` keys the table renderer actually reads, per cell type.
 *
 * `columnConfigToColumnDef` is the only consumer, and it is narrower than the contract
 * type suggests:
 *
 *  - `refDisplayKey` — read in the `objectId` branch and again in the `address` branch.
 *  - `maxInlineItems`, `hrefTemplate`, `avatarPath` — read **only** in the `objectId` branch. The enum
 *    branch hardcodes its own inline limit and never consults `maxInlineItems`.
 *  - `className` — applied to every column's header/cell meta, whatever the type.
 *  - `badgeMapping`, `dateFormat`, `timezonePath`, `componentKey`, `refPath` — read
 *    nowhere. The `badge` / `badgeMulti` branches that once used `badgeMapping` are
 *    commented out, and the date branch hardcodes `dateStyle` / `timeStyle`. They are
 *    listed in {@link INERT_META_KEYS} so a column that sets one is reported rather than
 *    given an editor that would quietly do nothing.
 */

export type ColumnInspectorKey =
    | "visible"
    | "sortable"
    | "filterable"
    | "cellType"
    | "dtoPath"
    | "meta.className"
    | "meta.refDisplayKey"
    | "meta.maxInlineItems"
    | "meta.hrefTemplate"
    | "meta.avatarPath";

export const COLUMN_INSPECTOR_KEYS: ColumnInspectorKey[] = [
    "visible",
    "sortable",
    "filterable",
    "cellType",
    "dtoPath",
    "meta.className",
    "meta.refDisplayKey",
    "meta.maxInlineItems",
    "meta.hrefTemplate",
    "meta.avatarPath",
];

/** `meta` keys the contract declares but no client code reads. */
export const INERT_META_KEYS = [
    "badgeMapping",
    "dateFormat",
    "timezonePath",
    "componentKey",
    "refPath",
] as const;

const PRIMARY: Relevance = {state: "primary"};

const OBJECT_ID_ONLY =
    "Only the objectId cell renderer reads this — other cell types ignore it.";

export function columnRelevanceFor(
    key: ColumnInspectorKey,
    column: TableColumnConfig,
): Relevance {
    const isObjectId = column.cellType === COLUMN_TYPE.OBJECT_ID;
    const isAddress = column.cellType === COLUMN_TYPE.ADDRESS;

    switch (key) {
        case "visible":
        case "sortable":
        case "filterable":
        case "cellType":
            return PRIMARY;

        case "dtoPath":
        case "meta.className":
            return {state: "advanced"};

        case "meta.refDisplayKey":
            return isObjectId || isAddress
                ? PRIMARY
                : {
                      state: "inapplicable",
                      reason: "Only the objectId and address cell renderers build a label from these paths.",
                  };

        case "meta.maxInlineItems":
        case "meta.hrefTemplate":
        case "meta.avatarPath":
            return isObjectId
                ? {state: "advanced"}
                : {state: "inapplicable", reason: OBJECT_ID_ONLY};
    }
}

export type ColumnDeadEntry = {
    /** Dotted key as the inspector names it, e.g. `meta.hrefTemplate`. */
    key: string;
    value: unknown;
    reason: string;
};

function isSet(value: unknown): boolean {
    if (value === undefined || value === null || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value as object).length > 0;
    return true;
}

/**
 * Meta this column sets that nothing will read — either wrong for its cell type, or a
 * contract key with no consumer at all.
 */
export function columnDeadEntries(column: TableColumnConfig): ColumnDeadEntry[] {
    const entries: ColumnDeadEntry[] = [];
    const meta = (column.meta ?? {}) as Record<string, unknown>;

    for (const key of COLUMN_INSPECTOR_KEYS) {
        if (!key.startsWith("meta.")) continue;
        const relevance = columnRelevanceFor(key, column);
        if (relevance.state !== "inapplicable") continue;
        const value = meta[key.slice("meta.".length)];
        if (!isSet(value)) continue;
        entries.push({key, value, reason: relevance.reason ?? "Not read for this cell type."});
    }

    for (const key of INERT_META_KEYS) {
        const value = meta[key];
        if (!isSet(value)) continue;
        entries.push({
            key: `meta.${key}`,
            value,
            reason: "Declared by the contract but read by no client code.",
        });
    }

    return entries;
}

/** Removes one `meta.*` key, dropping `meta` entirely once it is empty. */
export function clearColumnMetaKey(column: TableColumnConfig, key: string): TableColumnConfig {
    const leaf = key.startsWith("meta.") ? key.slice("meta.".length) : key;
    const meta = {...(column.meta ?? {})} as Record<string, unknown>;
    delete meta[leaf];
    return {
        ...column,
        meta: Object.keys(meta).length > 0
            ? (meta as unknown as TableColumnConfig["meta"])
            : undefined,
    };
}
