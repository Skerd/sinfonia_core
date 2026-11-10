import {useSelector} from "react-redux";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";

/**
 * The session company's IANA zone (D116): the zone the server judges its calendar days in (the company's own, else
 * the instance's, else UTC). Pass it to armonia Zod factories as `{timeZone}` (their 5th argument) and use it for
 * "today" in day counts. The panel renders after the session is validated, so it is always set there.
 */
export function useCompanyTimeZone(): string {
    return useSelector((state: RootState) => state.authentication.user.company.timezone);
}
