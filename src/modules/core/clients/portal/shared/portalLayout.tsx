import {compose} from "redux";
import {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {Link, NavLink, Outlet} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import PortalSectionName from "./portalSectionName.tsx";
import {usePortalSections} from "./portalSectionsContext.tsx";
import {PORTAL_BUTTON_GHOST, PORTAL_CONTAINER, PORTAL_HEADING} from "./portalStyles.ts";

/** Portal chrome: brand, the sections with companies, and the visitor's account. */
function PortalLayout({resolveLanguageKey}: WithLanguageType) {
    const dispatch = useDispatch();
    const token = useSelector((state: RootState) => state.authentication.token);
    const sessionExpired = useSelector((state: RootState) => state.authentication.sessionExpired);
    const {sections} = usePortalSections();

    // No expiry dialog on the portal: an expired session simply ends.
    useEffect(() => {
        if (sessionExpired) dispatch(signOut());
    }, [dispatch, sessionExpired]);

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-30 border-b border-portal-border bg-portal-card/95 backdrop-blur">
                <div className={cn(PORTAL_CONTAINER, "flex h-16 items-center gap-6")}>
                    <Link to="/" className={cn(PORTAL_HEADING, "text-lg text-portal-ink")}>{resolveLanguageKey("brand")}</Link>
                    <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label={resolveLanguageKey("sectionsNav")}>
                        {sections.map((section) => (
                            <NavLink
                                key={section.section}
                                to={`/${section.path}`}
                                className={({isActive}) => cn(
                                    "rounded-lg px-3 py-2 text-sm font-medium text-portal-ink-muted transition hover:text-portal-ink",
                                    isActive && "bg-portal-accent-soft text-portal-accent",
                                )}
                            >
                                <PortalSectionName section={section.section} />
                            </NavLink>
                        ))}
                    </nav>
                    <div className="ml-auto flex items-center gap-2">
                        {token ? (
                            <>
                                <Link to="/account" className={PORTAL_BUTTON_GHOST}>{resolveLanguageKey("account")}</Link>
                                <button type="button" className="px-2 text-sm text-portal-ink-muted hover:text-portal-ink" onClick={() => dispatch(signOut())}>
                                    {resolveLanguageKey("signOut")}
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className={PORTAL_BUTTON_GHOST}>{resolveLanguageKey("signIn")}</Link>
                        )}
                    </div>
                </div>
            </header>
            <main className="flex-1">
                <Outlet />
            </main>
            <footer className="border-t border-portal-border bg-portal-card">
                <div className={cn(PORTAL_CONTAINER, "py-6 text-sm text-portal-ink-faded")}>{resolveLanguageKey("footer")}</div>
            </footer>
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/shared/portalLayout.tsx"))(PortalLayout);
