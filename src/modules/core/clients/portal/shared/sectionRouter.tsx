import type {ReactNode} from "react";
import {BrowserRouter, UNSAFE_LocationContext, UNSAFE_RouteContext, useLocation} from "react-router-dom";

const NO_ROUTE_MATCHES = {outlet: null, matches: [], isDataRoute: false};

/**
 * Hosts a site written for its own domain (absolute links such as `/search`) under a path
 * of the portal: a router of its own with `basename`, so `/search` resolves to
 * `<basename>/search` without touching the site.
 *
 * React Router refuses a router inside another; it only checks for an enclosing location,
 * so that (and the enclosing route matches, which relative routing would read) is reset.
 * The site's navigations stay inside it; when the portal itself navigates, the outer
 * location key changes and the site remounts on the new URL.
 */
export default function SectionRouter({basename, children}: {basename: string; children: ReactNode}) {
    const outer = useLocation();
    return (
        <UNSAFE_LocationContext.Provider value={null as never}>
            <UNSAFE_RouteContext.Provider value={NO_ROUTE_MATCHES as never}>
                <BrowserRouter key={outer.key} basename={basename}>
                    {children}
                </BrowserRouter>
            </UNSAFE_RouteContext.Provider>
        </UNSAFE_LocationContext.Provider>
    );
}
