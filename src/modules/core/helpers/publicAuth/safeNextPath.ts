/**
 * The `?next=` path a public site may send someone to after signing in, or
 * `fallback`. Only same-site absolute paths pass: `//host` and `/\host` are
 * protocol-relative URLs to another site in every browser.
 */
export function safeNextPath(search: string, fallback: string): string {
    const next = new URLSearchParams(search).get("next");
    return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
