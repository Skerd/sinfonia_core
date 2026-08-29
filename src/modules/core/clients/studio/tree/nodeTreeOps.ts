import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";

/**
 * Pure structural operations on a `ViewNode[]` tree.
 *
 * `ViewNode` carries no id, so a node is addressed by its position: `[0, 2, 1]` is
 * `nodes[0].children[2].children[1]`. Positional keys are an editing concern only and
 * are never written into a config — the exported TypeScript must stay a plain
 * `ViewConfig` literal.
 *
 * Every function returns new arrays/objects; the input is never mutated, so React
 * sees a changed reference and the drafts stay safe to keep in history.
 */

export type NodePath = number[];

export function pathKey(path: NodePath): string {
    return path.join(".");
}

export function parsePathKey(key: string): NodePath {
    if (key === "") return [];
    return key.split(".").map((segment) => Number.parseInt(segment, 10));
}

export function pathsEqual(a: NodePath, b: NodePath): boolean {
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * Every strict ancestor key of a positional key, outermost first:
 * `"0.1.2"` → `["0", "0.1"]`.
 *
 * Revealing a node means un-collapsing exactly these. A node inside a collapsed group is
 * not merely scrolled past — `flattenForDrag` never emits it — so selecting one without
 * expanding its ancestors first shows nothing at all.
 */
export function ancestorKeys(key: string): string[] {
    if (key === "") return [];
    const segments = key.split(".");
    const result: string[] = [];
    for (let depth = 1; depth < segments.length; depth++) {
        result.push(segments.slice(0, depth).join("."));
    }
    return result;
}

/** True when `maybeDescendant` is `path` itself or sits underneath it. */
export function isSelfOrDescendant(path: NodePath, maybeDescendant: NodePath): boolean {
    if (maybeDescendant.length < path.length) return false;
    return path.every((value, index) => maybeDescendant[index] === value);
}

export function nodeAt(nodes: ViewNode[], path: NodePath): ViewNode | undefined {
    let current: ViewNode | undefined;
    let list = nodes;
    for (const index of path) {
        current = list[index];
        if (!current) return undefined;
        list = current.children ?? [];
    }
    return current;
}

export function updateNodeAt(
    nodes: ViewNode[],
    path: NodePath,
    updater: (node: ViewNode) => ViewNode,
): ViewNode[] {
    if (path.length === 0) return nodes;
    const [head, ...rest] = path;
    const target = nodes[head];
    if (!target) return nodes;

    const next = [...nodes];
    if (rest.length === 0) {
        next[head] = updater(target);
        return next;
    }
    next[head] = {...target, children: updateNodeAt(target.children ?? [], rest, updater)};
    return next;
}

export function removeNodeAt(
    nodes: ViewNode[],
    path: NodePath,
): {nodes: ViewNode[]; removed?: ViewNode} {
    if (path.length === 0) return {nodes};
    const [head, ...rest] = path;
    const target = nodes[head];
    if (!target) return {nodes};

    if (rest.length === 0) {
        const next = [...nodes];
        const [removed] = next.splice(head, 1);
        return {nodes: next, removed};
    }

    const inner = removeNodeAt(target.children ?? [], rest);
    if (!inner.removed) return {nodes};
    const next = [...nodes];
    next[head] = {...target, children: inner.nodes};
    return {nodes: next, removed: inner.removed};
}

/**
 * Inserts `node` at `path`, where the last segment is the destination index inside
 * the parent's child list. An out-of-range index clamps to the ends rather than
 * failing, so a drop past the last row still lands.
 */
export function insertNodeAt(nodes: ViewNode[], path: NodePath, node: ViewNode): ViewNode[] {
    if (path.length === 0) return nodes;
    const [head, ...rest] = path;

    if (rest.length === 0) {
        const next = [...nodes];
        next.splice(Math.max(0, Math.min(head, next.length)), 0, node);
        return next;
    }

    const target = nodes[head];
    if (!target) return nodes;
    const next = [...nodes];
    next[head] = {...target, children: insertNodeAt(target.children ?? [], rest, node)};
    return next;
}

/**
 * Removing a node shifts every later sibling down by one. When the destination is a
 * later position in the same list (or under a later sibling), its index must follow.
 */
export function adjustPathAfterRemoval(destination: NodePath, removed: NodePath): NodePath {
    const depth = removed.length - 1;
    if (destination.length <= depth) return destination;
    for (let i = 0; i < depth; i++) {
        if (destination[i] !== removed[i]) return destination;
    }
    if (destination[depth] > removed[depth]) {
        const next = [...destination];
        next[depth] -= 1;
        return next;
    }
    return destination;
}

/**
 * Moves the node at `from` to `to`. Dropping a node into itself or one of its own
 * descendants is a no-op — that would detach the subtree from the tree entirely.
 */
export function moveNode(nodes: ViewNode[], from: NodePath, to: NodePath): ViewNode[] {
    if (from.length === 0 || to.length === 0) return nodes;
    if (isSelfOrDescendant(from, to)) return nodes;

    const {nodes: without, removed} = removeNodeAt(nodes, from);
    if (!removed) return nodes;

    return insertNodeAt(without, adjustPathAfterRemoval(to, from), removed);
}

/** Structural clone. Safe because a `ViewNode` is JSON by contract — it has no functions. */
export function cloneNode(node: ViewNode): ViewNode {
    return JSON.parse(JSON.stringify(node)) as ViewNode;
}

export function duplicateNodeAt(nodes: ViewNode[], path: NodePath): ViewNode[] {
    const target = nodeAt(nodes, path);
    if (!target) return nodes;
    const destination = [...path];
    destination[destination.length - 1] += 1;
    return insertNodeAt(nodes, destination, cloneNode(target));
}

// ---------------------------------------------------------------------------
// Flattening — the tree UI renders one sortable list with indentation
// ---------------------------------------------------------------------------

export type FlatNode = {
    key: string;
    path: NodePath;
    node: ViewNode;
    depth: number;
    /** `""` for a root-level node. */
    parentKey: string;
    /** Index within the parent's child list. */
    index: number;
    childCount: number;
};

export function flattenTree(nodes: ViewNode[], collapsedKeys?: ReadonlySet<string>): FlatNode[] {
    const result: FlatNode[] = [];

    const walk = (list: ViewNode[], parentPath: NodePath, parentKey: string): void => {
        list.forEach((node, index) => {
            const path = [...parentPath, index];
            const key = pathKey(path);
            const children = node.children ?? [];
            result.push({
                key,
                path,
                node,
                depth: parentPath.length,
                parentKey,
                index,
                childCount: children.length,
            });
            if (children.length > 0 && !collapsedKeys?.has(key)) {
                walk(children, path, key);
            }
        });
    };

    walk(nodes, [], "");
    return result;
}

/**
 * Counts the rows a node occupies in the flattened list, itself included. Used to skip
 * over a dragged subtree when computing where a drop would land.
 */
export function flatSubtreeSize(flat: FlatNode[], index: number): number {
    const start = flat[index];
    if (!start) return 0;
    let size = 1;
    for (let i = index + 1; i < flat.length; i++) {
        if (flat[i]!.depth <= start.depth) break;
        size += 1;
    }
    return size;
}
