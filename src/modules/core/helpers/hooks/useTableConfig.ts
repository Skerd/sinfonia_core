import { FilterFieldConfig } from "armonia/src/modules/core/database/filter/fieldRegistry.types.ts";
import { TableColumnConfig } from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type.ts";
import { useTableConfigContext } from "@coreModule/helpers/context/tableConfigContext.tsx";

export type UseTableConfigResult = {
    filters: FilterFieldConfig[];
    columns: TableColumnConfig[];
    columnVisibility?: Record<string, boolean>;
    loading: boolean;
    error: Error | null;
};

const EMPTY_TABLE_CONFIG: Pick<UseTableConfigResult, "filters" | "columns" | "columnVisibility"> = {
    filters: [],
    columns: [],
    columnVisibility: undefined,
};

const MISSING_TABLE_CONFIG_ERROR = new Error("table_config_not_found");

/**
 * Reads table configuration from TableConfigContext by key (e.g. "cities", "countries").
 * Config is pre-populated by withTableConfig HOC. Returns filters, columns, columnVisibility.
 * Pass null or empty string to skip.
 * After the bulk prefetch hydrates, a missing key is an error rather than endless loading.
 */
export function useTableConfig(tableConfigKey: string | null): UseTableConfigResult {
    const tableConfigContext = useTableConfigContext();
    const key = tableConfigKey?.toLowerCase() ?? "";
    const cached = key ? tableConfigContext?.configs[key] : undefined;

    if (cached) {
        return {
            filters: cached.filters,
            columns: cached.columns,
            columnVisibility: cached.columnVisibility,
            loading: false,
            error: null,
        };
    }

    if (!key) {
        return {
            ...EMPTY_TABLE_CONFIG,
            loading: false,
            error: null,
        };
    }

    const hydrated = tableConfigContext?.isHydrated ?? true;

    return {
        ...EMPTY_TABLE_CONFIG,
        loading: !hydrated,
        error: hydrated ? MISSING_TABLE_CONFIG_ERROR : null,
    };
}
