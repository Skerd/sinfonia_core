import {describe, expect, it} from "vitest";
import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {insertNodeAt, moveNode, nodeAt} from "./nodeTreeOps.ts";
import {
    canAcceptChildren,
    destinationAfter,
    flattenForDrag,
    projectDrop,
    TREE_INDENT_PX,
} from "./treeProjection.ts";

function tree(): ViewNode[] {
    return [
        {
            render: "#SheetGroup",
            props: {title: "overview"},
            children: [
                {render: "#DisplayCard", field: {name: "name", widget: "#DisplayCard"}},
                {render: "#DisplayCard", field: {name: "code", widget: "#DisplayCard"}},
            ],
        },
        {render: "#SheetGroup", props: {title: "lifecycle"}, children: []},
    ];
}

/**
 * rows: "0" (group, d0), "0.0" (name, d1), "0.1" (code, d1), "1" (group, d0).
 * Always built through `flattenForDrag` so tests see exactly what the component does —
 * the dragged subtree is collapsed, which is what keeps the projection bounds meaningful.
 */
const flat = (activeKey: string | null = null) => flattenForDrag(tree(), new Set<string>(), activeKey);

describe("canAcceptChildren", () => {
    it("allows layout nodes and refuses field-bound ones", () => {
        expect(canAcceptChildren({render: "#SheetGroup"})).toBe(true);
        expect(canAcceptChildren({render: "div"})).toBe(true);
        expect(
            canAcceptChildren({render: "#DisplayCard", field: {name: "name", widget: "#DisplayCard"}}),
        ).toBe(false);
    });
});

describe("destinationAfter", () => {
    it("lands first at root when there is no preceding row", () => {
        expect(destinationAfter(undefined, 0)).toEqual([0]);
    });

    it("becomes the first child when depth goes one deeper", () => {
        const previous = flat()[0]!; // "0", depth 0
        expect(destinationAfter(previous, 1)).toEqual([0, 0]);
    });

    it("becomes the next sibling at the same depth", () => {
        const previous = flat()[1]!; // "0.0", depth 1
        expect(destinationAfter(previous, 1)).toEqual([0, 1]);
    });

    it("walks back up to a shallower depth", () => {
        const previous = flat()[2]!; // "0.1", depth 1
        expect(destinationAfter(previous, 0)).toEqual([1]);
    });
});

describe("projectDrop — moving an existing row", () => {
    it("returns null for an unknown hovered row", () => {
        expect(
            projectDrop({flat: flat(), activeKey: "0.0", overKey: "nope", offsetLeft: 0}),
        ).toBeNull();
    });

    it("reorders within the same parent", () => {
        const rows = flat();
        const projection = projectDrop({
            flat: rows,
            activeKey: "0.0",
            overKey: "0.1",
            offsetLeft: 0,
        })!;

        expect(projection.depth).toBe(1);
        const after = moveNode(tree(), [0, 0], projection.destination);
        expect((nodeAt(after, [0])?.children ?? []).map((c) => c.field?.name)).toEqual([
            "code",
            "name",
        ]);
    });

    it("nests a row into another group when dragged onto one of its children", () => {
        /* Drag the second group ("1") onto "0.1" and pull right. It takes 0.1's slot,
           so it lands *before* code rather than after it — the same as any list reorder. */
        const projection = projectDrop({
            flat: flat("1"),
            activeKey: "1",
            overKey: "0.1",
            offsetLeft: TREE_INDENT_PX * 2,
        })!;

        // "0.0" precedes it and is a field node, so depth clamps to that row's own level.
        expect(projection.depth).toBe(1);
        const after = moveNode(tree(), [1], projection.destination);
        expect(nodeAt(after, [0])?.children).toHaveLength(3);
        expect(nodeAt(after, [0, 1])?.props?.title).toBe("lifecycle");
        expect(nodeAt(after, [0, 2])?.field?.name).toBe("code");
    });

    it("clamps depth to the following row so a node is not adopted by a subtree below it", () => {
        const projection = projectDrop({
            flat: flat("0"),
            activeKey: "0",
            overKey: "0",
            offsetLeft: TREE_INDENT_PX * 5,
        })!;
        expect(projection.depth).toBe(0);
    });

    it("moves a row out to root level when dragged left", () => {
        const projection = projectDrop({
            flat: flat("0.1"),
            activeKey: "0.1",
            overKey: "0.1",
            offsetLeft: -TREE_INDENT_PX * 3,
        })!;

        expect(projection.depth).toBe(0);
        const after = moveNode(tree(), [0, 1], projection.destination);
        expect(after).toHaveLength(3);
        expect(after[1]?.field?.name).toBe("code");
        expect(nodeAt(after, [0])?.children).toHaveLength(1);
    });
});

describe("projectDrop — palette drop", () => {
    const fresh: ViewNode = {render: "#Input"};

    it("inserts as a sibling right after the hovered row", () => {
        const projection = projectDrop({
            flat: flat(),
            activeKey: null,
            overKey: "0.0",
            offsetLeft: 0,
        })!;

        expect(projection.destination).toEqual([0, 1]);
        const after = insertNodeAt(tree(), projection.destination, fresh);
        expect((nodeAt(after, [0])?.children ?? []).map((c) => c.render)).toEqual([
            "#DisplayCard",
            "#Input",
            "#DisplayCard",
        ]);
    });

    it("drops into an empty container when pulled right", () => {
        const projection = projectDrop({
            flat: flat(),
            activeKey: null,
            overKey: "1",
            offsetLeft: TREE_INDENT_PX,
        })!;

        expect(projection.depth).toBe(1);
        expect(projection.destination).toEqual([1, 0]);
        const after = insertNodeAt(tree(), projection.destination, fresh);
        expect(nodeAt(after, [1, 0])?.render).toBe("#Input");
    });

    it("refuses to nest under a field-bound row", () => {
        const projection = projectDrop({
            flat: flat(),
            activeKey: null,
            overKey: "0.1",
            offsetLeft: TREE_INDENT_PX * 3,
        })!;

        expect(projection.depth).toBe(1);
        expect(projection.destination).toEqual([0, 2]);
    });
});
