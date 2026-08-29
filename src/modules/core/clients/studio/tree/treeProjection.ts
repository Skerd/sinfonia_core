import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {flattenTree, type FlatNode, type NodePath} from "./nodeTreeOps.ts";

/**
 * Where a drag would drop, in tree coordinates.
 *
 * The tree is rendered as one flat sortable list with indentation, so the horizontal
 * drag offset chooses the depth and the vertical position chooses the slot — the
 * `@dnd-kit` sortable-tree approach. Everything here is pure so the arithmetic can be
 * tested without a DOM.
 */

/** Pixels of indentation per depth level. Must match the tree row's padding step. */
export const TREE_INDENT_PX = 16;

/** `active.id` prefix used by palette drag sources, to tell them from tree rows. */
export const PALETTE_PREFIX = "palette:";

export type TreeProjection = {
    depth: number;
    /**
     * Destination path expressed in the *current* tree (the dragged node still in place).
     * `moveNode` compensates for the removal; `insertNodeAt` uses it directly for a
     * palette drop, where nothing is removed.
     */
    destination: NodePath;
    /** Key of the row the new node will sit after, or `null` when it lands first at root. */
    afterKey: string | null;
};

/**
 * A field-bound node renders through `ctx.renderField` / `renderSheetField`, which never
 * descends into `children` — nesting under one would silently drop the subtree.
 */
export function canAcceptChildren(node: ViewNode): boolean {
    return !node.field;
}

/**
 * Flattens the tree for the duration of a drag.
 *
 * The dragged node is force-collapsed so its own descendants are not offered as drop
 * targets — `projectDrop` relies on this, since a row inside the dragged subtree would
 * make `previous`/`next` describe positions that stop existing the moment the node moves.
 * Callers must use this rather than `flattenTree` directly while dragging.
 */
export function flattenForDrag(
    nodes: ViewNode[],
    collapsedKeys: ReadonlySet<string>,
    activeKey: string | null,
): FlatNode[] {
    if (!activeKey) return flattenTree(nodes, collapsedKeys);
    return flattenTree(nodes, new Set([...collapsedKeys, activeKey]));
}

function arrayMove<T>(list: T[], from: number, to: number): T[] {
    const next = [...list];
    const [item] = next.splice(from, 1);
    if (item !== undefined) next.splice(to, 0, item);
    return next;
}

/**
 * Builds the destination path for "insert directly after `previous`, at `depth`".
 *
 * `depth === previous.depth + 1` means "first child of previous"; anything shallower
 * walks back up previous's own path and steps to the next sibling at that level.
 */
export function destinationAfter(previous: FlatNode | undefined, depth: number): NodePath {
    if (!previous) return [0];
    if (depth > previous.depth) return [...previous.path, 0];
    const path = previous.path.slice(0, depth + 1);
    path[depth] = (path[depth] ?? 0) + 1;
    return path;
}

type ProjectArgs = {
    /** Flattened rows of the current tree, with the dragged subtree collapsed away. */
    flat: FlatNode[];
    /** Row key being dragged, or `null` for a palette drag (nothing leaves the tree). */
    activeKey: string | null;
    /** Row key currently hovered. */
    overKey: string;
    /** Horizontal drag distance in pixels. */
    offsetLeft: number;
    indentWidth?: number;
};

/**
 * Resolves the drop target. Returns `null` when the hovered row is not in the list
 * (a stale `over` between renders).
 */
export function projectDrop({
    flat,
    activeKey,
    overKey,
    offsetLeft,
    indentWidth = TREE_INDENT_PX,
}: ProjectArgs): TreeProjection | null {
    const overIndex = flat.findIndex((row) => row.key === overKey);
    if (overIndex < 0) return null;

    let previous: FlatNode | undefined;
    let next: FlatNode | undefined;
    let baseDepth: number;

    if (activeKey === null) {
        /* Palette drag: the new node lands after the hovered row; nothing is displaced. */
        previous = flat[overIndex];
        next = flat[overIndex + 1];
        baseDepth = previous?.depth ?? 0;
    } else {
        const activeIndex = flat.findIndex((row) => row.key === activeKey);
        if (activeIndex < 0) return null;
        const reordered = arrayMove(flat, activeIndex, overIndex);
        previous = reordered[overIndex - 1];
        next = reordered[overIndex + 1];
        baseDepth = reordered[overIndex]?.depth ?? 0;
    }

    const dragDepth = Math.round(offsetLeft / indentWidth);
    const projected = baseDepth + dragDepth;

    /*
     * Upper bound: one level below the preceding row, and only when that row can hold
     * children at all. Lower bound: the following row's depth, otherwise the node would
     * be adopted by a subtree that visually continues below it.
     */
    const maxDepth =
        previous && canAcceptChildren(previous.node) ? previous.depth + 1 : (previous?.depth ?? 0);
    const minDepth = next ? next.depth : 0;
    const depth = Math.min(Math.max(projected, minDepth), Math.max(maxDepth, minDepth));

    return {
        depth,
        destination: destinationAfter(previous, depth),
        afterKey: previous?.key ?? null,
    };
}
