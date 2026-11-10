/**
 * Where a node's panel route opens. Inside the panel the route stays relative; the studio is another app on another
 * origin, so there it goes to the panel's origin (`VITE_PANEL_URL`) in a new tab (TD-B174).
 */
export function panelLink(route: string, panelOrigin: string): {href: string; external: boolean} {
    const origin = panelOrigin.replace(/\/+$/, "");
    return origin ? {href: `${origin}${route}`, external: true} : {href: route, external: false};
}
