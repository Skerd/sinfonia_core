import type {EnumTone} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type.ts";
import {useTableConfig} from "@coreModule/helpers/hooks/useTableConfig.ts";

/**
 * The model's `enumTones` for one field of a list's table config. A field inside an embedded list is its dotted
 * column id (`installments.status`), so rows of a sub-list paint their status like the table does (UX-02, TD-F72).
 */
export function useEnumTones(tableConfigKey: string, field: string): Record<string, EnumTone> | undefined {
    const {columns} = useTableConfig(tableConfigKey);
    return columns.find((column) => column.id === field)?.meta?.enumTones;
}
