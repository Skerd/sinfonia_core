import {getDeviceId, getToken} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {getSiteCompany} from "@coreModule/helpers/apiClient/siteCompany.ts";

/**
 * The session and tenant headers every request to this app's own API carries: who asks (token, device), in which
 * language, for which company, and on the portal's apex whose pages (`x-site-company`). `apiClient` sends them; the
 * response cache keys on them, so one visitor, language or company never reads another's answer.
 */
export function contextHeaders(): Record<string, string> {
    const state = store.getState();
    const headers: Record<string, string> = {};
    const token = getToken();
    const deviceId = getDeviceId();
    const languageCode = state.language?.languageCode;
    const companyId = state.authentication?.user?.company?._id;
    const siteCompany = getSiteCompany();

    if (token) headers["x-auth-token"] = token + "";
    if (deviceId) headers["x-device-id"] = deviceId;
    if (languageCode) headers["language"] = languageCode;
    if (companyId) headers["x-company-id"] = companyId;
    if (siteCompany) headers["x-site-company"] = siteCompany;
    return headers;
}
