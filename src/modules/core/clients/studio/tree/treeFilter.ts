import type {FlatNode} from "./nodeTreeOps.ts";
import {ancestorKeys} from "./nodeTreeOps.ts";

/**
 * Narrows the tree to rows matching a query, keeping the ancestors of every match.
 *
 * Dropping non-matching ancestors would turn the result into a flat hit list, which loses
 * the one thing the tree is for — a `#DisplayCard[price]` means something different inside
 * `#SheetGroup("pricing")` than at the root, and the path key alone does not say so.
 *
 * Matches the same three things the rows display (`rowLabel` / `rowDetail`): the widget or
 * render token, the bound `field.name`, and a `props.title`. Searching anything else would
 * return rows with no visible reason for matching.
 */

/** True when this row itself matches — ancestors are added separately. */
function rowMatches(row: FlatNode, needle: string): boolean {
    const {node} = row;

    const token = node.field?.widget ?? node.render;
    if (token.toLowerCase().includes(needle)) return true;
    /* A bound node's `render` is often `#Field`, so check both. */
    if (node.render.toLowerCase().includes(needle)) return true;

    const name = node.field?.name;
    if (name && name.toLowerCase().includes(needle)) return true;

    const title = node.props?.title;
    if (typeof title === "string" && title.toLowerCase().includes(needle)) return true;

    return false;
}

export function filterTreeRows(rows: FlatNode[], query: string): FlatNode[] {
    const needle = query.trim().toLowerCase();
    if (needle === "") return rows;

    const keep = new Set<string>();
    for (const row of rows) {
        if (!rowMatches(row, needle)) continue;
        keep.add(row.key);
        for (const ancestor of ancestorKeys(row.key)) keep.add(ancestor);
    }

    /* Preserve document order and every row's own depth, so indentation still lines up. */
    return rows.filter((row) => keep.has(row.key));
}

/** Rows that matched in their own right, for counting hits separately from context. */
export function countMatches(rows: FlatNode[], query: string): number {
    const needle = query.trim().toLowerCase();
    if (needle === "") return 0;
    return rows.filter((row) => rowMatches(row, needle)).length;
}
