import {createContext} from "react";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/companyUser.dto.ts";

export type TableUpdateContextType = {
    updateRow: (rowId: string, updates: Partial<CompanyUserType>) => void;
    refetch: () => void;
};

export const TableUpdateContext = createContext<TableUpdateContextType | null>(null);
