/**
 * Public helper surface of the view engine (module contributions import it).
 * Implementations live under `engine/`.
 */
export type {ViewRendererContext} from "./engine/types.ts";
export {
    filterAccessibleValuePath,
    hasAccessPath,
    hasAnyAccessPath,
    hasDisplayCardValueAccess,
    resolveDisplayCardValueAccessSpec,
    type DisplayCardAccessSpec,
} from "./engine/access.ts";
export {bootstrapLinkedSheetData, normalizeObjectIdRef, resolvePath, setAtPath} from "./engine/refs.ts";
export {sheetFieldVisible} from "./engine/nodeGates.ts";
