import {createContext, useContext} from "react";

/**
 * What a list page (`EntityListPage`) lets the cards and sheets it renders do to its rows: a card or sheet that changes
 * its entity on its own (e.g. a request decision, D160) patches the list's row, so a later action on that row (delete)
 * does not bring back the old values.
 */
export type EntityListRowContextValue = {
    patchRow: (id: string, patch: Record<string, unknown>) => void;
};

export const EntityListRowContext = createContext<EntityListRowContextValue | null>(null);

/** The surrounding list page's row patcher, or `null` outside a list page (a sheet opened from elsewhere). */
export function useEntityListRow(): EntityListRowContextValue | null {
    return useContext(EntityListRowContext);
}
