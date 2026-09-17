import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {rendersOnEditForm as panelRendersOnEditForm} from "@baseModule/components/viewEngine/form/writeGate.ts";
import {flattenTree} from "../tree/nodeTreeOps.ts";

/**
 * The panel's edit-form write gate, applied to a simulated write allowlist.
 *
 * Maestro marks a field it cannot write as `disabled`; the panel then goes further and does
 * not render it at all. Both halves decide what an account sees — `filterNodesMirror.ts` ports
 * the server's; this one calls the panel's own gate (`viewEngine/form/writeGate.ts`), so the two
 * cannot drift. The preview itself renders through the real `EditFormViewRenderer`; this exists
 * to *count* what that will do, for the simulation banner.
 *
 * The allowlist is the flattened set from `collectAccessPaths`, which has an entry for every
 * level, so set membership matches the panel's nested lookup.
 */
export function rendersOnEditForm(node: ViewNode, write: ReadonlySet<string>): boolean {
    return !node.field || panelRendersOnEditForm(node.field, (key) => write.has(key));
}

/** How many bound fields the panel's gate would remove from this tree. */
export function countHiddenByWriteGate(nodes: ViewNode[], write: ReadonlySet<string>): number {
    return flattenTree(nodes).filter((row) => row.node.field && !rendersOnEditForm(row.node, write))
        .length;
}
