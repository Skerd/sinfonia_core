import type {HttpRequest} from "@coreModule/helpers/types/httpRequest.types.ts";

/**
 * Which listed company an apex company site (`/<path>/<company>/*`) is: asked with the company in `x-site-company`,
 * and prefetched by the shell for a hovered link to one.
 */
export const COMPANIES_REQUEST: HttpRequest = {method: "post", url: "/api/portal/companies", data: {}, cache: true};

export function companyLookupBody(section: string, slug: string) {
    return {section, slug};
}
