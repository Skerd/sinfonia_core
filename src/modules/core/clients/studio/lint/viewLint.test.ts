import {describe, expect, it} from "vitest";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {CORE_WIDGET_META} from "@coreModule/components/viewEngine/widgetMeta.ts";
import {countBySeverity, findingsByPath, lintViewConfig, type LintContext} from "./viewLint.ts";

const KNOWN_TOKENS = [
    ...Object.keys(CORE_WIDGET_META),
    "#FormFloorPolygon",
    "#FormUnitPolygon",
];

function ctx(overrides: Partial<LintContext> = {}): LintContext {
    return {
        viewType: "sheet",
        readPaths: [],
        writePaths: [],
        knownTokens: KNOWN_TOKENS,
        getMeta: (token) => CORE_WIDGET_META[token],
        iconResolves: (token) => token.startsWith("#Icon"),
        ...overrides,
    };
}

function config(nodes: ViewConfig["nodes"], overrides: Partial<ViewConfig> = {}): ViewConfig {
    return {
        model: "warehouses",
        viewType: "sheet",
        accessModel: "warehouses",
        apiUrl: "/api/eCommerce/warehouse",
        nodes,
        ...overrides,
    };
}

function rules(findings: {rule: string}[]): string[] {
    return [...new Set(findings.map((f) => f.rule))].sort();
}

describe("structural rules", () => {
    it("flags children nested under a component that does not render them", () => {
        const findings = lintViewConfig(
            config([
                {
                    render: "#DisplayCard",
                    field: {name: "name", widget: "#DisplayCard"},
                    children: [{render: "#DisplayCard", field: {name: "code", widget: "#DisplayCard"}}],
                },
            ]),
            ctx(),
        );
        expect(rules(findings)).toContain("children-on-non-container");
    });

    it("accepts children under a real container", () => {
        const findings = lintViewConfig(
            config([
                {
                    render: "#SheetGroup",
                    props: {title: "overview"},
                    children: [{render: "#DisplayCard", field: {name: "name", widget: "#DisplayCard"}}],
                },
            ]),
            ctx(),
        );
        expect(rules(findings)).not.toContain("children-on-non-container");
    });

    it("assumes an undescribed token may be a container rather than crying wolf", () => {
        const findings = lintViewConfig(
            config([{render: "#ModuleThing", children: [{render: "div"}]}]),
            ctx({knownTokens: [...KNOWN_TOKENS, "#ModuleThing"]}),
        );
        expect(rules(findings)).not.toContain("children-on-non-container");
    });

    it("flags tokens the registry does not hold", () => {
        const findings = lintViewConfig(
            config([
                {render: "#NotReal"},
                {render: "#DisplayCard", field: {name: "n", widget: "#AlsoNotReal"}},
            ]),
            ctx(),
        );
        expect(rules(findings)).toEqual(
            expect.arrayContaining(["unknown-render-token", "unknown-widget-token"]),
        );
    });

    it("never reports the #Field pseudo-token as unknown", () => {
        const findings = lintViewConfig(
            config([{render: "#Field", field: {name: "name", widget: "#Input"}}], {
                viewType: "form",
                viewMode: "create",
            }),
            ctx({viewType: "form", viewMode: "create"}),
        );
        expect(rules(findings)).not.toContain("unknown-render-token");
    });
});

describe("sheet binding shape", () => {
    it("flags #Field used in a sheet", () => {
        const findings = lintViewConfig(
            config([{render: "#Field", field: {name: "name", widget: "#DisplayCard"}}]),
            ctx(),
        );
        expect(rules(findings)).toContain("sheet-field-pseudo-token");
    });

    it("flags a sheet node whose render disagrees with its widget", () => {
        const findings = lintViewConfig(
            config([{render: "#Badge", field: {name: "name", widget: "#DisplayCard"}}]),
            ctx(),
        );
        expect(rules(findings)).toContain("sheet-render-widget-mismatch");
    });

    it("accepts the matching pair", () => {
        const findings = lintViewConfig(
            config([{render: "#DisplayCard", field: {name: "name", widget: "#DisplayCard"}}]),
            ctx(),
        );
        expect(rules(findings)).not.toContain("sheet-render-widget-mismatch");
    });
});

describe("inert config", () => {
    it("flags write permissions on a sheet and on a create form, but not on an edit form", () => {
        const node = {
            render: "#DisplayCard",
            field: {name: "name", widget: "#DisplayCard"},
            permissions: {write: "name"},
        };
        expect(rules(lintViewConfig(config([node]), ctx()))).toContain("write-permission-inert");
        expect(
            rules(
                lintViewConfig(
                    config([node], {viewType: "form", viewMode: "create"}),
                    ctx({viewType: "form", viewMode: "create"}),
                ),
            ),
        ).toContain("write-permission-inert");
        expect(
            rules(
                lintViewConfig(
                    config([node], {viewType: "form", viewMode: "edit"}),
                    ctx({viewType: "form", viewMode: "edit"}),
                ),
            ),
        ).not.toContain("write-permission-inert");
    });

    it("flags skipReadAccessGate on a form and skipWriteAccessGate on a sheet", () => {
        const formFindings = lintViewConfig(
            config(
                [{render: "#Field", field: {name: "n", widget: "#Input", skipReadAccessGate: true}}],
                {viewType: "form", viewMode: "edit"},
            ),
            ctx({viewType: "form", viewMode: "edit"}),
        );
        expect(rules(formFindings)).toContain("skip-read-gate-inert");

        const sheetFindings = lintViewConfig(
            config([
                {
                    render: "#DisplayCard",
                    field: {name: "n", widget: "#DisplayCard", skipWriteAccessGate: true},
                },
            ]),
            ctx(),
        );
        expect(rules(sheetFindings)).toContain("skip-write-gate-inert");
    });

    it("flags dependentRuntimeOnly with nothing to evaluate", () => {
        expect(
            rules(lintViewConfig(config([{render: "div", dependentRuntimeOnly: true}]), ctx())),
        ).toContain("dependent-runtime-only-inert");

        expect(
            rules(
                lintViewConfig(
                    config([{render: "div", dependent: "price", dependentRuntimeOnly: true}]),
                    ctx(),
                ),
            ),
        ).not.toContain("dependent-runtime-only-inert");
    });
});

describe("access allowlists", () => {
    const nodes: ViewConfig["nodes"] = [
        {render: "#DisplayCard", field: {name: "name", widget: "#DisplayCard"}},
        {render: "#DisplayCard", field: {name: "secret", widget: "#DisplayCard"}},
    ];

    it("flags a sheet field outside the read allowlist as a value-locking warning", () => {
        const findings = lintViewConfig(config(nodes), ctx({readPaths: ["name"]}));
        const hit = findings.find((f) => f.rule === "field-path-not-readable");
        expect(hit?.label).toBe("#DisplayCard[secret]");
        /* The server does not prune on `field.name`; the renderer locks the value. */
        expect(hit?.severity).toBe("warning");
        expect(hit?.message).not.toMatch(/prune/i);
    });

    it("stays silent when no access data is loaded", () => {
        expect(rules(lintViewConfig(config(nodes), ctx({readPaths: []})))).not.toContain(
            "field-path-not-readable",
        );
    });

    it("exempts virtual paths, statistics and the polygon widgets, as the renderer does", () => {
        const findings = lintViewConfig(
            config([
                {render: "#DisplayCard", field: {name: "_id", widget: "#DisplayCard"}},
                {render: "#DisplayCard", field: {name: "__unitRefs", widget: "#DisplayCard"}},
                /* `resolveDisplayCardValueAccessSpec` returns null for `statistics.*`
                   outright, with no `skipReadAccessGate` needed. */
                {render: "#DisplayCard", field: {name: "statistics", widget: "#DisplayCard"}},
                {render: "#DisplayCard", field: {name: "statistics.sold", widget: "#DisplayCard"}},
                {
                    render: "#DisplayCard",
                    field: {name: "stats.total", widget: "#DisplayCard", skipReadAccessGate: true},
                },
            ]),
            ctx({readPaths: ["name"]}),
        );
        expect(rules(findings)).not.toContain("field-path-not-readable");
    });

    it("flags an edit-form field outside the write allowlist as a warning", () => {
        const findings = lintViewConfig(
            config([{render: "#Field", field: {name: "secret", widget: "#Input"}}], {
                viewType: "form",
                viewMode: "edit",
            }),
            ctx({viewType: "form", viewMode: "edit", writePaths: ["name"]}),
        );
        const hit = findings.find((f) => f.rule === "field-path-not-writable");
        expect(hit?.severity).toBe("warning");
    });

    it("respects the documented write-gate opt-outs", () => {
        const findings = lintViewConfig(
            config(
                [
                    {
                        render: "#Field",
                        field: {name: "helper", widget: "#Input", skipWriteAccessGate: true},
                    },
                    {
                        render: "#Field",
                        field: {name: "other", widget: "#Input", renderWhenWriteAny: ["name"]},
                    },
                ],
                {viewType: "form", viewMode: "edit"},
            ),
            ctx({viewType: "form", viewMode: "edit", writePaths: ["name"]}),
        );
        expect(rules(findings)).not.toContain("field-path-not-writable");
    });

    it("flags a permissions path that is not in the read allowlist", () => {
        const findings = lintViewConfig(
            config([
                {
                    render: "#SheetGroup",
                    props: {title: "t"},
                    permissions: {read: "ghost"},
                    children: [],
                },
            ]),
            ctx({readPaths: ["name"]}),
        );
        const hit = findings.find((f) => f.rule === "permission-path-not-readable");
        /* This one really is a server-side prune, so it is an error. */
        expect(hit?.severity).toBe("error");
        expect(hit?.message).toMatch(/filterNodes/);
    });
});

describe("props and icons", () => {
    it("flags a missing required prop", () => {
        const findings = lintViewConfig(
            config([{render: "#ReferencesViewModeScope", props: {}, children: []}]),
            ctx(),
        );
        const hit = findings.find((f) => f.rule === "missing-required-prop");
        expect(hit?.message).toContain("storageKey");
    });

    it("flags a required widgetProp missing on #ApiSelect", () => {
        const findings = lintViewConfig(
            config([{render: "#Field", field: {name: "country", widget: "#ApiSelect"}}], {
                viewType: "form",
                viewMode: "create",
            }),
            ctx({viewType: "form", viewMode: "create"}),
        );
        const hit = findings.find((f) => f.rule === "missing-required-prop");
        expect(hit?.message).toContain("apiUrl");
    });

    it("flags an icon token that does not resolve, wherever it sits", () => {
        const findings = lintViewConfig(
            config([
                {render: "#SheetGroup", props: {title: "t", titleIcon: "#Nope"}, children: []},
                {
                    render: "#DisplayCard",
                    field: {name: "name", widget: "#DisplayCard", widgetProps: {icon: "#AlsoNope"}},
                },
            ]),
            ctx(),
        );
        expect(findings.filter((f) => f.rule === "icon-does-not-resolve")).toHaveLength(2);
    });

    it("accepts an icon that resolves", () => {
        const findings = lintViewConfig(
            config([{render: "#SheetGroup", props: {title: "t", titleIcon: "#IconTag"}, children: []}]),
            ctx(),
        );
        expect(rules(findings)).not.toContain("icon-does-not-resolve");
    });
});

describe("language keys", () => {
    const nodes: ViewConfig["nodes"] = [
        {
            render: "#DisplayCard",
            field: {name: "name", widget: "#DisplayCard", label: "form.known"},
        },
        {
            render: "#DisplayCard",
            field: {name: "code", widget: "#DisplayCard", label: "form.missing"},
        },
    ];

    it("stays silent when no language path is selected", () => {
        expect(rules(lintViewConfig(config(nodes), ctx()))).not.toContain(
            "language-key-unresolved",
        );
    });

    it("flags only the keys that do not resolve", () => {
        const findings = lintViewConfig(
            config(nodes),
            ctx({languageKeyResolves: (key) => key === "form.known"}),
        );
        const hits = findings.filter((f) => f.rule === "language-key-unresolved");
        expect(hits).toHaveLength(1);
        expect(hits[0]!.message).toContain("form.missing");
    });
});

describe("a realistic clean config", () => {
    /** Shaped like `warehouse.views.ts`: the lint must find nothing to say about it. */
    const clean = config(
        [
            {
                render: "#SheetGroup",
                props: {title: "overview", titleIcon: "#IconBuilding"},
                children: [
                    {
                        render: "#SheetGrid",
                        props: {columns: 3},
                        children: [
                            {
                                render: "#DisplayCard",
                                field: {
                                    name: "name",
                                    widget: "#DisplayCard",
                                    label: "form.nameLabel",
                                    widgetProps: {icon: "#IconTag"},
                                },
                            },
                            {
                                render: "#DisplayCard",
                                field: {name: "code", widget: "#DisplayCard", label: "form.codeLabel"},
                            },
                        ],
                    },
                ],
            },
            {
                render: "#SheetGroup",
                props: {title: "address"},
                permissions: {read: "address"},
                dependent: "address",
                children: [
                    {
                        render: "#DisplayCard",
                        field: {name: "address.country", widget: "#DisplayCard"},
                    },
                ],
            },
        ],
    );

    it("produces no findings", () => {
        const findings = lintViewConfig(
            clean,
            ctx({
                readPaths: ["name", "code", "address", "address.country"],
                languageKeyResolves: () => true,
            }),
        );
        expect(findings).toEqual([]);
    });
});

describe("output shape", () => {
    it("sorts errors before warnings, then by document order", () => {
        const findings = lintViewConfig(
            config([
                {render: "div", dependentRuntimeOnly: true},
                {render: "#Nope"},
            ]),
            ctx(),
        );
        expect(findings[0]!.severity).toBe("error");
        expect(findings.at(-1)!.severity).toBe("warning");
    });

    it("counts and groups findings", () => {
        const findings = lintViewConfig(
            config([
                {render: "div", dependentRuntimeOnly: true},
                {render: "#Nope"},
            ]),
            ctx(),
        );
        expect(countBySeverity(findings)).toEqual({errors: 1, warnings: 1});
        const grouped = findingsByPath(findings);
        expect(grouped.get("0")).toHaveLength(1);
        expect(grouped.get("1")).toHaveLength(1);
    });
});
