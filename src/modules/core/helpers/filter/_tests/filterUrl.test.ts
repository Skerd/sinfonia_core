import { describe, expect, it } from "vitest";
import type { FilterGroup } from "armonia/src/modules/core/database/filter";
import {
    buildFilterGroup,
    buildFilterRule,
    buildListDrillDownUrl,
    buildListNavigationUrl,
    decodeFilterFromUrl,
    decodeFilterLabelsFromUrl,
    encodeFilterLabelsToUrl,
    encodeFilterToUrl,
    FILTER_URL_PARAM,
    pruneFilterLabelsToDsl,
    stripListChromeParams,
    stripUserFilterParams,
} from "@coreModule/helpers/filter/filterUrl.ts";
import { isFilterGroupEmpty, mergeAndFilterDSL } from "@coreModule/helpers/filter/mergeFilterDsl.ts";

const group = (overrides: Partial<FilterGroup> = {}): FilterGroup => ({
    id: "g",
    operator: "and",
    rules: [],
    groups: [],
    ...overrides,
});

describe("filter URL encoding", () => {
    it("round-trips a DSL with non-Latin-1 text through URLSearchParams", () => {
        const dsl = buildFilterGroup([buildFilterRule("city", "contains", "Zürich – Durrës ✓")]);
        const url = buildListDrillDownUrl("/list", { filter: dsl });
        const param = new URL(url, "http://x").searchParams.get(FILTER_URL_PARAM);
        expect(param).not.toMatch(/[%+/=]/);
        expect(decodeFilterFromUrl(param)).toEqual(dsl);
    });

    it("still reads legacy encodeURIComponent(btoa(json)) params", () => {
        const dsl = buildFilterGroup([buildFilterRule("name", "equals", "Müller??>>")]);
        const legacy = encodeURIComponent(btoa(JSON.stringify(dsl)));
        expect(decodeFilterFromUrl(legacy)).toEqual(dsl);
    });

    it("rejects malformed or too-deep trees", () => {
        const bad = (value: unknown) => decodeFilterFromUrl(encodeFilterToUrl(value as FilterGroup));
        expect(bad(group({ rules: [{ id: "r", field: "a", operator: "nope", value: 1 }] as never }))).toBeUndefined();
        expect(bad(group({ groups: [{ id: "x" }] as never }))).toBeUndefined();
        let deep = group();
        for (let i = 0; i < 5; i++) deep = group({ groups: [deep] });
        expect(bad(deep)).toBeUndefined();
        expect(decodeFilterFromUrl("not base64!")).toBeUndefined();
    });

    it("round-trips and sanitizes labels", () => {
        const encoded = encodeFilterLabelsToUrl({ project: { a1: "Résidence", a2: "" }, empty: {} });
        expect(decodeFilterLabelsFromUrl(encoded)).toEqual({ project: { a1: "Résidence" } });
    });
});

describe("pruneFilterLabelsToDsl", () => {
    it("keeps only ids referenced by the DSL", () => {
        const dsl = group({
            rules: [buildFilterRule("project", "in", ["a1"])],
            groups: [group({ rules: [buildFilterRule("unit", "equals", "u1")] })],
        });
        const labels = { project: { a1: "A1", a2: "A2" }, unit: { u1: "U1" }, other: { z: "Z" } };
        expect(pruneFilterLabelsToDsl(labels, dsl)).toEqual({ project: { a1: "A1" }, unit: { u1: "U1" } });
    });
});

describe("mergeAndFilterDSL", () => {
    const a = buildFilterRule("a", "equals", 1);
    const b = buildFilterRule("b", "equals", 2);

    it("returns the non-empty side unchanged", () => {
        const g = group({ rules: [a] });
        expect(mergeAndFilterDSL(g, group({ groups: [group()] }))).toBe(g);
        expect(mergeAndFilterDSL(undefined, g)).toBe(g);
        expect(isFilterGroupEmpty({ id: "x" } as FilterGroup)).toBe(true);
    });

    it("flattens and-roots, nests or-roots, prepend first", () => {
        const orGroup = group({ operator: "or", rules: [b] });
        const merged = mergeAndFilterDSL(orGroup, group({ rules: [a] }));
        expect(merged).toMatchObject({ operator: "and", rules: [a], groups: [orGroup] });

        const twice = mergeAndFilterDSL(merged, group({ rules: [b] }));
        expect(twice).toMatchObject({ rules: [b, a], groups: [orGroup] });
    });
});

describe("navigation URLs", () => {
    it("scoped keeps only listView + scope", () => {
        const url = buildListNavigationUrl({
            path: "/p",
            from: "?listView=card&filter=x&qf_a=1&listPage=3",
            scope: { projectId: "1", edificeId: null },
            policy: "scoped",
        });
        expect(url).toBe("/p?listView=card&projectId=1");
    });

    it("carry keeps params, applies scope, resets page, and does not mutate `from`", () => {
        const from = new URLSearchParams("qf_a=1&listPage=3&edificeId=9");
        const url = buildListNavigationUrl({ path: "/p", from, scope: { edificeId: "", floorId: "2" }, policy: "carry" });
        expect(url).toBe("/p?qf_a=1&floorId=2");
        expect(from.get("listPage")).toBe("3");
    });

    it("drill-down skips empty filters and empty params", () => {
        expect(buildListDrillDownUrl("/p", { filter: group({ groups: [group()] }), queryParams: { a: "", b: undefined } })).toBe("/p");
    });

    it("strips user filter and chrome params", () => {
        const params = new URLSearchParams("filter=1&qf_a=1&qf_a=2&ep_b=1&listView=card&listView_x=t&listPage_x=2&listSort=s&keep=1");
        stripUserFilterParams(params);
        stripListChromeParams(params, true);
        expect(params.toString()).toBe("listView=card&listView_x=t&keep=1");
    });
});
