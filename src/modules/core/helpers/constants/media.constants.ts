/**
 * Base URL for privately-served media, as `<base><mediaId>`.
 *
 * This literal was previously copy-pasted into nine components under five different names
 * (`mediaPath`, `mediaUrl`, `MEDIA_BASE`, `DEFAULT_MEDIA_BASE_URL`, `PRIVATE_MEDIA_PREFIX`),
 * so a route change meant finding every spelling. Import this instead of re-declaring it.
 */
export const MEDIA_BASE_URL = "/api/auxiliary/media/";
