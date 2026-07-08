import {useEffect, useState} from "react";
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

export function useEntityCard<T extends SoftDeletable>({
    entityProp,
    onDeleteProp,
    onRestoreProp,
    syncPropOnChange = true,
}: UseEntityCardOptions<T>) {
    const [action, setAction] = useState("");
    const [entity, setEntity] = useState<T>(entityProp);
    const [hideAfterDeletion, setHideAfterDeletion] = useState(false);

    useEffect(() => {
        if (syncPropOnChange) setEntity(entityProp);
    }, [entityProp, syncPropOnChange]);

    const onDelete = (data: DeletedData) => {
        if (!data.deletedBy && !data.deletedAt) {
            setHideAfterDeletion(true);
        } else if (onDeleteProp) {
            onDeleteProp(entity, data);
        } else {
            setEntity({...entity, ...data});
        }
    };

    const onRestore = () => {
        if (onRestoreProp) {
            onRestoreProp();
        } else {
            setEntity({...entity, deletedAt: undefined, deletedBy: undefined});
        }
    };

    return {action, setAction, entity, setEntity, hideAfterDeletion, onDelete, onRestore};
}
