import {useCallback, useEffect, useState} from "react";
import {resolvePath, setAtPath} from "../../engine/refs.ts";

type Row = Record<string, any>;

/**
 * The row a sheet shows. Starts from the list row, is replaced by the `/single` response, and
 * is patched locally when a linked entity is deleted from a nested sheet (`onRowPatched` lets
 * the host list mirror that, since this state dies with the sheet).
 */
export function useSheetRow(rowProp: Row | undefined, onRowPatched?: (row: Row) => void) {
    const [row, setRow] = useState<Row>(rowProp || {});

    useEffect(() => {
        if (!rowProp) return;
        setRow((prev) => {
            const next: Row = {...rowProp};
            // Keep keys only the single fetch provides (e.g. `inventory.movements`) when the list row re-asserts.
            for (const [key, value] of Object.entries(prev || {})) {
                if (!(key in rowProp) || rowProp[key] === undefined) {
                    next[key] = value;
                }
            }
            return next;
        });
    }, [rowProp]);

    const patch = useCallback(
        (update: (prev: Row) => Row) => {
            setRow((prev) => {
                const next = update(prev);
                if (next !== prev) queueMicrotask(() => onRowPatched?.(next));
                return next;
            });
        },
        [onRowPatched],
    );

    /** Clears an embedded ref (`project`) after its entity was deleted. */
    const unlinkRefPath = useCallback((dotPath: string) => patch((prev) => setAtPath(prev, dotPath, null)), [patch]);

    /** Removes one entry of an embedded ref list (`constructors`) after its entity was deleted. */
    const unlinkListItem = useCallback(
        (listPath: string, index: number) =>
            patch((prev) => {
                const list = resolvePath(prev, listPath);
                if (!Array.isArray(list) || index < 0 || index >= list.length) return prev;
                return setAtPath(prev, listPath, list.filter((_, i) => i !== index));
            }),
        [patch],
    );

    return {row, setRow, unlinkRefPath, unlinkListItem};
}
