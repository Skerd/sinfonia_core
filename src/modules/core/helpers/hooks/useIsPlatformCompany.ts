import {useSelector} from "react-redux";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";

/**
 * Whether the session works in the platform-owner company. Only there are the platform lists (countries, states,
 * cities, currencies, D160) written and reference data requests decided; the server enforces it, this hides the
 * controls everywhere else.
 */
export function useIsPlatformCompany(): boolean {
    return useSelector((state: RootState) => state.authentication.user.company.isPlatformOwner === true);
}
