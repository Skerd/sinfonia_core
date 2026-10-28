import {Navigate, Outlet, useLocation} from "react-router-dom";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import {safeNextPath} from "@coreModule/helpers/publicAuth/safeNextPath.ts";
import {usePortalSession} from "./portalSession.tsx";

/** Routes for a signed-in visitor; anyone else signs in first and comes back. */
export function RequireSession() {
    const {isAuthenticated, isHydrating} = usePortalSession();
    const location = useLocation();

    if (isHydrating) return <Loader />;
    if (!isAuthenticated) {
        return <Navigate to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />;
    }
    return <Outlet />;
}

/** Routes for signing in or up; a signed-in visitor goes where they were headed. */
export function GuestOnly() {
    const {isAuthenticated, isHydrating} = usePortalSession();
    const location = useLocation();

    if (isHydrating) return <Loader />;
    if (isAuthenticated) return <Navigate to={safeNextPath(location.search, "/account")} replace />;
    return <Outlet />;
}
