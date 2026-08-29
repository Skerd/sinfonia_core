import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {
    TableColumnConfig,
} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type";
import type {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import {flattenTree} from "../tree/nodeTreeOps.ts";

/**
 * What a view shows, against what the account is allowed to see.
 *
 * The universe of paths is the **access map**, not the table columns: table columns are
 * opt-in per schema path (`dynamicTableConfiguration`) and cover only a fraction of a
 * model, whereas the read/write allowlists are exactly what maestro prunes against. A
 * path missing from a sheet is therefore a field this account may read and this view
 * simply does not show.
 *
 * Columns are still useful — where one exists for a path it supplies the cell type, the
 * ref target and the select URL, which is what lets the scaffold pick a real widget.
 */

export type CoveragePath = {
    path: string;
    /** No other path in the universe extends this one, so it holds a value, not a subtree. */
    leaf: boolean;
    /** From the table column for this path, when the schema opted one in. */
    cellType?: COLUMN_TYPE;
    /** Derived filter metadata, used by the scaffold to seed `#ApiSelect` / `#SimpleSelect`. */
    ref?: string;
    apiUrl?: string;
    enumValues?: string[];
};

export type Coverage = {
    /** Paths bound by some node in the tree. */
    bound: string[];
    /** Allowed paths with no node bound to them, nor to an ancestor. */
    unbound: CoveragePath[];
    /** Bound paths that are not in the allowlist at all — usually a typo or a virtual path. */
    unknown: string[];
    total: number;
};

/** Field paths this tree binds, ignoring unbound placeholders. */
export function boundPaths(nodes: ViewNode[]): string[] {
    const paths = new Set<string>();
    for (const row of flattenTree(nodes)) {
        const name = row.node.field?.name;
        if (name) paths.add(name);
    }
    return [...paths];
}

function hasBoundAncestor(path: string, bound: Set<string>): boolean {
    const segments = path.split(".");
    for (let i = 1; i < segments.length; i++) {
        if (bound.has(segments.slice(0, i).join("."))) return true;
    }
    return false;
}

export function computeCoverage(
    nodes: ViewNode[],
    universe: string[],
    columns: TableColumnConfig[],
): Coverage {
    const bound = new Set(boundPaths(nodes));
    const allowed = new Set(universe);

    const columnByPath = new Map(columns.map((column) => [column.id, column]));

    const unbound: CoveragePath[] = [];
    for (const path of universe) {
        if (bound.has(path)) continue;
        /* A node bound to `address` covers `address.city` for display purposes. */
        if (hasBoundAncestor(path, bound)) continue;

        const column = columnByPath.get(path);
        unbound.push({
            path,
            leaf: !universe.some((other) => other !== path && other.startsWith(`${path}.`)),
            cellType: column?.cellType,
            ref: column?.filterConfig?.ref,
            apiUrl: column?.filterConfig?.apiUrl,
            enumValues: column?.filterConfig?.enumValues,
        });
    }

    const unknown = [...bound].filter((path) => !allowed.has(path)).sort();

    return {
        bound: [...bound].sort(),
        unbound,
        unknown,
        total: universe.length,
    };
}
