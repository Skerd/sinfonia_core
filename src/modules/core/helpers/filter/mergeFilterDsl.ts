import type { FilterGroup } from "armonia/src/modules/core/database/filter";
import { generateUUID } from "@coreModule/helpers/general";

export function isFilterGroupEmpty(root: FilterGroup | undefined): boolean {
    if (!root) return true;
    return root.rules.length === 0 && (root.groups ?? []).every(isFilterGroupEmpty);
}

/** AND-merge two DSL roots without dropping either side when both carry conditions. */
export function mergeAndFilterDSL(
    existing: FilterGroup | undefined,
    prepend: FilterGroup | undefined,
): FilterGroup | undefined {
    if (!prepend || isFilterGroupEmpty(prepend)) {
        return existing;
    }
    if (!existing || isFilterGroupEmpty(existing)) {
        return prepend;
    }
    return {
        id: generateUUID(),
        operator: "and",
        rules: [],
        groups: [prepend, existing],
    };
}
