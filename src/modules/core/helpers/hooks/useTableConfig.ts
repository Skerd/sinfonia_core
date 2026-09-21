import {useCallback} from "react";
import type {FilterFieldConfig} from "armonia/src/modules/core/database/filter/fieldRegistry.types.ts";
import type {TableColumnConfig} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type.ts";
import {type CachedTableConfig} from "@coreModule/helpers/context/tableConfigContext.tsx";
import {useTableConfigContext} from "@coreModule/helpers/hooks/useTableConfigContext.ts";

export type UseTableConfigResult = {
    filters: FilterFieldConfig[];
    columns: TableColumnConfig[];
    columnVisibility?: Record<string, boolean>;
    /** The bulk prefetch has not finished yet, so the config may still arrive. */
    loading: boolean;
    /** {@link TABLE_CONFIG_NOT_FOUND_ERROR} when a key was given but no config exists; otherwise `null`. */
    error: Error | null;
    /** Saves column visibility for this table (context + per-user storage). No-op without a key or provider. */
    setColumnVisibility: (visibility: Record<string, boolean>) => void;
};

/**
 * Returned as `error` for a key with no config. One shared instance, so the value is stable
 * across renders and safe in effect dependency arrays.
 */
export const TABLE_CONFIG_NOT_FOUND_ERROR = new Error("table_config_not_found");

/* Shared empties keep `filters`/`columns` referentially stable while no config is available. */
const EMPTY_FILTERS: FilterFieldConfig[] = [];
const EMPTY_COLUMNS: TableColumnConfig[] = [];

/** Looks up a table config in the prefetched cache. Keys are cached lower-cased, so lookups ignore case. */
export function selectTableConfig(
    configs: Record<string, CachedTableConfig> | undefined,
    tableConfigKey: string | null | undefined,
): CachedTableConfig | undefined {
    if (!configs || !tableConfigKey) return undefined;
    return configs[tableConfigKey.toLowerCase()];
}

/**
 * Reads a table configuration (filters, columns, column visibility) from `TableConfigProvider`
 * by key (e.g. `"cities"`). Pass `null`/`undefined`/`""` to skip.
 *
 * While the prefetch runs a missing key reports `loading`; afterwards (or outside a provider)
 * it reports {@link TABLE_CONFIG_NOT_FOUND_ERROR} rather than loading forever.
 */
export function useTableConfig(tableConfigKey: string | null | undefined): UseTableConfigResult {
    const context = useTableConfigContext();
    const cached = selectTableConfig(context?.configs, tableConfigKey);

    const updateColumnVisibility = context?.updateColumnVisibility;
    const setColumnVisibility = useCallback(
        (visibility: Record<string, boolean>) => {
            if (tableConfigKey) updateColumnVisibility?.(tableConfigKey, visibility);
        },
        [tableConfigKey, updateColumnVisibility],
    );

    if (cached) {
        return {
            filters: cached.filters,
            columns: cached.columns,
            columnVisibility: cached.columnVisibility,
            loading: false,
            error: null,
            setColumnVisibility,
        };
    }

    const loading = !!tableConfigKey && !!context && !context.isHydrated;
    const missing = !!tableConfigKey && !loading;

    return {
        filters: EMPTY_FILTERS,
        columns: EMPTY_COLUMNS,
        columnVisibility: undefined,
        loading,
        error: missing ? TABLE_CONFIG_NOT_FOUND_ERROR : null,
        setColumnVisibility,
    };
}
