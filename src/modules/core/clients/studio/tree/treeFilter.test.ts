import {describe, expect, it} from "vitest";
import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {ancestorKeys, flattenTree} from "./nodeTreeOps.ts";
import {countMatches, filterTreeRows} from "./treeFilter.ts";

/** Shaped like a real sheet: groups → grid → cards, plus a sibling group. */
function tree(): ViewNode[] {
    return [
        {
            render: "#SheetGroup",
            props: {title: "pricing"},
            children: [
                {
                    render: "#SheetGrid",
                    props: {columns: 3},
                    children: [
                        {render: "#DisplayCard", field: {name: "price", widget: "#DisplayCard"}},
                        {render: "#DisplayCard", field: {name: "cost", widget: "#DisplayCard"}},
                    ],
                },
            ],
        },
        {
            render: "#SheetGroup",
            props: {title: "overview"},
            children: [{render: "#DisplayCard", field: {name: "name", widget: "#DisplayCard"}}],
        },
    ];
}

const rows = () => flattenTree(tree());

function keys(list: {key: string}[]): string[] {
    return list.map((row) => row.key);
}

describe("ancestorKeys", () => {
    it("lists strict ancestors outermost first", () => {
        expect(ancestorKeys("0.1.2")).toEqual(["0", "0.1"]);
    });

    it("has none for a root node or an empty key", () => {
        expect(ancestorKeys("0")).toEqual([]);
        expect(ancestorKeys("")).toEqual([]);
    });

    it("handles a deep path", () => {
        expect(ancestorKeys("3.0.1.4.2")).toEqual(["3", "3.0", "3.0.1", "3.0.1.4"]);
    });
});

describe("filterTreeRows", () => {
    it("is identity for an empty query", () => {
        expect(filterTreeRows(rows(), "")).toEqual(rows());
        expect(filterTreeRows(rows(), "   ")).toEqual(rows());
    });

    it("keeps a match together with its ancestors", () => {
        /* `price` is at 0.0.0, so its grid and group must survive to give it context. */
        expect(keys(filterTreeRows(rows(), "price"))).toEqual(["0", "0.0", "0.0.0"]);
    });

    it("drops branches with no match in them", () => {
        const filtered = keys(filterTreeRows(rows(), "price"));
        expect(filtered).not.toContain("1");
        expect(filtered).not.toContain("1.0");
    });

    it("matches on a field name", () => {
        expect(keys(filterTreeRows(rows(), "cost"))).toEqual(["0", "0.0", "0.0.1"]);
    });

    it("matches on a props title", () => {
        expect(keys(filterTreeRows(rows(), "overview"))).toEqual(["1"]);
    });

    it("matches on a widget token, keeping every hit", () => {
        const filtered = keys(filterTreeRows(rows(), "#DisplayCard"));
        expect(filtered).toEqual(["0", "0.0", "0.0.0", "0.0.1", "1", "1.0"]);
    });

    it("matches the render token of a bound node whose widget differs", () => {
        const nodes: ViewNode[] = [{render: "#Field", field: {name: "x", widget: "#Input"}}];
        const flat = flattenTree(nodes);
        expect(filterTreeRows(flat, "#Field")).toHaveLength(1);
        expect(filterTreeRows(flat, "#Input")).toHaveLength(1);
    });

    it("is case-insensitive", () => {
        expect(keys(filterTreeRows(rows(), "PRICE"))).toEqual(["0", "0.0", "0.0.0"]);
    });

    it("returns nothing when nothing matches", () => {
        expect(filterTreeRows(rows(), "zzz")).toEqual([]);
    });

    it("preserves document order and each row's own depth", () => {
        const filtered = filterTreeRows(rows(), "#DisplayCard");
        expect(keys(filtered)).toEqual([...keys(filtered)].sort((a, b) => a.localeCompare(b)));
        const byKey = new Map(filtered.map((row) => [row.key, row]));
        expect(byKey.get("0")!.depth).toBe(0);
        expect(byKey.get("0.0")!.depth).toBe(1);
        expect(byKey.get("0.0.0")!.depth).toBe(2);
    });
});

describe("countMatches", () => {
    it("counts only real matches, not the ancestors kept for context", () => {
        /* Three rows survive the filter, but only one of them actually matched. */
        expect(filterTreeRows(rows(), "price")).toHaveLength(3);
        expect(countMatches(rows(), "price")).toBe(1);
    });

    it("is zero for an empty query", () => {
        expect(countMatches(rows(), "")).toBe(0);
    });

    it("counts every hit across branches", () => {
        expect(countMatches(rows(), "#DisplayCard")).toBe(3);
    });
});
