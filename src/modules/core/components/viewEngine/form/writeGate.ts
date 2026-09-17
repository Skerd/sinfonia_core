import type {FieldBinding} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {getFormWriteAccessKey} from "../widgetRegistry.ts";

/** Whether the account may write a key (dotted paths allowed). */
export type CanWrite = (key: string) => boolean;

/** Repeater whose `widgetProps.writeAccessKey` names its key, falling back to the field name. */
const KEYED_REPEATER = "#FormTabbedRepeater";

/** The key a compound widget gates on instead of its field name, if any. */
function ownWriteKey(binding: FieldBinding): string | undefined {
    if (binding.widget === KEYED_REPEATER) {
        return (binding.widgetProps?.writeAccessKey as string | undefined) ?? binding.name;
    }
    return getFormWriteAccessKey(binding.widget);
}

/**
 * Whether an edit form renders a field, given what the account may write. Maestro marks an
 * unwritable field `disabled`; the panel goes further and leaves it out.
 *
 * - Widgets with their own key (`#FormFloorPolygon` → `polygonCoordinates`) gate on that key.
 * - `_id` and `skipWriteAccessGate` fields always render.
 * - `renderWhenWriteAny` renders when any listed key is writable.
 * - Everything else needs its own name.
 *
 * The Studio's access simulator calls this too (`studio/simulate/formWriteGateMirror.ts`).
 */
export function rendersOnEditForm(binding: FieldBinding, canWrite: CanWrite): boolean {
    const ownKey = ownWriteKey(binding);
    if (ownKey) return canWrite(ownKey);
    if (binding.name === "_id" || binding.skipWriteAccessGate) return true;
    const keys = binding.renderWhenWriteAny?.length ? binding.renderWhenWriteAny : [binding.name];
    return keys.some(canWrite);
}
