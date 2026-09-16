import type { FilterGroup } from "armonia/src/modules/core/database/filter";
import {generateUUID} from "@baseModule/helpers/general/uuid.ts";

/** True when a group (recursively) carries no rules. Tolerates missing `rules` / `groups` from untrusted input. */
export function isFilterGroupEmpty(root: FilterGroup | undefined): boolean {
    if (!root) return true;
    return !root.rules?.length && (root.groups ?? []).every(isFilterGroupEmpty);
}

/** The children an AND-merge can take over: an `and` group's contents are inlined, anything else is nested whole. */
function andParts(group: FilterGroup): Pick<FilterGroup, "rules" | "groups"> {
    return group.operator === "and"
        ? { rules: group.rules ?? [], groups: group.groups ?? [] }
        : { rules: [], groups: [group] };
}

/**
 * AND-merge two DSL roots without dropping either side when both carry conditions.
 * `and` roots are flattened into the result instead of wrapped, so repeated merges
 * don't add a nesting level each time (the API rejects filters deeper than 5 levels).
 * Inputs are never mutated; `prepend`'s conditions come first.
 */
export function mergeAndFilterDSL(
    existing: FilterGroup | undefined,
    prepend: FilterGroup | undefined,
): FilterGroup | undefined {
    if (!prepend || isFilterGroupEmpty(prepend)) return existing;
    if (!existing || isFilterGroupEmpty(existing)) return prepend;

    const head = andParts(prepend);
    const tail = andParts(existing);
    return {
        id: generateUUID(),
        operator: "and",
        rules: [...head.rules, ...tail.rules],
        groups: [...head.groups, ...tail.groups],
    };
}
