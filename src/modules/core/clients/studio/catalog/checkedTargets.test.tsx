import {act, renderHook} from "@testing-library/react";
import {beforeEach, describe, expect, it} from "vitest";
import type {TableColumnConfig} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type";
import {checkedProgress, modelTargets, useCheckedTargets} from "./checkedTargets.ts";
import type {StudioModelEntry} from "./useStudioCatalog.ts";
import {TABLE_TARGET} from "../studioTarget.ts";

function entry(overrides: Partial<StudioModelEntry> = {}): StudioModelEntry {
    return {
        collection: "countries",
        module: "core",
        viewKeys: ["sheet", "form:create", "form:edit"],
        views: {},
        columns: [{id: "name"} as TableColumnConfig],
        readPaths: [],
        writePaths: [],
        canCreate: true,
        canDelete: true,
        ...overrides,
    };
}

describe("modelTargets", () => {
    it("lists the views plus the table", () => {
        expect(modelTargets(entry())).toEqual(["sheet", "form:create", "form:edit", TABLE_TARGET]);
    });

    it("omits the table when the schema opts no columns in", () => {
        expect(modelTargets(entry({columns: []}))).toEqual(["sheet", "form:create", "form:edit"]);
    });

    it("is just the table for a model with no views", () => {
        expect(modelTargets(entry({viewKeys: []}))).toEqual([TABLE_TARGET]);
    });
});

describe("checkedProgress", () => {
    const isChecked = (done: string[]) => (target: {collection: string; viewKey: string}) =>
        done.includes(target.viewKey);

    it("counts what is marked against what exists", () => {
        expect(checkedProgress(entry(), isChecked(["sheet", TABLE_TARGET]))).toEqual({
            checked: 2,
            total: 4,
            complete: false,
        });
    });

    it("is complete only when every target is marked", () => {
        const all = ["sheet", "form:create", "form:edit", TABLE_TARGET];
        expect(checkedProgress(entry(), isChecked(all)).complete).toBe(true);
    });

    it("is not complete when a model has no targets at all", () => {
        expect(checkedProgress(entry({viewKeys: [], columns: []}), isChecked([]))).toEqual({
            checked: 0,
            total: 0,
            complete: false,
        });
    });
});

describe("useCheckedTargets", () => {
    beforeEach(() => localStorage.clear());

    it("marks one target without touching its siblings, and survives a reload", () => {
        const sheet = {collection: "countries", viewKey: "sheet"};
        const table = {collection: "countries", viewKey: TABLE_TARGET};

        const {result} = renderHook(() => useCheckedTargets());
        act(() => result.current.toggle(sheet));

        expect(result.current.isChecked(sheet)).toBe(true);
        expect(result.current.isChecked(table)).toBe(false);

        expect(renderHook(() => useCheckedTargets()).result.current.isChecked(sheet)).toBe(true);
    });

    it("keeps models apart", () => {
        const {result} = renderHook(() => useCheckedTargets());
        act(() => result.current.toggle({collection: "countries", viewKey: "sheet"}));

        expect(result.current.isChecked({collection: "cities", viewKey: "sheet"})).toBe(false);
    });

    it("toggles back off", () => {
        const target = {collection: "countries", viewKey: "form:edit"};
        const {result} = renderHook(() => useCheckedTargets());

        act(() => result.current.toggle(target));
        act(() => result.current.toggle(target));

        expect(result.current.isChecked(target)).toBe(false);
    });
});
