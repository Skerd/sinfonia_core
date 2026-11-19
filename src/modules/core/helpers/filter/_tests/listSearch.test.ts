import {describe, expect, it} from "vitest";
import type {FilterFieldConfig, FilterGroup, FilterRule} from "armonia/src/modules/core/database/filter";
import {
    COLUMN_TYPE,
    DATE_OPERATORS,
    ENUM_OPERATORS,
    NUMBER_OPERATORS,
    OBJECT_ID_OPERATORS,
    STRING_OPERATORS,
} from "armonia/src/modules/core/database/filter/typeOperators.ts";
import {buildListSearchDSL, canSearchList, searchWords} from "@coreModule/helpers/filter/listSearch.ts";

const fields: FilterFieldConfig[] = [
    {path: "name", type: COLUMN_TYPE.STRING, operators: STRING_OPERATORS},
    {path: "country", type: COLUMN_TYPE.OBJECT_ID, ref: "Country", operators: OBJECT_ID_OPERATORS},
    // A reference without a snippet offers no name search.
    {path: "createdBy", type: COLUMN_TYPE.OBJECT_ID, operators: OBJECT_ID_OPERATORS.filter((op) => op !== "contains")},
    {path: "status", type: COLUMN_TYPE.ENUM, enumValues: ["confirmed", "cancelled"], operators: ENUM_OPERATORS},
    {path: "price", type: COLUMN_TYPE.NUMBER, operators: NUMBER_OPERATORS},
    {path: "startsAt", type: COLUMN_TYPE.DATE, operators: DATE_OPERATORS},
];
const labels: Record<string, string> = {confirmed: "Bestätigt", cancelled: "Storniert"};
const enumLabelOf = (_path: string, value: string) => labels[value] ?? value;

/** A word group's rules without their generated ids. */
const shape = (dsl: FilterGroup | undefined) =>
    dsl?.groups.map((group) => ({operator: group.operator, rules: group.rules.map(({field, operator, value}: FilterRule) => ({field, operator, value}))}));

describe("list search (D170)", () => {
    it("makes one OR group per word, AND-ed, over the fields that take text", () => {
        const dsl = buildListSearchDSL("  tirana  alb ", fields, enumLabelOf);
        expect(dsl?.operator).toBe("and");
        expect(dsl?.rules).toEqual([]);
        expect(shape(dsl)).toEqual([
            {operator: "or", rules: [{field: "name", operator: "contains", value: "tirana"}, {field: "country", operator: "contains", value: "tirana"}]},
            {operator: "or", rules: [{field: "name", operator: "contains", value: "alb"}, {field: "country", operator: "contains", value: "alb"}]},
        ]);
    });

    it("matches a choice by its translated label or its value", () => {
        expect(shape(buildListSearchDSL("bestä", fields, enumLabelOf))?.[0].rules).toContainEqual({field: "status", operator: "in", value: ["confirmed"]});
        expect(shape(buildListSearchDSL("cancel", fields, enumLabelOf))?.[0].rules).toContainEqual({field: "status", operator: "in", value: ["cancelled"]});
    });

    it("matches a number field only on a number, and never searches dates", () => {
        const word = shape(buildListSearchDSL("120", fields, enumLabelOf))?.[0].rules;
        expect(word).toContainEqual({field: "price", operator: "equals", value: 120});
        expect(word?.some((rule) => rule.field === "startsAt" || rule.field === "createdBy")).toBe(false);
        expect(shape(buildListSearchDSL("rome", fields, enumLabelOf))?.[0].rules.some((rule) => rule.field === "price")).toBe(false);
    });

    it("builds nothing for empty text or a list with no text fields", () => {
        expect(buildListSearchDSL("   ", fields, enumLabelOf)).toBeUndefined();
        const noText = fields.filter((field) => field.type !== COLUMN_TYPE.STRING && field.path !== "country");
        expect(canSearchList(noText)).toBe(false);
        expect(buildListSearchDSL("rome", noText, enumLabelOf)).toBeUndefined();
    });

    it("keeps at most five words", () => {
        expect(searchWords("a b c d e f g")).toEqual(["a", "b", "c", "d", "e"]);
    });
});
