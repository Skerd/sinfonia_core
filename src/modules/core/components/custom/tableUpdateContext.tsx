import {createContext, useContext} from "react";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";

type TableUpdateContextType = {
    updateRow: (rowId: string, updates: Partial<CompanyUserType>) => void;
    refetch: () => void;
};

export const TableUpdateContext = createContext<TableUpdateContextType | null>(null);

export const useTableUpdate = () => {
    const context = useContext(TableUpdateContext);
    return context ?? { updateRow: () => {}, refetch: () => {} };
};
