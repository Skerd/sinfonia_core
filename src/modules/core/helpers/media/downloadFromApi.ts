import type {Method} from "axios";
import {requestFromApi} from "@coreModule/helpers/apiClient/requestFromApi.ts";
import type {RequestPayload, ResolveLanguageKey} from "@coreModule/helpers/types/httpRequest.types.ts";

export type DownloadFromApiOptions = {
    /** Default `"get"`. */
    method?: Method;
    url: string;
    /** Request body (ignored for GET). */
    data?: RequestPayload;
    /** Name the browser saves the file under. */
    fileName: string;
    /** Translates the failure toast (`axios.error.title` + the server's message), like `useHttpRequest`. */
    resolveLanguageKey?: ResolveLanguageKey;
};

/** How long the object URL lives: long enough for the browser to start the save. */
const REVOKE_AFTER_MS = 60_000;

/**
 * Downloads a file the API generates (PDF, export…) and saves it in the browser. For plain
 * functions behind a menu item: it needs no component, so the request outlives the menu that
 * started it. A failure is logged and toasted by {@link requestFromApi}; the result says whether
 * the file was saved.
 */
export async function downloadFromApi({method = "get", url, data, fileName, resolveLanguageKey}: DownloadFromApiOptions): Promise<boolean> {
    let file: Blob;
    try {
        file = await requestFromApi<Blob>({method, url, data, responseType: "blob", resolveLanguageKey});
    } catch {
        return false;
    }
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), REVOKE_AFTER_MS);
    return true;
}
