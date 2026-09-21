import {describe, expect, it} from "vitest";
import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {
    TableColumnConfig,
} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import {CORE_WIDGET_META} from "@coreModule/components/viewEngine/widgetMeta.ts";
import {lintViewConfig} from "../lint/viewLint.ts";
import {computeCoverage, boundPaths, type CoveragePath} from "../coverage/viewCoverage.ts";
import {scaffoldNode, scaffoldNodes, widgetForPath, widgetPropsForPath} from "./scaffoldView.ts";

function entry(overrides: Partial<CoveragePath> = {}): CoveragePath {
    return {path: "name", leaf: true, ...overrides};
}

function column(overrides: Partial<TableColumnConfig> = {}): TableColumnConfig {
    return {
        id: "name",
        accessorPath: "name",
        labelKey: "name",
        cellType: COLUMN_TYPE.STRING,
        sortable: true,
        visible: true,
        ...overrides,
    };
}

describe("boundPaths", () => {
    it("collects field names across the whole tree, ignoring placeholders", () => {
        const nodes: ViewNode[] = [
            {
                render: "#SheetGroup",
                props: {title: "t"},
                children: [
                    {render: "#DisplayCard", field: {name: "name", widget: "#DisplayCard"}},
                    {render: "#DisplayCard", field: {name: "", widget: "#DisplayCard"}},
                ],
            },
            {render: "#DisplayCard", field: {name: "code", widget: "#DisplayCard"}},
        ];
        expect(boundPaths(nodes).sort()).toEqual(["code", "name"]);
    });
});

describe("computeCoverage", () => {
    const universe = ["name", "code", "address", "address.city", "price"];

    it("lists allowed paths the view does not bind", () => {
        const nodes: ViewNode[] = [
            {render: "#DisplayCard", field: {name: "name", widget: "#DisplayCard"}},
        ];
        const coverage = computeCoverage(nodes, universe, []);
        expect(coverage.unbound.map((e) => e.path)).toEqual([
            "code",
            "address",
            "address.city",
            "price",
        ]);
        expect(coverage.total).toBe(5);
    });

    it("treats a bound parent as covering its subtree", () => {
        const nodes: ViewNode[] = [
            {render: "#EmbeddedAddressCard", field: {name: "address", widget: "#EmbeddedAddressCard"}},
        ];
        const coverage = computeCoverage(nodes, universe, []);
        expect(coverage.unbound.map((e) => e.path)).not.toContain("address.city");
    });

    it("marks parents as non-leaf so the scaffold skips them", () => {
        const coverage = computeCoverage([], universe, []);
        const byPath = new Map(coverage.unbound.map((e) => [e.path, e]));
        expect(byPath.get("address")!.leaf).toBe(false);
        expect(byPath.get("address.city")!.leaf).toBe(true);
        expect(byPath.get("name")!.leaf).toBe(true);
    });

    it("reports bound paths that are not in the allowlist", () => {
        const nodes: ViewNode[] = [
            {render: "#DisplayCard", field: {name: "ghost", widget: "#DisplayCard"}},
        ];
        expect(computeCoverage(nodes, universe, []).unknown).toEqual(["ghost"]);
    });

    it("joins column metadata onto the matching path", () => {
        const columns = [
            column({
                id: "price",
                cellType: COLUMN_TYPE.OBJECT_ID,
                filterConfig: {
                    type: COLUMN_TYPE.OBJECT_ID,
                    operators: [],
                    ref: "Currency",
                    apiUrl: "/api/finance/currency/select",
                },
            }),
        ];
        const found = computeCoverage([], universe, columns).unbound.find((e) => e.path === "price");
        expect(found?.cellType).toBe(COLUMN_TYPE.OBJECT_ID);
        expect(found?.apiUrl).toBe("/api/finance/currency/select");
        expect(found?.ref).toBe("Currency");
    });
});

describe("widgetForPath", () => {
    it("maps every column type to a token the registry actually holds", () => {
        const known = new Set(Object.keys(CORE_WIDGET_META));
        for (const cellType of Object.values(COLUMN_TYPE)) {
            for (const mode of ["sheet", "form"] as const) {
                const token = widgetForPath(entry({cellType}), mode);
                expect(known.has(token), `${cellType} → ${token} (${mode})`).toBe(true);
            }
        }
    });

    it("keeps widgets on the right side of the sheet/form split", () => {
        for (const cellType of Object.values(COLUMN_TYPE)) {
            const sheetToken = widgetForPath(entry({cellType}), "sheet");
            expect(CORE_WIDGET_META[sheetToken]!.modes, `${cellType} sheet`).toContain("sheet");

            const formToken = widgetForPath(entry({cellType}), "form");
            expect(CORE_WIDGET_META[formToken]!.modes, `${cellType} form`).toContain("form");
        }
    });

    it("falls back sensibly when the path has no column", () => {
        expect(widgetForPath(entry(), "sheet")).toBe("#DisplayCard");
        expect(widgetForPath(entry(), "form")).toBe("#Input");
    });
});

describe("widgetPropsForPath", () => {
    it("seeds an ApiSelect from the derived select URL", () => {
        const props = widgetPropsForPath(
            entry({cellType: COLUMN_TYPE.OBJECT_ID, apiUrl: "/api/auxiliary/country/select"}),
            "form",
        );
        expect(props).toEqual({
            apiUrl: "/api/auxiliary/country/select",
            method: "POST",
            pageSize: 50,
        });
    });

    it("seeds a select from the derived enum values", () => {
        const props = widgetPropsForPath(
            entry({cellType: COLUMN_TYPE.ENUM, enumValues: ["draft", "active"]}),
            "form",
        );
        expect(props).toEqual({
            options: [
                {value: "draft", label: "draft"},
                {value: "active", label: "active"},
            ],
        });
    });

    it("adds nothing for a sheet or an undescribed path", () => {
        expect(widgetPropsForPath(entry({cellType: COLUMN_TYPE.OBJECT_ID}), "sheet")).toBeUndefined();
        expect(widgetPropsForPath(entry({cellType: COLUMN_TYPE.OBJECT_ID}), "form")).toBeUndefined();
    });
});

describe("scaffoldNode", () => {
    it("uses the #Field pseudo-token in a form and the widget in a sheet", () => {
        expect(scaffoldNode(entry(), "form").render).toBe("#Field");
        expect(scaffoldNode(entry(), "sheet").render).toBe("#DisplayCard");
    });

    it("labels with the path, which is what the preview can honestly show", () => {
        expect(scaffoldNode(entry({path: "address.city"}), "sheet").field?.label).toBe(
            "address.city",
        );
    });
});

describe("scaffoldNodes", () => {
    const paths = ["name", "code", "price"].map((path) => entry({path}));

    it("wraps sheet fields in a group and a grid", () => {
        const [group] = scaffoldNodes(paths, "sheet");
        expect(group!.render).toBe("#SheetGroup");
        expect(group!.children![0]!.render).toBe("#SheetGrid");
        expect(group!.children![0]!.children).toHaveLength(3);
    });

    it("wraps form fields in a collapsible and a form grid", () => {
        const [group] = scaffoldNodes(paths, "form");
        expect(group!.render).toBe("#TitleWithCollapse");
        expect(group!.children![0]!.render).toBe("#FormGrid");
    });

    it("skips non-leaf parent paths", () => {
        const nodes = scaffoldNodes(
            [entry({path: "address", leaf: false}), entry({path: "address.city"})],
            "sheet",
        );
        const fields = nodes[0]!.children![0]!.children!;
        expect(fields).toHaveLength(1);
        expect(fields[0]!.field?.name).toBe("address.city");
    });

    it("splits into several groups rather than one enormous one", () => {
        const many = Array.from({length: 25}, (_, i) => entry({path: `f${i}`}));
        expect(scaffoldNodes(many, "sheet").length).toBeGreaterThan(1);
    });

    it("returns nothing when there is nothing to scaffold", () => {
        expect(scaffoldNodes([], "sheet")).toEqual([]);
    });
});

describe("scaffold output passes lint", () => {
    const universe = ["name", "code", "price", "country"];
    const columns = [
        column({id: "name"}),
        column({id: "code"}),
        column({id: "price", cellType: COLUMN_TYPE.NUMBER}),
        column({
            id: "country",
            cellType: COLUMN_TYPE.OBJECT_ID,
            filterConfig: {
                type: COLUMN_TYPE.OBJECT_ID,
                operators: [],
                apiUrl: "/api/auxiliary/country/select",
            },
        }),
    ];

    for (const [viewType, viewMode] of [
        ["sheet", undefined],
        ["form", "create"],
    ] as const) {
        it(`produces a clean ${viewType} config`, () => {
            const coverage = computeCoverage([], universe, columns);
            const nodes = scaffoldNodes(coverage.unbound, viewType, {groupTitle: "details"});
            const findings = lintViewConfig(
                {
                    model: "m",
                    viewType,
                    viewMode,
                    accessModel: "m",
                    apiUrl: "/api/m",
                    nodes,
                },
                {
                    viewType,
                    viewMode,
                    readPaths: universe,
                    writePaths: universe,
                    knownTokens: Object.keys(CORE_WIDGET_META),
                    getMeta: (token) => CORE_WIDGET_META[token],
                    iconResolves: () => true,
                },
            );
            expect(findings).toEqual([]);
        });
    }
});
