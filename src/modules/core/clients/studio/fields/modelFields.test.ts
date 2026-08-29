import {describe, expect, it} from "vitest";
import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {
    TableColumnConfig,
} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import {
    buildModelFields,
    filterFields,
    isRendered,
    summarizeFields,
    toCoveragePath,
} from "./modelFields.ts";

const readPaths = ["name", "address", "address.city", "address.street", "currency"];
const writePaths = ["name", "address.city"];

const columns: TableColumnConfig[] = [
    {
        id: "name",
        accessorPath: "name",
        labelKey: "name",
        cellType: COLUMN_TYPE.STRING,
        sortable: true,
        visible: true,
    },
    {
        id: "currency",
        accessorPath: "currency",
        labelKey: "currency",
        cellType: COLUMN_TYPE.OBJECT_ID,
        sortable: false,
        visible: false,
        filterConfig: {
            type: COLUMN_TYPE.OBJECT_ID,
            operators: [],
            ref: "Currency",
            apiUrl: "/api/finance/currency/select",
        },
    },
];

const nodes: ViewNode[] = [
    {
        render: "#SheetGroup",
        children: [
            {render: "#DisplayCard", field: {name: "name", widget: "#DisplayCard"}},
            {render: "#DisplayCard", field: {name: "address", widget: "#DisplayCard"}},
            {render: "#DisplayCard", field: {name: "legacyTotal", widget: "#DisplayCard"}},
        ],
    },
];

const fields = () => buildModelFields({readPaths, writePaths, columns, nodes});

function byPath(path: string) {
    return fields().find((field) => field.path === path)!;
}

describe("buildModelFields", () => {
    it("lists every allowed path, parents above their own children", () => {
        expect(fields().map((field) => field.path)).toEqual([
            "address",
            "address.city",
            "address.street",
            "currency",
            "legacyTotal",
            "name",
        ]);
    });

    it("marks read and write separately", () => {
        expect(byPath("address.city")).toMatchObject({readable: true, writable: true});
        expect(byPath("address.street")).toMatchObject({readable: true, writable: false});
    });

    it("records where the view binds a field, with the key the tree reveals", () => {
        expect(byPath("name").renderedBy).toEqual([
            {nodeKey: "0.0", render: "#DisplayCard", widget: "#DisplayCard"},
        ]);
        expect(byPath("address.street").renderedBy).toEqual([]);
    });

    it("flags a child reached through a bound ancestor rather than calling it missing", () => {
        expect(byPath("address.street").coveredByAncestor).toBe(true);
        expect(byPath("name").coveredByAncestor).toBe(false);
    });

    it("keeps a bound path that is in neither allowlist", () => {
        expect(byPath("legacyTotal")).toMatchObject({inAllowlist: false, readable: false});
        expect(byPath("name").inAllowlist).toBe(true);
    });

    it("carries column type, ref and select url through", () => {
        expect(byPath("currency")).toMatchObject({
            column: {id: "currency", visible: false, cellType: COLUMN_TYPE.OBJECT_ID},
            ref: "Currency",
            apiUrl: "/api/finance/currency/select",
        });
        expect(byPath("address.city").column).toBeUndefined();
    });

    it("calls a path with descendants a container", () => {
        expect(byPath("address").leaf).toBe(false);
        expect(byPath("address.city").leaf).toBe(true);
    });
});

describe("isRendered", () => {
    it("means a bound node in a view and a column in a table", () => {
        expect(isRendered(byPath("currency"), "view")).toBe(false);
        expect(isRendered(byPath("currency"), "table")).toBe(true);
        expect(isRendered(byPath("address"), "view")).toBe(true);
        expect(isRendered(byPath("address"), "table")).toBe(false);
    });
});

describe("filterFields", () => {
    it("filters by substring on the whole path", () => {
        expect(filterFields(fields(), "view", {query: "city"}).map((f) => f.path)).toEqual([
            "address.city",
        ]);
    });

    it("splits rendered from missing per mode", () => {
        expect(filterFields(fields(), "view", {status: "rendered"}).map((f) => f.path)).toEqual([
            "address",
            "legacyTotal",
            "name",
        ]);
        expect(filterFields(fields(), "table", {status: "rendered"}).map((f) => f.path)).toEqual([
            "currency",
            "name",
        ]);
    });

    it("drops container paths when asked for leaves only", () => {
        expect(filterFields(fields(), "view", {leavesOnly: true}).map((f) => f.path)).not.toContain(
            "address",
        );
    });
});

describe("summarizeFields", () => {
    it("counts what is on screen and what is not in the allowlist", () => {
        expect(summarizeFields(fields(), "view")).toEqual({
            total: 6,
            rendered: 3,
            missing: 3,
            unknown: 1,
        });
    });
});

describe("toCoveragePath", () => {
    it("hands the scaffold what it needs to pick a widget", () => {
        expect(toCoveragePath(byPath("currency"))).toEqual({
            path: "currency",
            leaf: true,
            cellType: COLUMN_TYPE.OBJECT_ID,
            ref: "Currency",
            apiUrl: "/api/finance/currency/select",
            enumValues: undefined,
        });
    });
});
