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

/**
 * Reads table configuration from TableConfigContext by key (e.g. "cities", "countries").
 * Config is pre-populated by withTableConfig HOC. Returns filters, columns, columnVisibility.
 * Pass null or empty string to skip.
 */
export function useTableConfig(tableConfigKey: string | null): UseTableConfigResult {
    const tableConfigContext = useTableConfigContext();

    const cached = tableConfigKey ? tableConfigContext?.configs[tableConfigKey.toLowerCase()] : undefined;

    if (cached) {
        return {
            filters: cached.filters,
            columns: cached.columns,
            columnVisibility: cached.columnVisibility,
            loading: false,
            error: null,
        };
    }

    return {
        filters: [],
        columns: [],
        columnVisibility: undefined,
        loading: !!tableConfigKey,
        error: null,
    };
}
