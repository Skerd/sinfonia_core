import {act, renderHook} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ReactNode} from "react";
import {MemoryRouter, useLocation, useNavigate, useNavigationType} from "react-router-dom";
import type {SortingState} from "@tanstack/react-table";
import {
    clearExtraParams,
    clearQuickFilterParams,
    extraParamKey,
    extraParamLabelKey,
    listChromeParam,
    quickFilterLabelParamKey,
    quickFilterParamKey,
    readExtraParamLabelsFromUrl,
    readExtraParamsFromUrl,
    readQuickFilterLabelsFromUrl,
    readQuickFiltersFromUrl,
    useListUrlState,
    writeExtraParam,
    writeQuickFilterParam,
    type EntityListViewMode,
} from "@coreModule/helpers/hooks/useListUrlState.ts";

type SetSearchParams = Parameters<typeof writeQuickFilterParam>[0];

/** Captures what a writer helper would do to `initial`, and the navigation options it passes. */
function applyWriter(initial: string, run: (setSearchParams: SetSearchParams) => void) {
    let result = new URLSearchParams(initial);
    const setSearchParams = vi.fn((updater: unknown, options?: unknown) => {
        result = (updater as (prev: URLSearchParams) => URLSearchParams)(new URLSearchParams(initial));
        return options;
    });
    run(setSearchParams as unknown as SetSearchParams);
    return {params: Object.fromEntries(result.entries()), options: setSearchParams.mock.calls[0]?.[1]};
}

describe("param key helpers", () => {
    it("namespaces chrome params by a sanitized scope", () => {
        expect(listChromeParam("listView")).toBe("listView");
        expect(listChromeParam("listView", null)).toBe("listView");
        expect(listChromeParam("listView", "userSessions")).toBe("listView_userSessions");
        expect(listChromeParam("listPage", "a b/c?d-e_f")).toBe("listPage_abcd-e_f");
        expect(listChromeParam("listSort", "!!!")).toBe("listSort");
    });

    it("builds quick-filter and extra-param keys", () => {
        expect(quickFilterParamKey("project")).toBe("qf_project");
        expect(quickFilterLabelParamKey("project")).toBe("qf_project_label");
        expect(extraParamKey("reservedBy")).toBe("ep_reservedBy");
        expect(extraParamLabelKey("reservedBy")).toBe("ep_reservedBy_label");
    });
});

describe("quick filter and extra param URL helpers", () => {
    const params = new URLSearchParams("qf_status=sold&qf_project=p1&qf_project_label=Tower&qf_empty=&ep_owner=u1&ep_owner_label=Ann");

    it("reads values and labels, treating missing or empty values as null", () => {
        expect(readQuickFiltersFromUrl(params, ["status", "project", "empty", "missing"]))
            .toEqual({status: "sold", project: "p1", empty: null, missing: null});
        expect(readQuickFilterLabelsFromUrl(params, ["project", "status"])).toEqual({project: "Tower", status: null});
        expect(readExtraParamsFromUrl(params, ["owner", "other"])).toEqual({owner: "u1", other: null});
        expect(readExtraParamLabelsFromUrl(params, ["owner"])).toEqual({owner: "Ann"});
    });

    it("writes a value and label, resets the page, keeps other params, and replaces history", () => {
        const {params: next, options} = applyWriter("filter=x&listPage=4&qf_project=old", (set) =>
            writeQuickFilterParam(set, "project", "p2", "Tower 2"));

        expect(next).toEqual({filter: "x", qf_project: "p2", qf_project_label: "Tower 2"});
        expect(options).toEqual({replace: true});
    });

    it("keeps an existing label when none is given, and drops it for null or empty", () => {
        const initial = "qf_project=p1&qf_project_label=Tower";
        expect(applyWriter(initial, (set) => writeQuickFilterParam(set, "project", "p2")).params)
            .toEqual({qf_project: "p2", qf_project_label: "Tower"});
        expect(applyWriter(initial, (set) => writeQuickFilterParam(set, "project", "p2", null)).params)
            .toEqual({qf_project: "p2"});
        expect(applyWriter(initial, (set) => writeQuickFilterParam(set, "project", "p2", "")).params)
            .toEqual({qf_project: "p2"});
    });

    it("removes value and label when the value is cleared", () => {
        const initial = "ep_owner=u1&ep_owner_label=Ann&listPage=2";
        expect(applyWriter(initial, (set) => writeExtraParam(set, "owner", null)).params).toEqual({});
        expect(applyWriter(initial, (set) => writeExtraParam(set, "owner", "", "ignored")).params).toEqual({});
    });

    it("resets a scoped page param when given one", () => {
        const {params: next} = applyWriter("listPage=2&listPage_units=5", (set) =>
            writeExtraParam(set, "owner", "u1", "Ann", "listPage_units"));
        expect(next).toEqual({listPage: "2", ep_owner: "u1", ep_owner_label: "Ann"});
    });

    it("clears several fields with their labels", () => {
        const initial = "qf_a=1&qf_a_label=A&qf_b=2&qf_c=3&listPage=3&ep_x=9&ep_x_label=X&ep_y=8";
        expect(applyWriter(initial, (set) => clearQuickFilterParams(set, ["a", "b"])).params)
            .toEqual({qf_c: "3", ep_x: "9", ep_x_label: "X", ep_y: "8"});
        expect(applyWriter(initial, (set) => clearExtraParams(set, ["x"])).params)
            .toEqual({qf_a: "1", qf_a_label: "A", qf_b: "2", qf_c: "3", ep_y: "8"});
    });
});

describe("useListUrlState", () => {
    type Options = {fallbackView?: EntityListViewMode; limit: number; paramScope?: string | null};

    function setup(initialUrl = "/list", initialOptions: Options = {limit: 20}) {
        const wrapper = ({children}: {children: ReactNode}) => (
            <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter>
        );
        return renderHook(
            (options: Options) => ({
                state: useListUrlState(options),
                search: new URLSearchParams(useLocation().search),
                navigationType: useNavigationType(),
                navigate: useNavigate(),
            }),
            {initialProps: initialOptions, wrapper},
        );
    }

    it("defaults to the fallback view, page 1 and no sorting", () => {
        const {result} = setup("/list", {limit: 20, fallbackView: "table"});

        expect(result.current.state).toMatchObject({viewMode: "table", page: 1, offset: 0, sorting: []});
    });

    it("reads scoped view, page and sort params", () => {
        const {result} = setup(
            "/list?listView_units=table&listPage_units=3&listSort_units=name:desc&listPage=9",
            {limit: 20, paramScope: "units"},
        );

        expect(result.current.state).toMatchObject({
            viewMode: "table",
            page: 3,
            offset: 40,
            sorting: [{id: "name", desc: true}],
        });
    });

    it.each([
        ["listView=grid", {viewMode: "card"}],
        ["listPage=abc", {page: 1}],
        ["listPage=-2", {page: 1}],
        ["listPage=0", {page: 1}],
        ["listPage=2.7", {page: 2, offset: 10}],
        ["listSort=:desc", {sorting: []}],
        ["listSort=price", {sorting: [{id: "price", desc: false}]}],
        ["listSort=meta:key:desc", {sorting: [{id: "meta:key", desc: true}]}],
    ])("sanitizes %s", (query, expected) => {
        const {result} = setup(`/list?${query}`, {limit: 10});
        expect(result.current.state).toMatchObject(expected);
    });

    it("switches view immediately, writes it to the URL, and follows later URL changes", () => {
        const {result} = setup("/list?filter=x");

        act(() => result.current.state.setViewMode("table"));
        expect(result.current.state.viewMode).toBe("table");
        expect(result.current.search.get("listView")).toBe("table");
        expect(result.current.search.get("filter")).toBe("x");
        expect(result.current.navigationType).toBe("REPLACE");

        act(() => result.current.navigate("/list?listView=card"));
        expect(result.current.state.viewMode).toBe("card");
    });

    it("writes pages, dropping the param for page 1 and invalid input", () => {
        const {result} = setup("/list", {limit: 25});

        act(() => result.current.state.setPage(3));
        expect(result.current.search.get("listPage")).toBe("3");
        expect(result.current.state).toMatchObject({page: 3, offset: 50});

        act(() => result.current.state.setPage(4.9));
        expect(result.current.search.get("listPage")).toBe("4");

        act(() => result.current.state.setPage(Number.NaN));
        expect(result.current.search.has("listPage")).toBe(false);

        act(() => result.current.state.setPage(5));
        act(() => result.current.state.setPage(1));
        expect(result.current.search.has("listPage")).toBe(false);
    });

    it("converts offsets to pages", () => {
        const {result} = setup("/list", {limit: 20});

        act(() => result.current.state.setOffset(40));
        expect(result.current.state.page).toBe(3);

        act(() => result.current.state.setOffset(-10));
        expect(result.current.search.has("listPage")).toBe(false);
    });

    it("writes sorting from a value or an updater, and resets the page", () => {
        const {result} = setup("/list?listPage=4");

        act(() => result.current.state.setSorting([{id: "name", desc: false}]));
        expect(result.current.search.get("listSort")).toBe("name:asc");
        expect(result.current.search.has("listPage")).toBe(false);

        act(() => result.current.state.setSorting((previous: SortingState) => [{id: previous[0].id, desc: true}]));
        expect(result.current.state.sorting).toEqual([{id: "name", desc: true}]);

        act(() => result.current.state.setSorting([]));
        expect(result.current.search.has("listSort")).toBe(false);
    });

    it("keeps sorting and setters referentially stable across unrelated URL changes", () => {
        const {result} = setup("/list?listSort=name:asc");
        const first = result.current.state;

        act(() => result.current.state.setViewMode("table"));
        act(() => result.current.state.setPage(2));

        expect(result.current.state.sorting).toBe(first.sorting);
        expect(result.current.state.setSorting).toBe(first.setSorting);
        expect(result.current.state.setPage).toBe(first.setPage);
        expect(result.current.state.setViewMode).toBe(first.setViewMode);
    });

    it("returns the same object when nothing changed", () => {
        const {result, rerender} = setup("/list?listView=table");
        const first = result.current.state;

        rerender({limit: 20});
        expect(result.current.state).toBe(first);
    });
});
