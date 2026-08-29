import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {
    TableColumnConfig,
} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type";
import type {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import {flattenTree} from "../tree/nodeTreeOps.ts";
import type {CoveragePath} from "../coverage/viewCoverage.ts";

/**
 * Every field of a model in one list, with what the open configuration does about it.
 *
 * The coverage pane answers "what is this view missing"; this answers the question before
 * it — what fields exist at all, and which of them are on screen. Same universe as coverage
 * (the read/write allowlists, the thing maestro actually prunes against, not the table
 * columns, which are opt-in per schema path and cover a fraction of a model), but nothing is
 * dropped: rendered, unrendered, and bound-but-not-allowed all stay in the list, because a
 * list you can't see the answer in is not a list you can check a config against.
 */

export type FieldsMode = "view" | "table";

/**
 * Which allowlist decides what belongs in the list.
 *
 * `"writable"` is for edit forms, the one case where the read allowlist is not the subject:
 * maestro's `filterViewConfig` gates their fields on write, so a path this account can only
 * read is not a field the form could ever offer — listing it is noise in the one place the
 * list is meant to be a worklist. Paths the config *does* bind stay in regardless, marked
 * read-only, because a list that hides what the open config renders is worse than a long one.
 */
export type FieldScope = "all" | "writable";

/** Where a view binds a field. `nodeKey` is the tree's positional key, so it can be revealed. */
export type FieldRenderSite = {
    nodeKey: string;
    /** The node's `render` token, e.g. `#DisplayCard`. */
    render: string;
    /** The bound widget, e.g. `#Input`. */
    widget: string;
};

export type ModelField = {
    /** Dotted path, e.g. `currency.abbreviation`. */
    path: string;
    /** Last segment, for an indented list that does not repeat the parent on every row. */
    name: string;
    /** Dot count — the row's indent level. */
    depth: number;
    /** No other path in the universe extends this one, so it holds a value, not a subtree. */
    leaf: boolean;
    readable: boolean;
    writable: boolean;
    /** Nodes in the open view bound to this exact path. Empty in table mode. */
    renderedBy: FieldRenderSite[];
    /**
     * An ancestor is bound, so the value reaches the screen through that node without one of
     * its own — `address` bound as a card shows `address.city`.
     */
    coveredByAncestor: boolean;
    /** The table column for this path, when the schema opted one in. */
    column?: {id: string; visible: boolean; cellType: COLUMN_TYPE};
    /** Filter metadata off the column, which is what the scaffold reads to pick a widget. */
    ref?: string;
    apiUrl?: string;
    enumValues?: string[];
    /**
     * Bound (or columned) but in neither allowlist — a typo, or a virtual path the API
     * computes. Kept in the list precisely because it is the kind of thing you open a
     * field list to find.
     */
    inAllowlist: boolean;
};

export type ModelFieldsInput = {
    readPaths: string[];
    writePaths: string[];
    columns: TableColumnConfig[];
    /** The open view's nodes. Omitted for a table config, which binds nothing. */
    nodes?: ViewNode[];
    /** Defaults to `"all"`. See {@link FieldScope}. */
    scope?: FieldScope;
};

function renderSites(nodes: ViewNode[]): Map<string, FieldRenderSite[]> {
    const sites = new Map<string, FieldRenderSite[]>();
    for (const row of flattenTree(nodes)) {
        const field = row.node.field;
        if (!field?.name) continue;
        const list = sites.get(field.name) ?? [];
        list.push({nodeKey: row.key, render: row.node.render, widget: field.widget});
        sites.set(field.name, list);
    }
    return sites;
}

function hasBoundAncestor(path: string, bound: ReadonlySet<string>): boolean {
    const segments = path.split(".");
    for (let i = 1; i < segments.length; i++) {
        if (bound.has(segments.slice(0, i).join("."))) return true;
    }
    return false;
}

export function buildModelFields({
    readPaths,
    writePaths,
    columns,
    nodes = [],
    scope = "all",
}: ModelFieldsInput): ModelField[] {
    const readable = new Set(readPaths);
    const writable = new Set(writePaths);
    const columnById = new Map(columns.map((column) => [column.id, column]));
    const sites = renderSites(nodes);

    /*
     * `readable` and `writable` are still judged against both lists, so a bound read-only
     * path in a write-scoped list reads as read-only rather than as off-schema.
     */
    const listed =
        scope === "writable"
            ? [...writePaths, ...sites.keys()]
            : [...readPaths, ...writePaths, ...sites.keys(), ...columnById.keys()];

    /* Sorted, which for dotted paths puts every parent directly above its own children. */
    const universe = [...new Set(listed)].sort();

    return universe.map((path) => {
        const column = columnById.get(path);
        return {
            path,
            name: path.slice(path.lastIndexOf(".") + 1),
            depth: path.split(".").length - 1,
            leaf: !universe.some((other) => other !== path && other.startsWith(`${path}.`)),
            readable: readable.has(path),
            writable: writable.has(path),
            renderedBy: sites.get(path) ?? [],
            coveredByAncestor: hasBoundAncestor(path, new Set(sites.keys())),
            column: column
                ? {id: column.id, visible: column.visible, cellType: column.cellType}
                : undefined,
            ref: column?.filterConfig?.ref,
            apiUrl: column?.filterConfig?.apiUrl,
            enumValues: column?.filterConfig?.enumValues,
            inAllowlist: readable.has(path) || writable.has(path),
        };
    });
}

/** What "on screen" means for the open configuration: a bound node, or a column. */
export function isRendered(field: ModelField, mode: FieldsMode): boolean {
    return mode === "table" ? !!field.column : field.renderedBy.length > 0;
}

export type FieldStatusFilter = "all" | "rendered" | "missing";

export type FieldFilterOptions = {
    query?: string;
    status?: FieldStatusFilter;
    /** Hides the container paths (`address`) and keeps the ones holding a value. */
    leavesOnly?: boolean;
};

export function filterFields(
    fields: readonly ModelField[],
    mode: FieldsMode,
    {query = "", status = "all", leavesOnly = false}: FieldFilterOptions = {},
): ModelField[] {
    const needle = query.trim().toLowerCase();
    return fields.filter((field) => {
        if (leavesOnly && !field.leaf) return false;
        if (status === "rendered" && !isRendered(field, mode)) return false;
        if (status === "missing" && isRendered(field, mode)) return false;
        return !needle || field.path.toLowerCase().includes(needle);
    });
}

export type FieldsSummary = {
    total: number;
    rendered: number;
    missing: number;
    /** Bound or columned paths that are in neither allowlist. */
    unknown: number;
};

export function summarizeFields(fields: readonly ModelField[], mode: FieldsMode): FieldsSummary {
    const rendered = fields.filter((field) => isRendered(field, mode)).length;
    return {
        total: fields.length,
        rendered,
        missing: fields.length - rendered,
        unknown: fields.filter((field) => !field.inAllowlist).length,
    };
}

/** Hands a field to the scaffold, which speaks the coverage pane's shape. */
export function toCoveragePath(field: ModelField): CoveragePath {
    return {
        path: field.path,
        leaf: field.leaf,
        cellType: field.column?.cellType,
        ref: field.ref,
        apiUrl: field.apiUrl,
        enumValues: field.enumValues,
    };
}
