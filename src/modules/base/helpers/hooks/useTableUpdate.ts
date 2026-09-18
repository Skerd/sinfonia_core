import {useContext} from "react";
import {TableUpdateContext, type TableUpdateContextType} from "@baseModule/helpers/context/tableUpdateContext.tsx";

export const useTableUpdate = (): TableUpdateContextType => {
    const context = useContext(TableUpdateContext);
    return context ?? {updateRow: () => {}, refetch: () => {}};
};
