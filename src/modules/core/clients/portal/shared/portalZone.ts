import {env} from "@coreModule/helpers/environment/env.ts";

/*
 * The portal zone in the browser: the apex (`arpeggio.al`) and every company site
 * (`<slug>.arpeggio.al`), at this page's scheme and port. One session spans all of it.
 */

const ZONE = env.VITE_PORTAL_ROOT_DOMAIN;

function zoneOrigin(host: string): string {
    const {protocol, port} = window.location;
    return `${protocol}//${host}${port ? `:${port}` : ""}`;
}

/** The apex origin; this page's own origin in a build without a zone. */
export function portalApexOrigin(): string {
    return ZONE ? zoneOrigin(ZONE) : window.location.origin;
}

/** The origin of a company's own site (`<slug>.<zone>`); a build without a zone has no company sites. */
export function companySiteOrigin(slug: string): string | null {
    return ZONE ? zoneOrigin(`${slug}.${ZONE}`) : null;
}

/** True for an absolute URL on the apex or a company site: where a sign-in may send someone back to. */
export function isPortalZoneUrl(value: string): boolean {
    if (!ZONE) return false;
    try {
        const {hostname} = new URL(value);
        return hostname === ZONE || hostname.endsWith(`.${ZONE}`);
    } catch {
        return false;
    }
}
