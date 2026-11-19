import type {FilterFieldConfig, FilterGroup, FilterRule} from "armonia/src/modules/core/database/filter";
import {COLUMN_TYPE, isNumberColumnType, isStringColumnType} from "armonia/src/modules/core/database/filter/typeOperators.ts";
import {generateUUID} from "@coreModule/helpers/general/uuid.ts";

/**
 * The list search box (D170): typed text becomes filter rules over the list's own filter fields, so it runs through the
 * same filter route, permissions and URL state as the advanced filters, with no second query language (BE-03).
 *
 * Every word must appear in at least one field: one `or` group per word, all of them AND-ed. Per field:
 * - text and text lists: `contains` the word;
 * - a reference: `contains` the word, which the API matches against the linked record's name;
 * - a choice: `in` the values whose translated label (or stored value) holds the word;
 * - a number: `equals` it when the word is a number.
 * Dates, yes/no fields and files are not searched. A field gets a rule only when it offers that operator.
 */

/** Words past this are ignored; the API ignores them on a reference too. */
const MAX_SEARCH_WORDS = 5;

/** A choice value's label as the list shows it (`fields.!enums.<path>.<value>`). */
export type EnumLabelOf = (path: string, value: string) => string;

export function searchWords(text: string): string[] {
    return text.trim().split(/\s+/).filter(Boolean).slice(0, MAX_SEARCH_WORDS);
}

const offers = (field: FilterFieldConfig, operator: FilterRule["operator"]) => field.operators?.includes(operator) === true;

/** A field the box can match typed text against: without one, the list shows no search box. */
function takesText(field: FilterFieldConfig): boolean {
    return (isStringColumnType(field.type) || field.type === COLUMN_TYPE.OBJECT_ID) && offers(field, "contains");
}

export function canSearchList(fields: readonly FilterFieldConfig[]): boolean {
    return fields.some(takesText);
}

function rule(field: string, operator: FilterRule["operator"], value: FilterRule["value"]): FilterRule {
    return {id: generateUUID(), field, operator, value};
}

function rulesForWord(word: string, fields: readonly FilterFieldConfig[], enumLabelOf: EnumLabelOf): FilterRule[] {
    const needle = word.toLocaleLowerCase();
    const number = Number(word);
    const rules: FilterRule[] = [];
    for (const field of fields) {
        if (takesText(field)) {
            rules.push(rule(field.path, "contains", word));
        } else if (field.type === COLUMN_TYPE.ENUM && offers(field, "in")) {
            const values = (field.enumValues ?? []).filter((value) =>
                value.toLocaleLowerCase().includes(needle) || enumLabelOf(field.path, value).toLocaleLowerCase().includes(needle));
            if (values.length > 0) rules.push(rule(field.path, "in", values));
        } else if (isNumberColumnType(field.type) && offers(field, "equals") && Number.isFinite(number)) {
            rules.push(rule(field.path, "equals", number));
        }
    }
    return rules;
}

/** The DSL for `text` over `fields`, or undefined when nothing is typed or nothing can be searched. */
export function buildListSearchDSL(text: string, fields: readonly FilterFieldConfig[], enumLabelOf: EnumLabelOf): FilterGroup | undefined {
    if (!canSearchList(fields)) return undefined;
    const groups = searchWords(text).map((word): FilterGroup => ({
        id: generateUUID(),
        operator: "or",
        rules: rulesForWord(word, fields, enumLabelOf),
        groups: [],
    }));
    if (groups.length === 0) return undefined;
    return {id: generateUUID(), operator: "and", rules: [], groups};
}
