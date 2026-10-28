import {useEffect} from "react";
import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {Outlet} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import PortalNotFound from "../../notFound/index.tsx";
import PortalChat from "../chat/index.tsx";
import PortalFooter from "../footer/index.tsx";
import PortalNavigation from "../navigation/index.tsx";
import {usePortalSite} from "../portalSiteContext.tsx";

/** Portal chrome around every page (and a company site's visitor chat); a host the portal does not know shows only "not found". */
function PortalLayout({resolveLanguageKey}: WithLanguageType) {
    const dispatch = useDispatch();
    const sessionExpired = useSelector((state: RootState) => state.authentication.sessionExpired);
    const {site} = usePortalSite();

    // No expiry dialog on the portal: an expired session simply ends.
    useEffect(() => {
        if (sessionExpired) dispatch(signOut());
    }, [dispatch, sessionExpired]);

    return (
        <div className="flex min-h-svh flex-col">
            <a
                href="#portal-main"
                className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
            >
                {resolveLanguageKey("skipToContent")}
            </a>
            <PortalNavigation />
            <main id="portal-main" tabIndex={-1} className="flex-1 outline-none">
                {site === null ? <PortalNotFound /> : <Outlet />}
            </main>
            <PortalFooter />
            <PortalChat />
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/shared/layout/index.tsx"))(PortalLayout);
