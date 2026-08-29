import {useCallback, useMemo, useState} from "react";

/**
 * A set of ids kept in `localStorage`, for the catalog's collapse state.
 *
 * Stored as the *exceptions* to the default in each case — collapsed module groups, expanded
 * models — so a fresh Studio and a cleared storage behave identically, and the entry stays a
 * handful of names rather than a snapshot of all ~130 models.
 *
 * Written on every change, which here is a click; the `useSplitter` rule about not writing
 * storage per event is about pointer moves, and there are none.
 */

function readStored(storageKey: string): ReadonlySet<string> {
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return new Set();
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return new Set();
        return new Set(parsed.filter((id): id is string => typeof id === "string"));
    } catch {
        return new Set();
    }
}

function writeStored(storageKey: string, ids: ReadonlySet<string>): void {
    try {
        localStorage.setItem(storageKey, JSON.stringify([...ids]));
    } catch {
        /* Private-mode or a full quota: the Studio keeps working, just without memory. */
    }
}

export type PersistedIdSet = {
    has: (id: string) => boolean;
    toggle: (id: string) => void;
    add: (id: string) => void;
};

export function usePersistedIdSet(storageKey: string): PersistedIdSet {
    const [ids, setIds] = useState<ReadonlySet<string>>(() => readStored(storageKey));

    const update = useCallback(
        (mutate: (next: Set<string>) => boolean) => {
            setIds((current) => {
                const next = new Set(current);
                /* `false` means the click changed nothing — no re-render, no storage write. */
                if (!mutate(next)) return current;
                writeStored(storageKey, next);
                return next;
            });
        },
        [storageKey],
    );

    const has = useCallback((id: string) => ids.has(id), [ids]);

    const toggle = useCallback(
        (id: string) =>
            update((next) => {
                if (!next.delete(id)) next.add(id);
                return true;
            }),
        [update],
    );

    const add = useCallback(
        (id: string) =>
            update((next) => {
                if (next.has(id)) return false;
                next.add(id);
                return true;
            }),
        [update],
    );

    return useMemo(() => ({has, toggle, add}), [has, toggle, add]);
}
