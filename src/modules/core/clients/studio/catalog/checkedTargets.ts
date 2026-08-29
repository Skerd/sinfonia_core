import {TABLE_TARGET, studioTargetKey, type StudioTarget} from "../studioTarget.ts";
import type {StudioModelEntry} from "./useStudioCatalog.ts";
import {usePersistedIdSet, type PersistedIdSet} from "./usePersistedIdSet.ts";

/**
 * A per-target review mark: "this one is how I want it".
 *
 * The Studio already says what a config *is* (drafted, linted, exported) but nothing about
 * where the person editing it has got to. Across ~130 models and up to four targets each,
 * that is the thing you lose track of first — not what a view does, but which ones you have
 * already been through.
 *
 * Local to the browser, like the drafts and the pane sizes: it records one person's pass over
 * the catalog, not a shared state anyone else reads.
 */

const STORAGE_KEY = "studio:catalog:checkedTargets:v1";

export type CheckedTargets = {
    isChecked: (target: StudioTarget) => boolean;
    toggle: (target: StudioTarget) => void;
};

/** Wraps the id set in the target vocabulary, so no caller builds the key itself. */
export function useCheckedTargets(): CheckedTargets {
    const set: PersistedIdSet = usePersistedIdSet(STORAGE_KEY);
    return {
        isChecked: (target) => set.has(studioTargetKey(target)),
        toggle: (target) => set.toggle(studioTargetKey(target)),
    };
}

/**
 * Every target a model offers, in the order the catalog lists them. A model with no
 * `*.views.ts` still has a table, and one whose schema opts no columns in has none.
 */
export function modelTargets(entry: StudioModelEntry): string[] {
    return [...entry.viewKeys, ...(entry.columns.length > 0 ? [TABLE_TARGET] : [])];
}

export type CheckedProgress = {checked: number; total: number; complete: boolean};

/** How far through a model the reviewer is, for the collapsed row's badge. */
export function checkedProgress(
    entry: StudioModelEntry,
    isChecked: (target: StudioTarget) => boolean,
): CheckedProgress {
    const targets = modelTargets(entry);
    const checked = targets.filter((viewKey) =>
        isChecked({collection: entry.collection, viewKey}),
    ).length;
    return {checked, total: targets.length, complete: targets.length > 0 && checked === targets.length};
}
