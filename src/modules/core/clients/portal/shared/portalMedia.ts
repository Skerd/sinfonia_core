const PRIVATE_MEDIA_PREFIX = "/api/auxiliary/media/";
const PUBLIC_MEDIA_PREFIX = "/api/auxiliary/public/media/";

/**
 * A public Media id (or a preformed URL) as an img src for the portal pages (Vite proxies /api to Maestro). A private
 * media path is turned into its public one: portal visitors never hold the panel's media permission.
 */
export function resolvePublicMediaUrl(value: string | undefined | null): string | undefined {
    if (!value) {
        return undefined;
    }
    if (value.startsWith(PRIVATE_MEDIA_PREFIX)) {
        return `${PUBLIC_MEDIA_PREFIX}${value.slice(PRIVATE_MEDIA_PREFIX.length)}`;
    }
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/api/")) {
        return value;
    }
    if (value.startsWith("/")) {
        return value;
    }
    return `${PUBLIC_MEDIA_PREFIX}${value}`;
}
