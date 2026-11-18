import {type CachedViewConfigs} from "@coreModule/helpers/context/viewConfigContext.tsx";
import {useViewConfigContext} from "@coreModule/helpers/hooks/useViewConfigContext.ts";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";

export type ViewConfigState = {
    /** The cached config, when present. */
    config: ViewConfig | undefined;
    /** The bulk prefetch has not finished yet, so the config may still arrive. */
    loading: boolean;
    /** No config exists for this model/view: the prefetch finished, or there is no provider. */
    missing: boolean;
};

/**
 * Looks up a view config in the prefetched cache. Models are cached lower-cased
 * (`"Countries"` and `"countries"` resolve alike); view keys are matched exactly.
 */
export function selectViewConfig(
    configs: Record<string, CachedViewConfigs> | undefined,
    model: string | null | undefined,
    viewKey: string,
): ViewConfig | undefined {
    if (!configs || !model) return undefined;
    return configs[model.toLowerCase()]?.[viewKey];
}

/**
 * The `viewKey` config of the model served at the CRUD `apiUrl`, for callers that know a route rather than a
 * collection (an `#ApiSelect` reading the create form's `accessModel` behind its `/select`).
 */
export function selectViewConfigByApiUrl(
    configs: Record<string, CachedViewConfigs> | undefined,
    apiUrl: string | undefined,
    viewKey: string,
): ViewConfig | undefined {
    if (!configs || !apiUrl) return undefined;
    return Object.values(configs).find((byKey) => byKey[viewKey]?.apiUrl === apiUrl)?.[viewKey];
}

/**
 * Reads a view config and whether it is still loading or definitively missing — for callers
 * that render a loader vs. a "not available" state.
 *
 * @param model   Collection name (e.g. `"countries"`)
 * @param viewKey View key (e.g. `"sheet"`, `"form:create"`, `"form:edit"`)
 */
export function useViewConfigState(model: string | null | undefined, viewKey: string): ViewConfigState {
    const context = useViewConfigContext();
    const config = selectViewConfig(context?.configs, model, viewKey);
    const loading = !config && !!context && !context.isHydrated;
    return {config, loading, missing: !config && !loading};
}

/**
 * Reads a view config from the `ViewConfigProvider` cache.
 *
 * @param model   Collection name (e.g. `"countries"`)
 * @param viewKey View key (e.g. `"sheet"`, `"form:create"`, `"form:edit"`)
 * @returns The cached config, or `undefined` when not loaded / not available.
 */
export function useViewConfig(model: string | null | undefined, viewKey: string): ViewConfig | undefined {
    return useViewConfigState(model, viewKey).config;
}
