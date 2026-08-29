import {describe, expect, it} from "vitest";
import type {ViewConfig, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {
    appliesWriteAllowlist,
    filterNodesMirror,
    simulateViewConfig,
} from "./filterNodesMirror.ts";

/**
 * These cases encode maestro's `filterNodes` branch by branch. If the server changes and
 * this file is not updated, the mirror drifts and the Studio's simulation starts lying —
 * so each case names the server behaviour it pins.
 */

function lists(read: string[] = [], write: string[] = []) {
    return {read: new Set(read), write: new Set(write)};
}

function config(nodes: ViewNode[], overrides: Partial<ViewConfig> = {}): ViewConfig {
    return {
        model: "m",
        viewType: "sheet",
        accessModel: "m",
        apiUrl: "/api/m",
        nodes,
        ...overrides,
    };
}

describe("appliesWriteAllowlist", () => {
    it("matches the server: forms except create, including legacy forms with no viewMode", () => {
        expect(appliesWriteAllowlist({viewType: "form", viewMode: "edit"})).toBe(true);
        expect(appliesWriteAllowlist({viewType: "form"})).toBe(true);
        expect(appliesWriteAllowlist({viewType: "form", viewMode: "create"})).toBe(false);
        expect(appliesWriteAllowlist({viewType: "sheet"})).toBe(false);
    });
});

describe("read permissions", () => {
    it("prunes a node whose read key is absent", () => {
        const nodes: ViewNode[] = [{render: "div", permissions: {read: "price"}}];
        expect(filterNodesMirror(nodes, lists([]), false).nodes).toEqual([]);
        expect(filterNodesMirror(nodes, lists(["price"]), false).nodes).toHaveLength(1);
    });

    it("lets readAny take precedence over read, as the server does", () => {
        const nodes: ViewNode[] = [
            {render: "div", permissions: {read: "absent", readAny: ["price", "cost"]}},
        ];
        /* `read` would prune, but a satisfied `readAny` wins. */
        expect(filterNodesMirror(nodes, lists(["cost"]), false).nodes).toHaveLength(1);
        expect(filterNodesMirror(nodes, lists([]), false).nodes).toEqual([]);
    });

    it("prunes the whole subtree with its parent, counted once", () => {
        const nodes: ViewNode[] = [
            {
                render: "#SheetGroup",
                permissions: {read: "price"},
                children: [
                    {render: "#DisplayCard", field: {name: "a", widget: "#DisplayCard"}},
                    {render: "#DisplayCard", field: {name: "b", widget: "#DisplayCard"}},
                ],
            },
        ];
        const result = filterNodesMirror(nodes, lists([]), false);
        expect(result.nodes).toEqual([]);
        expect(result.pruned).toBe(1);
    });
});

describe("dependent", () => {
    it("prunes when the dependent path is not readable", () => {
        const nodes: ViewNode[] = [{render: "div", dependent: "price"}];
        expect(filterNodesMirror(nodes, lists([]), false).nodes).toEqual([]);
        expect(filterNodesMirror(nodes, lists(["price"]), false).nodes).toHaveLength(1);
    });

    it("skips the prune entirely when dependentRuntimeOnly is set", () => {
        const nodes: ViewNode[] = [{render: "div", dependent: "price", dependentRuntimeOnly: true}];
        expect(filterNodesMirror(nodes, lists([]), false).nodes).toHaveLength(1);
    });

    it("keeps a node when any dependentAny path is readable", () => {
        const nodes: ViewNode[] = [{render: "div", dependentAny: ["a", "b"]}];
        expect(filterNodesMirror(nodes, lists(["b"]), false).nodes).toHaveLength(1);
        expect(filterNodesMirror(nodes, lists([]), false).nodes).toEqual([]);
    });

    it("honours dependentRuntimeOnly for dependentAny too", () => {
        const nodes: ViewNode[] = [
            {render: "div", dependentAny: ["a", "b"], dependentRuntimeOnly: true},
        ];
        expect(filterNodesMirror(nodes, lists([]), false).nodes).toHaveLength(1);
    });
});

describe("write allowlist", () => {
    const nodes: ViewNode[] = [{render: "#Field", field: {name: "price", widget: "#Input"}}];

    it("disables rather than removes a field outside the allowlist", () => {
        const result = filterNodesMirror(nodes, lists([], []), true);
        expect(result.nodes).toHaveLength(1);
        expect(result.nodes[0]!.field?.disabled).toBe(true);
        expect(result.disabled).toBe(1);
    });

    it("leaves an allowed field untouched", () => {
        const result = filterNodesMirror(nodes, lists([], ["price"]), true);
        expect(result.nodes[0]!.field?.disabled).toBeUndefined();
        expect(result.disabled).toBe(0);
    });

    it("does nothing at all when the allowlist does not apply", () => {
        const result = filterNodesMirror(nodes, lists([], []), false);
        expect(result.nodes[0]!.field?.disabled).toBeUndefined();
    });

    it("honours the server's skip list", () => {
        const skipped: ViewNode[] = [
            {render: "#Field", field: {name: "_id", widget: "#Input"}},
            {render: "#Field", field: {name: "__unitRefs", widget: "#Input"}},
            {render: "#Field", field: {name: "__floorPolygon", widget: "#Input"}},
            {render: "#Field", field: {name: "__unitPolygon", widget: "#Input"}},
            {render: "#Field", field: {name: "__unitConnected", widget: "#Input"}},
            {render: "#Field", field: {name: "helper", widget: "#Input", skipWriteAccessGate: true}},
            {render: "#Field", field: {name: "poly", widget: "#FormFloorPolygon"}},
            {render: "#Field", field: {name: "poly2", widget: "#FormUnitPolygon"}},
        ];
        const result = filterNodesMirror(skipped, lists([], []), true);
        expect(result.disabled).toBe(0);
        expect(result.nodes.every((node) => node.field?.disabled === undefined)).toBe(true);
    });

    it("reaches fields nested inside containers", () => {
        const nested: ViewNode[] = [
            {
                render: "#FormGrid",
                children: [{render: "#Field", field: {name: "price", widget: "#Input"}}],
            },
        ];
        const result = filterNodesMirror(nested, lists([], []), true);
        expect(result.nodes[0]!.children![0]!.field?.disabled).toBe(true);
    });
});

describe("purity", () => {
    it("never mutates the config it is given", () => {
        const nodes: ViewNode[] = [
            {
                render: "#FormGrid",
                children: [{render: "#Field", field: {name: "price", widget: "#Input"}}],
            },
        ];
        const snapshot = JSON.stringify(nodes);
        filterNodesMirror(nodes, lists([], []), true);
        expect(JSON.stringify(nodes)).toBe(snapshot);
    });
});

describe("simulateViewConfig", () => {
    it("applies the write allowlist only where the server would", () => {
        const nodes: ViewNode[] = [{render: "#Field", field: {name: "price", widget: "#Input"}}];
        expect(
            simulateViewConfig(config(nodes, {viewType: "form", viewMode: "edit"}), lists()).disabled,
        ).toBe(1);
        expect(
            simulateViewConfig(config(nodes, {viewType: "form", viewMode: "create"}), lists())
                .disabled,
        ).toBe(0);
    });

    it("reports when the server would drop the view entirely", () => {
        const nodes: ViewNode[] = [{render: "div", permissions: {read: "price"}}];
        expect(simulateViewConfig(config(nodes), lists()).wouldBeDropped).toBe(true);
        expect(simulateViewConfig(config(nodes), lists(["price"])).wouldBeDropped).toBe(false);
    });

    it("does not claim an already-empty view was dropped", () => {
        expect(simulateViewConfig(config([]), lists()).wouldBeDropped).toBe(false);
    });
});
