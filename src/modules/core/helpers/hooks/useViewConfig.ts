import { useViewConfigContext } from "@coreModule/helpers/context/viewConfigContext.tsx";
import type { ViewConfig } from "armonia/src/modules/core/api/auxiliary/private/viewConfig";

/**
 * Reads a specific view config from the ViewConfigContext cache.
 *
 * @param model  Collection name (e.g. "countries")
 * @param viewKey View key (e.g. "sheet", "form:create", "form:edit")
 * @returns The cached ViewConfig or undefined if not yet loaded / not available
 */
export function useViewConfig(model: string, viewKey: string): ViewConfig | undefined {
    const ctx = useViewConfigContext();
    return ctx?.getViewConfig(model, viewKey);
}
