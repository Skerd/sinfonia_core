import {describe, expect, it} from "vitest";
import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {
    adjustPathAfterRemoval,
    duplicateNodeAt,
    flatSubtreeSize,
    flattenTree,
    insertNodeAt,
    isSelfOrDescendant,
    moveNode,
    nodeAt,
    parsePathKey,
    pathKey,
    removeNodeAt,
    updateNodeAt,
} from "./nodeTreeOps.ts";

/**
 * Shaped like a real sheet view: a `#SheetGroup` holding a `#SheetGrid` of
 * `#DisplayCard`s, followed by a sibling group.
 */
function tree(): ViewNode[] {
    return [
        {
            render: "#SheetGroup",
            props: {title: "overview"},
            children: [
                {
                    render: "#SheetGrid",
                    props: {columns: 3},
                    children: [
                        {render: "#DisplayCard", field: {name: "name", widget: "#DisplayCard"}},
                        {render: "#DisplayCard", field: {name: "code", widget: "#DisplayCard"}},
                        {render: "#DisplayCard", field: {name: "phoneCode", widget: "#DisplayCard"}},
                    ],
                },
            ],
        },
        {
            render: "#SheetGroup",
            props: {title: "lifecycle"},
            children: [{render: "#DisplayCard", field: {name: "createdAt", widget: "#DisplayCard"}}],
        },
    ];
}

const GRID: number[] = [0, 0];
const fieldNames = (nodes: ViewNode[], path: number[]): (string | undefined)[] =>
    (nodeAt(nodes, path)?.children ?? []).map((child) => child.field?.name);

describe("paths", () => {
    it("round-trips a key", () => {
        expect(pathKey([0, 2, 1])).toBe("0.2.1");
        expect(parsePathKey("0.2.1")).toEqual([0, 2, 1]);
        expect(parsePathKey("")).toEqual([]);
    });

    it("detects self and descendants", () => {
        expect(isSelfOrDescendant([0, 0], [0, 0])).toBe(true);
        expect(isSelfOrDescendant([0, 0], [0, 0, 2])).toBe(true);
        expect(isSelfOrDescendant([0, 0], [0, 1])).toBe(false);
        expect(isSelfOrDescendant([0, 0], [0])).toBe(false);
    });
});

describe("nodeAt", () => {
    it("resolves nested nodes and misses cleanly", () => {
        expect(nodeAt(tree(), [0, 0, 2])?.field?.name).toBe("phoneCode");
        expect(nodeAt(tree(), [9])).toBeUndefined();
        expect(nodeAt(tree(), [0, 0, 9])).toBeUndefined();
    });
});

describe("updateNodeAt", () => {
    it("replaces a nested node without mutating the input", () => {
        const before = tree();
        const after = updateNodeAt(before, [0, 0, 1], (node) => ({
            ...node,
            field: {...node.field!, required: true},
        }));

        expect(nodeAt(after, [0, 0, 1])?.field?.required).toBe(true);
        expect(nodeAt(before, [0, 0, 1])?.field?.required).toBeUndefined();
        expect(after).not.toBe(before);
        // Untouched branches keep their identity, so React can skip them.
        expect(after[1]).toBe(before[1]);
    });
});

describe("removeNodeAt", () => {
    it("removes a leaf and reports it", () => {
        const before = tree();
        const {nodes: after, removed} = removeNodeAt(before, [0, 0, 1]);

        expect(removed?.field?.name).toBe("code");
        expect(fieldNames(after, GRID)).toEqual(["name", "phoneCode"]);
        expect(fieldNames(before, GRID)).toEqual(["name", "code", "phoneCode"]);
    });

    it("removes a whole subtree from the root", () => {
        const {nodes: after, removed} = removeNodeAt(tree(), [0]);
        expect(removed?.props?.title).toBe("overview");
        expect(after).toHaveLength(1);
    });

    it("is a no-op for a missing path", () => {
        const before = tree();
        const {nodes: after, removed} = removeNodeAt(before, [0, 0, 9]);
        expect(removed).toBeUndefined();
        expect(after).toBe(before);
    });
});

describe("insertNodeAt", () => {
    const extra: ViewNode = {render: "#DisplayCard", field: {name: "currency", widget: "#DisplayCard"}};

    it("inserts at an index inside a nested list", () => {
        const after = insertNodeAt(tree(), [0, 0, 1], extra);
        expect(fieldNames(after, GRID)).toEqual(["name", "currency", "code", "phoneCode"]);
    });

    it("clamps an index past the end", () => {
        const after = insertNodeAt(tree(), [0, 0, 99], extra);
        expect(fieldNames(after, GRID)).toEqual(["name", "code", "phoneCode", "currency"]);
    });

    it("inserts into an empty child list", () => {
        const base: ViewNode[] = [{render: "#SheetGroup", children: []}];
        const after = insertNodeAt(base, [0, 0], extra);
        expect(fieldNames(after, [0])).toEqual(["currency"]);
    });
});

describe("adjustPathAfterRemoval", () => {
    it("shifts a later sibling down", () => {
        expect(adjustPathAfterRemoval([0, 0, 3], [0, 0, 1])).toEqual([0, 0, 2]);
    });

    it("leaves an earlier sibling alone", () => {
        expect(adjustPathAfterRemoval([0, 0, 1], [0, 0, 2])).toEqual([0, 0, 1]);
    });

    it("leaves a different branch alone", () => {
        expect(adjustPathAfterRemoval([1, 0], [0, 0])).toEqual([1, 0]);
    });

    it("shifts a destination nested under a later sibling", () => {
        expect(adjustPathAfterRemoval([2, 0, 1], [1])).toEqual([1, 0, 1]);
    });
});

describe("moveNode", () => {
    it("reorders within the same parent, moving down", () => {
        const after = moveNode(tree(), [0, 0, 0], [0, 0, 2]);
        expect(fieldNames(after, GRID)).toEqual(["code", "name", "phoneCode"]);
    });

    it("reorders within the same parent, moving up", () => {
        const after = moveNode(tree(), [0, 0, 2], [0, 0, 0]);
        expect(fieldNames(after, GRID)).toEqual(["phoneCode", "name", "code"]);
    });

    it("moves across parents", () => {
        const after = moveNode(tree(), [0, 0, 2], [1, 0]);
        expect(fieldNames(after, GRID)).toEqual(["name", "code"]);
        expect(fieldNames(after, [1])).toEqual(["phoneCode", "createdAt"]);
    });

    it("refuses to drop a node into its own subtree", () => {
        const before = tree();
        expect(moveNode(before, [0], [0, 0, 1])).toBe(before);
        expect(moveNode(before, [0, 0], [0, 0, 0])).toBe(before);
    });

    it("never mutates the input", () => {
        const before = tree();
        const snapshot = JSON.stringify(before);
        moveNode(before, [0, 0, 0], [1, 0]);
        expect(JSON.stringify(before)).toBe(snapshot);
    });
});

describe("duplicateNodeAt", () => {
    it("inserts a deep copy right after the original", () => {
        const after = duplicateNodeAt(tree(), [0, 0, 1]);
        expect(fieldNames(after, GRID)).toEqual(["name", "code", "code", "phoneCode"]);
        expect(nodeAt(after, [0, 0, 1])).not.toBe(nodeAt(after, [0, 0, 2]));
    });

    it("deep-copies children rather than sharing them", () => {
        const after = duplicateNodeAt(tree(), [0]);
        const original = nodeAt(after, [0, 0]);
        const copy = nodeAt(after, [1, 0]);
        expect(copy).toEqual(original);
        expect(copy).not.toBe(original);
    });
});

describe("flattenTree", () => {
    it("emits depth-first rows with paths and depths", () => {
        const flat = flattenTree(tree());
        expect(flat.map((row) => row.key)).toEqual([
            "0", "0.0", "0.0.0", "0.0.1", "0.0.2", "1", "1.0",
        ]);
        expect(flat.map((row) => row.depth)).toEqual([0, 1, 2, 2, 2, 0, 1]);
        expect(flat[0]!.childCount).toBe(1);
        expect(flat[2]!.parentKey).toBe("0.0");
    });

    it("skips the children of collapsed nodes", () => {
        const flat = flattenTree(tree(), new Set(["0.0"]));
        expect(flat.map((row) => row.key)).toEqual(["0", "0.0", "1", "1.0"]);
    });
});

describe("flatSubtreeSize", () => {
    it("counts a node plus everything under it", () => {
        const flat = flattenTree(tree());
        expect(flatSubtreeSize(flat, 0)).toBe(5);
        expect(flatSubtreeSize(flat, 2)).toBe(1);
        expect(flatSubtreeSize(flat, 5)).toBe(2);
    });
});
