import {describe, expect, it} from "vitest";
import type {
    TableColumnConfig,
} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import {
    clearColumnMetaKey,
    columnDeadEntries,
    columnRelevanceFor,
} from "./columnRelevance.ts";

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

describe("columnRelevanceFor", () => {
    it("keeps the universal switches primary for every cell type", () => {
        for (const cellType of Object.values(COLUMN_TYPE)) {
            const col = column({cellType});
            for (const key of ["visible", "sortable", "filterable", "cellType"] as const) {
                expect(columnRelevanceFor(key, col).state).toBe("primary");
            }
        }
    });

    it("offers refDisplayKey on objectId and address only", () => {
        expect(columnRelevanceFor("meta.refDisplayKey", column({cellType: COLUMN_TYPE.OBJECT_ID})).state)
            .toBe("primary");
        expect(columnRelevanceFor("meta.refDisplayKey", column({cellType: COLUMN_TYPE.ADDRESS})).state)
            .toBe("primary");
        expect(columnRelevanceFor("meta.refDisplayKey", column({cellType: COLUMN_TYPE.STRING})).state)
            .toBe("inapplicable");
    });

    it("offers maxInlineItems and hrefTemplate on objectId only", () => {
        for (const key of ["meta.maxInlineItems", "meta.hrefTemplate"] as const) {
            expect(columnRelevanceFor(key, column({cellType: COLUMN_TYPE.OBJECT_ID})).state)
                .toBe("advanced");
            /* The enum branch hardcodes its own inline limit — it never reads maxInlineItems. */
            expect(columnRelevanceFor(key, column({cellType: COLUMN_TYPE.ENUM})).state)
                .toBe("inapplicable");
            expect(columnRelevanceFor(key, column({cellType: COLUMN_TYPE.ARRAY})).state)
                .toBe("inapplicable");
        }
    });

    it("keeps className available everywhere, since every column applies it", () => {
        for (const cellType of Object.values(COLUMN_TYPE)) {
            expect(columnRelevanceFor("meta.className", column({cellType})).state).toBe("advanced");
        }
    });
});

describe("columnDeadEntries", () => {
    it("reports objectId-only meta set on a string column", () => {
        const col = column({
            cellType: COLUMN_TYPE.STRING,
            meta: {hrefTemplate: "/x/{_id}", maxInlineItems: 3},
        });
        expect(columnDeadEntries(col).map((e) => e.key).sort()).toEqual([
            "meta.hrefTemplate",
            "meta.maxInlineItems",
        ]);
    });

    it("stays quiet when the same meta is on an objectId column", () => {
        const col = column({
            cellType: COLUMN_TYPE.OBJECT_ID,
            meta: {hrefTemplate: "/x/{_id}", maxInlineItems: 3, refDisplayKey: ["name"]},
        });
        expect(columnDeadEntries(col)).toEqual([]);
    });

    it("reports contract keys that no client code reads, whatever the cell type", () => {
        const col = column({
            cellType: COLUMN_TYPE.DATE,
            meta: {dateFormat: "date", timezonePath: "tz"},
        });
        const keys = columnDeadEntries(col).map((e) => e.key).sort();
        expect(keys).toEqual(["meta.dateFormat", "meta.timezonePath"]);
    });

    it("stays quiet for a clean column", () => {
        expect(columnDeadEntries(column())).toEqual([]);
        expect(columnDeadEntries(column({meta: {className: "w-20"}}))).toEqual([]);
    });
});

describe("clearColumnMetaKey", () => {
    it("drops meta entirely once its last key goes", () => {
        const col = column({meta: {hrefTemplate: "/x/{_id}"}});
        expect(clearColumnMetaKey(col, "meta.hrefTemplate").meta).toBeUndefined();
    });

    it("keeps siblings", () => {
        const col = column({meta: {hrefTemplate: "/x/{_id}", className: "w-20"}});
        expect(clearColumnMetaKey(col, "meta.hrefTemplate").meta).toEqual({className: "w-20"});
    });

    it("clears every reported entry in one sweep", () => {
        let col = column({
            cellType: COLUMN_TYPE.STRING,
            meta: {hrefTemplate: "/x/{_id}", badgeMapping: {a: "b"}, className: "w-20"},
        });
        for (const entry of columnDeadEntries(col)) {
            col = clearColumnMetaKey(col, entry.key);
        }
        expect(columnDeadEntries(col)).toEqual([]);
        expect(col.meta).toEqual({className: "w-20"});
    });
});
