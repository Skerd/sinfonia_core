import {useCallback, useMemo, useRef, useState} from "react";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";

type SoftDeletable = {
    deletedAt?: Date;
    deletedBy?: unknown;
};

type UseEntityCardOptions<T extends SoftDeletable> = {
    entityProp: T;
    // NoInfer prevents onDeleteProp from being used as an inference site for T,
    // so T is always driven solely by entityProp.
    onDeleteProp?: (entity: NoInfer<T>, data: DeletedData) => void;
    onRestoreProp?: () => void;
    // Set to false when an external fetch (e.g. withAxios) owns the entity state,
    // so incoming prop changes don't overwrite freshly-fetched data.
    syncPropOnChange?: boolean;
};

/** Actions whose confirm dialog closes itself on success; the card clears them so they can open again. */
const CONFIRM_ACTIONS = new Set(["delete", "restore"]);

const clearConfirmAction = (current: string) => (CONFIRM_ACTIONS.has(current) ? "" : current);

/**
 * Local state for `EntityCard`: the open action (`"view"`, `"delete"`, …), the displayed entity,
 * and soft/hard delete + restore handling.
 *
 * - A new `entityProp` replaces the local entity in the same render (while `syncPropOnChange`).
 * - `onDelete`: a response without `deletedAt`/`deletedBy` is a hard delete and hides the card;
 *   otherwise `onDeleteProp` handles it, or the deletion fields are merged into the entity.
 * - `onRestore`: `onRestoreProp` handles it, or the deletion fields are cleared.
 * - Both close a finished delete/restore confirmation, but leave an open view sheet alone.
 * - Updates apply to the latest entity, `onDelete`/`onRestore` are stable, and the result is memoized.
 */
export function useEntityCard<T extends SoftDeletable>({
    entityProp,
    onDeleteProp,
    onRestoreProp,
    syncPropOnChange = true,
}: UseEntityCardOptions<T>) {
    const [action, setAction] = useState("");
    const [entity, setEntity] = useState<T>(entityProp);
    const [hideAfterDeletion, setHideAfterDeletion] = useState(false);

    /* Adopt prop changes during render, so no frame renders the previous entity. Re-enabling sync adopts the current prop. */
    const [synced, setSynced] = useState({prop: entityProp, sync: syncPropOnChange});
    if (synced.prop !== entityProp || synced.sync !== syncPropOnChange) {
        setSynced({prop: entityProp, sync: syncPropOnChange});
        if (syncPropOnChange) setEntity(entityProp);
    }

    const entityRef = useRef(entity);
    entityRef.current = entity;
    const onDeletePropRef = useRef(onDeleteProp);
    onDeletePropRef.current = onDeleteProp;
    const onRestorePropRef = useRef(onRestoreProp);
    onRestorePropRef.current = onRestoreProp;

    const onDelete = useCallback((data: DeletedData) => {
        setAction(clearConfirmAction);
        if (!data.deletedBy && !data.deletedAt) {
            setHideAfterDeletion(true);
            return;
        }
        const handler = onDeletePropRef.current;
        if (handler) handler(entityRef.current, data);
        else setEntity((previous) => ({...previous, ...data}));
    }, []);

    const onRestore = useCallback(() => {
        setAction(clearConfirmAction);
        const handler = onRestorePropRef.current;
        if (handler) handler();
        else setEntity((previous) => ({...previous, deletedAt: undefined, deletedBy: undefined}));
    }, []);

    return useMemo(
        () => ({action, setAction, entity, setEntity, hideAfterDeletion, onDelete, onRestore}),
        [action, entity, hideAfterDeletion, onDelete, onRestore],
    );
}
