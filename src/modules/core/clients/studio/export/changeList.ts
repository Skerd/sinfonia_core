import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {flattenTree, pathKey} from "../tree/nodeTreeOps.ts";

/**
 * A readable account of what changed between the served config and the draft.
 *
 * This is the half of the export a developer actually applies. The generated
 * TypeScript has imported constants flattened to literals and shared fragments
 * expanded, so it cannot be pasted over a real `*.views.ts` — but "moved X from A to B"
 * and "set required on Y" transfer to the real file exactly.
 *
 * Nodes carry no id, so identity is a signature over the parts that make a node
 * recognisable. Two genuinely identical nodes under the same parent are
 * indistinguishable and will be reported as a pair of add/remove rather than a move;
 * that is a heuristic limit worth stating rather than hiding.
 */

export type ChangeKind = "added" | "removed" | "moved" | "changed";

export type Change = {
    kind: ChangeKind;
    /** What the node is, in the same shorthand the tree rows use. */
    label: string;
    from?: string;
    to?: string;
    detail?: string;
    /**
     * For `changed`: the node keys whose values differ, and the node they now hold. Lets a
     * consumer build real source edits instead of re-parsing {@link detail}, which is a
     * display string.
     */
    keys?: string[];
    node?: ViewNode;
    /**
     * What `from` / `to` mean. `"node"` (default) reads them as tree positions and
     * renders `nodes[0.1.2]`; `"column"` reads them as schema paths, where position is
     * not a coordinate and that wording would be nonsense.
     */
    scope?: "node" | "column";
};

/** `#DisplayCard[price]` / `#SheetGroup("overview")` / `div` — the shorthand the tree,
 * the change list and the inspector breadcrumb all name a node by. */
export function nodeLabel(node: ViewNode): string {
    if (node.field) {
        const name = node.field.name || "(unbound)";
        return `${node.field.widget}[${name}]`;
    }
    const title = node.props?.title;
    if (typeof title === "string" && title) return `${node.render}("${title}")`;
    return node.render;
}

/** Identity for matching a node across the two trees. Excludes position. */
function signature(node: ViewNode): string {
    const title = typeof node.props?.title === "string" ? node.props.title : "";
    return [node.render, node.field?.widget ?? "", node.field?.name ?? "", title].join("|");
}

/** Everything except `children`, so a subtree move is not reported as a content change. */
function ownContent(node: ViewNode): string {
    const {children: _children, ...rest} = node;
    return JSON.stringify(rest);
}

type Indexed = {
    path: string;
    node: ViewNode;
    signature: string;
};

function index(nodes: ViewNode[]): Indexed[] {
    return flattenTree(nodes).map((row) => ({
        path: pathKey(row.path),
        node: row.node,
        signature: signature(row.node),
    }));
}

/**
 * Groups by signature and pairs entries up in document order, so N copies of the same
 * signature match one-to-one instead of collapsing into a single comparison.
 */
function bucketBySignature(list: Indexed[]): Map<string, Indexed[]> {
    const buckets = new Map<string, Indexed[]>();
    for (const entry of list) {
        const bucket = buckets.get(entry.signature);
        if (bucket) bucket.push(entry);
        else buckets.set(entry.signature, [entry]);
    }
    return buckets;
}

export function diffNodeTrees(before: ViewNode[], after: ViewNode[]): Change[] {
    const beforeBuckets = bucketBySignature(index(before));
    const afterBuckets = bucketBySignature(index(after));

    const changes: Change[] = [];
    const signatures = new Set([...beforeBuckets.keys(), ...afterBuckets.keys()]);

    for (const sig of signatures) {
        const from = beforeBuckets.get(sig) ?? [];
        const to = afterBuckets.get(sig) ?? [];
        const paired = Math.min(from.length, to.length);

        for (let i = 0; i < paired; i++) {
            const a = from[i]!;
            const b = to[i]!;
            if (a.path !== b.path) {
                changes.push({
                    kind: "moved",
                    label: nodeLabel(b.node),
                    from: a.path,
                    to: b.path,
                });
            }
            if (ownContent(a.node) !== ownContent(b.node)) {
                const keys = differingKeys(a.node, b.node);
                changes.push({
                    kind: "changed",
                    label: nodeLabel(b.node),
                    to: b.path,
                    detail: keys.join(", "),
                    keys,
                    node: b.node,
                });
            }
        }

        for (let i = paired; i < from.length; i++) {
            changes.push({kind: "removed", label: nodeLabel(from[i]!.node), from: from[i]!.path});
        }
        for (let i = paired; i < to.length; i++) {
            changes.push({kind: "added", label: nodeLabel(to[i]!.node), to: to[i]!.path});
        }
    }

    /* Deterministic order so a re-export produces the same text. */
    const kindOrder: ChangeKind[] = ["added", "removed", "moved", "changed"];
    return changes.sort((a, b) => {
        const byKind = kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind);
        if (byKind !== 0) return byKind;
        return (a.to ?? a.from ?? "").localeCompare(b.to ?? b.from ?? "");
    });
}

/**
 * Every `ViewNode` key except `children`, which is the tree structure rather than the
 * node's own content. Listed explicitly so a new key added to the contract shows up as a
 * compile error here instead of silently going unreported.
 */
const NODE_CONTENT_KEYS = [
    "render",
    "props",
    "field",
    "dependent",
    "dependentAny",
    "dependentRuntimeOnly",
    "permissions",
] as const satisfies readonly (keyof ViewNode)[];

/** The keys whose values differ, so "changed" can both describe and be acted on. */
function differingKeys(before: ViewNode, after: ViewNode): string[] {
    const differing: string[] = [];
    for (const key of NODE_CONTENT_KEYS) {
        if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
            differing.push(key);
        }
    }
    return differing;
}

export function formatChange(change: Change): string {
    if (change.scope === "column") {
        switch (change.kind) {
            case "added":
                return `added column ${change.label}`;
            case "removed":
                return `hid column ${change.label} (hideColumn: true)`;
            case "moved":
                return `reordered columns: ${change.to}`;
            case "changed":
                return `set ${change.detail || "options"} on column ${change.label}`;
        }
    }

    switch (change.kind) {
        case "added":
            return `added ${change.label} at nodes[${change.to}]`;
        case "removed":
            return `removed ${change.label} from nodes[${change.from}]`;
        case "moved":
            return `moved ${change.label} from nodes[${change.from}] to nodes[${change.to}]`;
        case "changed":
            return `changed ${change.detail || "content"} on ${change.label} at nodes[${change.to}]`;
    }
}
