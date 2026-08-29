/**
 * What the Studio is currently editing.
 *
 * `viewKey` is either a real `ViewConfig` key (`"sheet"`, `"form:create"`, `"form:edit"`)
 * or {@link TABLE_TARGET}. Table columns are not a `ViewConfig` — they are derived from
 * the Mongoose schema — so they get a sentinel rather than being smuggled into the view
 * namespace where `useViewConfig` would try to resolve them.
 */

export const TABLE_TARGET = "__table";

/**
 * Namespace the table editor writes its live preview under inside `TableConfigContext`.
 *
 * Writing the draft to the real collection key would overwrite the served columns — the
 * only copy of them the client has — leaving the export diffing the draft against itself.
 * It also keeps `CardAndTableView`'s view-mode and column-visibility `localStorage` writes
 * out of the panel's saved preferences.
 */
export const STUDIO_PREVIEW_KEY_PREFIX = "__studio:";

export function studioTableConfigKey(collection: string): string {
    return `${STUDIO_PREVIEW_KEY_PREFIX}${collection}`;
}

export type StudioTarget = {
    collection: string;
    viewKey: string;
};

/** `"<collection>:<viewKey>"` — the key every per-target store is keyed by. */
export function studioTargetKey(target: StudioTarget): string {
    return `${target.collection.toLowerCase()}:${target.viewKey}`;
}

export function isTableTarget(target: StudioTarget | null): boolean {
    return target?.viewKey === TABLE_TARGET;
}

export function targetsEqual(a: StudioTarget | null, b: StudioTarget | null): boolean {
    return a?.collection === b?.collection && a?.viewKey === b?.viewKey;
}
