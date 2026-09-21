import {useContext} from "react";
import {ViewConfigContext, type ViewConfigContextValue} from "@coreModule/helpers/context/viewConfigContext.tsx";

/** Returns the view config context value, or null when used outside a provider. */
export function useViewConfigContext(): ViewConfigContextValue | null {
    return useContext(ViewConfigContext);
}
