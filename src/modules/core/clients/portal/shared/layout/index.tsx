import {Suspense, useEffect, useRef} from "react";
import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {Outlet, matchPath, useLocation} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {getPortalContributions, portalHostPagesOf} from "@coreModule/helpers/moduleContributions/loadPortalContributions.ts";
import {signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import PortalNotFound from "../../notFound/index.tsx";
import PortalChat from "../chat/index.tsx";
import PortalFooter from "../footer/index.tsx";
import PortalNavigation from "../navigation/index.tsx";
import {usePortalSite} from "../portalSiteContext.tsx";
import {usePortalLinkIntent} from "../portalLinkIntent.ts";
import PortalProgressBar from "../portalProgress.tsx";
import {useFadeInOnChange} from "@coreModule/helpers/hooks/useFadeInOnChange.ts";
import {isAccountTabSwitch} from "../accountArea.ts";
import {usePortalSectionTexts} from "../portalSectionTexts.ts";
import {usePortalTitleReset} from "../portalTitle.ts";

/**
 * Portal chrome around every page (and a company site's visitor chat). A host the portal does not know shows only
 * "not found", except the modules' host pages (D96): emailed token links work on every company host.
 *
 * The one loading boundary of the pages sits here: a navigation keeps the current page on screen until the next
 * one's code has loaded (the router navigates in a transition), so the chrome never blanks; only a first visit
 * straight to a page shows the quiet placeholder. Each new page fades in.
 */
function PortalLayout({resolveLanguageKey, languageCode}: WithLanguageType) {
    const dispatch = useDispatch();
    const sessionExpired = useSelector((state: RootState) => state.authentication.sessionExpired);
    const {site, sections} = usePortalSite();
    const {pathname} = useLocation();
    const onHostPage = portalHostPagesOf(getPortalContributions()).some(({path}) => matchPath(`/${path}`, pathname) !== null);
    usePortalLinkIntent(site, sections);
    usePortalSectionTexts(sections, languageCode);
    usePortalTitleReset();

    const page = useRef<HTMLDivElement>(null);
    // A tab of the same account area is faded by its shell, beside the list that stays.
    useFadeInOnChange(page, pathname, {first: true, skip: isAccountTabSwitch});

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
            <PortalProgressBar />
            <PortalNavigation />
            <main id="portal-main" tabIndex={-1} className="flex-1 outline-none">
                <div ref={page}>
                    <Suspense fallback={<div className="min-h-svh" aria-busy="true" aria-label={resolveLanguageKey("loadingPage")} />}>
                        {site === null && !onHostPage ? <PortalNotFound /> : <Outlet />}
                    </Suspense>
                </div>
            </main>
            <PortalFooter />
            <PortalChat />
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/shared/layout/index.tsx"))(PortalLayout);
