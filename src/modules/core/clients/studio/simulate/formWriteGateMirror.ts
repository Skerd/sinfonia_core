import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {flattenTree} from "../tree/nodeTreeOps.ts";

/**
 * Client-side port of the panel's edit-form write gate.
 *
 * SOURCE OF TRUTH: `components/viewEngine/editFormViewRenderer.tsx` (`renderField`).
 * Maestro marks a field it cannot write as `disabled`; the panel then goes further and does
 * not render it at all. Both halves decide what an account sees, so the Studio mirrors both
 * — `filterNodesMirror.ts` for the server's, this for the panel's. The preview itself renders
 * through the real `EditFormViewRenderer`, so this exists to *count* what that will do, for
 * the simulation banner.
 *
 * Any change to `renderField`'s gate must be mirrored here; `formWriteGateMirror.test.ts`
 * encodes its branches so drift fails a test rather than quietly misreporting.
 */

/** Compound widgets gate on a key of their own rather than on `field.name`. */
const COMPOUND_WRITE_KEYS: Record<string, string> = {
    "#FormFloorPolygon": "polygonCoordinates",
    "#FormEdificePolygon": "polygonCoordinates",
    "#FormUnitPolygon": "polygonCoordinates",
    "#FormExpenditureItemsField": "expenditureItems",
    "#FormEditMediaField": "media",
};

/** `#FormTabbedRepeater` names its own key, falling back to the field name. */
const KEYED_COMPOUND_WIDGET = "#FormTabbedRepeater";

/**
 * Whether the panel would render this field on an edit form, given the write allowlist.
 *
 * Mirrors `renderField`: `_id` and `skipWriteAccessGate` fields always render, a field with
 * `renderWhenWriteAny` renders when **any** listed key is writable, everything else needs its
 * own name. Note the gate only runs when the page passes a `writeAccess` map — every edit
 * page does, via `useAccess`.
 */
export function rendersOnEditForm(node: ViewNode, write: ReadonlySet<string>): boolean {
    const field = node.field;
    if (!field) return true;

    const compoundKey =
        COMPOUND_WRITE_KEYS[field.widget] ??
        (field.widget === KEYED_COMPOUND_WIDGET
            ? ((field.widgetProps?.writeAccessKey as string | undefined) ?? field.name)
            : undefined);
    if (compoundKey) return write.has(compoundKey);

    if (field.name === "_id" || field.skipWriteAccessGate) return true;

    const keys = field.renderWhenWriteAny?.length ? field.renderWhenWriteAny : [field.name];
    return keys.some((key) => write.has(key));
}

/** How many bound fields the panel's gate would remove from this tree. */
export function countHiddenByWriteGate(nodes: ViewNode[], write: ReadonlySet<string>): number {
    return flattenTree(nodes).filter((row) => row.node.field && !rendersOnEditForm(row.node, write))
        .length;
}
