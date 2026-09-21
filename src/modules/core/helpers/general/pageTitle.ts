import type {PageTitle} from "@coreModule/helpers/types/pageTitle.types.ts";

/**
 * A page heading plus the entity context that scoped it — e.g. the units list
 * filtered to one floor is `{title: "Units", context: ["Aria", "Block B", "3"]}`.
 *
 * Kept structured rather than pre-joined into `"Units: Aria / Block B / 3"`,
 * because the shell renders the context as breadcrumb links: a joined string
 * can only be printed, and the user cannot click back up the hierarchy they
 * navigated down.
 *
 * @param items - Context segments, outermost first; empty entries are omitted.
 */
export function buildPageTitle(title: string, items: (string | undefined | null)[] = []): PageTitle {
    return {title, context: items.filter((item): item is string => Boolean(item))};
}
