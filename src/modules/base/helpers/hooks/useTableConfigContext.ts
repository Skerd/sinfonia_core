import {useContext} from "react";
import {TableConfigContext, type TableConfigContextValue} from "@baseModule/helpers/context/tableConfigContext.tsx";

/** Returns the table config context value, or null when used outside a provider. */
export function useTableConfigContext(): TableConfigContextValue | null {
    return useContext(TableConfigContext);
}
