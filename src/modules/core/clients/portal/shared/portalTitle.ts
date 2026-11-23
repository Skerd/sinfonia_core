import {useEffect, useLayoutEffect, useRef} from "react";
import {useLocation} from "react-router-dom";
import {usePortalSite} from "./portalSiteContext.tsx";

/** The site's name, which ends every tab title: the platform's on the apex, the company's on its own site. */
function useSiteName(): string | undefined {
    const {site} = usePortalSite();
    return site?.company.name;
}

/**
 * Names the page in the browser tab (D181): "Blue Sedan · Adriatic Drive", the site's name last. `null` names the
 * site alone (its home page). While `title` is still unknown (`undefined`, or empty while the page's texts load)
 * the tab keeps its title. The server sends the same title in the page's HTML.
 *
 * Call it once per page, from the page itself: a parent's effect runs after its children's, so a shell that also
 * named the page would win over it.
 */
export function usePortalTitle(title: string | null | undefined): void {
    const siteName = useSiteName();
    const {pathname} = useLocation();
    // The address is a dependency so the page names itself again after the shell's reset below.
    useEffect(() => {
        if (!siteName || title === undefined || title === "") return;
        document.title = title === null ? siteName : `${title} · ${siteName}`;
    }, [siteName, title, pathname]);
}

/**
 * In the portal's shell: a page reached by a link shows the site's name, not the previous page's title, until it names
 * itself with {@link usePortalTitle}; a page that never does keeps the site's name. The first page keeps the title
 * the server sent. A layout effect runs before the page's own effect of the same commit, so the page's title wins.
 */
export function usePortalTitleReset(): void {
    const siteName = useSiteName();
    const {pathname} = useLocation();
    const shown = useRef(pathname);
    useLayoutEffect(() => {
        if (!siteName || shown.current === pathname) return;
        shown.current = pathname;
        document.title = siteName;
    }, [siteName, pathname]);
}
