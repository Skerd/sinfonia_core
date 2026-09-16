import {useContext} from "react";
import {ReloginContext, type ReloginContextValue} from "@baseModule/helpers/context/reloginContext.tsx";

/** Company-switch actions from the nearest `ReloginProvider`. Throws outside one. */
export function useRelogin(): ReloginContextValue {
    const context = useContext(ReloginContext);
    if (context === undefined) {
        throw new Error("useRelogin must be used within a ReloginProvider");
    }
    return context;
}
