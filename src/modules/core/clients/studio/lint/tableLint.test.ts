import {describe, expect, it} from "vitest";
import type {
    TableColumnConfig,
} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import {lintTableColumns} from "./tableLint.ts";

function column(overrides: Partial<TableColumnConfig> = {}): TableColumnConfig {
    return {
        id: "name",
        accessorPath: "name",
        labelKey: "name",
        cellType: COLUMN_TYPE.STRING,
        sortable: true,
        visible: true,
        filterConfig: {type: COLUMN_TYPE.STRING, operators: ["equals"]},
        ...overrides,
    };
}

function rules(findings: {rule: string}[]): string[] {
    return [...new Set(findings.map((f) => f.rule))].sort();
}

describe("lintTableColumns", () => {
    it("says nothing about a well-formed column", () => {
        expect(lintTableColumns([column()], {readPaths: ["name"]})).toEqual([]);
    });

    it("promotes dead meta to an error", () => {
        const findings = lintTableColumns(
            [column({meta: {hrefTemplate: "/x/{_id}"}})],
            {readPaths: ["name"]},
        );
        const hit = findings.find((f) => f.rule === "column-meta-dead");
        expect(hit?.severity).toBe("error");
        expect(hit?.message).toMatch(/hrefTemplate/);
    });

    it("flags a column with no derived filter", () => {
        const findings = lintTableColumns(
            [column({filterConfig: undefined})],
            {readPaths: ["name"]},
        );
        expect(rules(findings)).toContain("column-not-filterable");
    });

    it("flags a cellType that disagrees with the derived filter type", () => {
        const findings = lintTableColumns(
            [column({cellType: COLUMN_TYPE.NUMBER})],
            {readPaths: ["name"]},
        );
        const hit = findings.find((f) => f.rule === "celltype-filter-mismatch");
        expect(hit?.message).toMatch(/number/);
        expect(hit?.message).toMatch(/string/);
    });

    it("flags an objectId column with no refDisplayKey", () => {
        const findings = lintTableColumns(
            [
                column({
                    id: "country",
                    cellType: COLUMN_TYPE.OBJECT_ID,
                    filterConfig: {type: COLUMN_TYPE.OBJECT_ID, operators: []},
                }),
            ],
            {readPaths: ["country"]},
        );
        expect(rules(findings)).toContain("objectid-without-refdisplaykey");
    });

    it("accepts an objectId column that sets refDisplayKey", () => {
        const findings = lintTableColumns(
            [
                column({
                    id: "country",
                    cellType: COLUMN_TYPE.OBJECT_ID,
                    filterConfig: {type: COLUMN_TYPE.OBJECT_ID, operators: []},
                    meta: {refDisplayKey: ["name"]},
                }),
            ],
            {readPaths: ["country"]},
        );
        expect(rules(findings)).not.toContain("objectid-without-refdisplaykey");
    });

    it("flags a column that is neither visible nor filterable", () => {
        const findings = lintTableColumns(
            [column({visible: false, filterConfig: undefined})],
            {readPaths: ["name"]},
        );
        expect(rules(findings)).toContain("column-unreachable");
    });

    it("flags a column whose path is outside the read allowlist", () => {
        const findings = lintTableColumns([column({id: "secret"})], {readPaths: ["name"]});
        expect(rules(findings)).toContain("column-path-not-readable");
    });

    it("exempts a column that reads through dtoPath", () => {
        const findings = lintTableColumns(
            [column({id: "secret", dtoPath: "nested.secret"})],
            {readPaths: ["name"]},
        );
        expect(rules(findings)).not.toContain("column-path-not-readable");
    });

    it("stays silent about allowlists when none is loaded", () => {
        const findings = lintTableColumns([column({id: "secret"})], {readPaths: []});
        expect(rules(findings)).not.toContain("column-path-not-readable");
    });

    it("sorts errors before warnings", () => {
        const findings = lintTableColumns(
            [
                column({id: "a", filterConfig: undefined}),
                column({id: "b", meta: {badgeMapping: {x: "y"}}}),
            ],
            {readPaths: ["a", "b"]},
        );
        expect(findings[0]!.severity).toBe("error");
    });

    it("labels findings by column id so the panel can select one", () => {
        const findings = lintTableColumns([column({id: "price", filterConfig: undefined})], {
            readPaths: ["price"],
        });
        expect(findings[0]!.path).toBe("price");
        expect(findings[0]!.label).toBe("price");
    });
});
