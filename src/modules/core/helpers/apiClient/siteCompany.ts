/**
 * The company a portal page is about. The portal hosts many companies' sites on one host,
 * so the API cannot tell them apart by origin: every request carries the company in the
 * `x-site-company` header instead (its shop slug or id). Unset everywhere else.
 */
let siteCompany: string | null = null;

export function setSiteCompany(value: string | null): void {
    siteCompany = value;
}

export function getSiteCompany(): string | null {
    return siteCompany;
}
