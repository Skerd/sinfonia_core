import {Toaster} from "@coreModule/components/ui/sonner.tsx";
import {Provider} from "react-redux";
import {lazy, Suspense, type ReactNode} from "react";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {LanguageProvider} from "@coreModule/helpers/context/providers/language-provider.tsx";
import {ThemeProvider} from "@coreModule/helpers/context/providers/theme-provider.tsx";
import {ensureDeviceId} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";
import {TooltipProvider} from "@coreModule/components/ui/tooltip.tsx";
import ErrorBoundary from "@coreModule/components/custom/errors/errorBoundary.tsx";
import PortalLayout from "@coreModule/clients/portal/shared/layout/index.tsx";
import {PortalSiteProvider, usePortalSite} from "@coreModule/clients/portal/shared/portalSiteContext.tsx";
import {PortalSessionProvider} from "@coreModule/clients/portal/shared/portalSession.tsx";
import {GuestOnly, RequireSession} from "@coreModule/clients/portal/shared/sessionRoutes.tsx";
import {SectionBaseProvider, sectionHref} from "@coreModule/clients/portal/shared/sectionBase.tsx";
import PortalCompanySite from "@coreModule/clients/portal/shared/portalCompanySite.tsx";
import PortalScrollRestoration from "@coreModule/clients/portal/shared/portalScrollRestoration.tsx";
import SitePageLayout from "@coreModule/clients/portal/shared/sitePageLayout.tsx";
import {getPortalContributions, portalHostPagesOf} from "@coreModule/helpers/moduleContributions/loadPortalContributions.ts";
import {WebSocketProvider} from "@coreModule/helpers/context/webSocketContext.tsx";

const HomePage = lazy(() => import("@coreModule/clients/portal/home/index.tsx"));
const BlogPage = lazy(() => import("@coreModule/clients/portal/blog/index.tsx"));
const BlogArticlePage = lazy(() => import("@coreModule/clients/portal/blog/article.tsx"));
const AccountLayout = lazy(() => import("@coreModule/clients/portal/account/layout.tsx"));
const AccountPage = lazy(() => import("@coreModule/clients/portal/account/index.tsx"));
const ProfilePage = lazy(() => import("@coreModule/clients/portal/account/profile.tsx"));
const SecurityPage = lazy(() => import("@coreModule/clients/portal/account/security.tsx"));
const LoginPage = lazy(() => import("@coreModule/clients/portal/auth/login.tsx"));
const SignUpPage = lazy(() => import("@coreModule/clients/portal/auth/signup.tsx"));
const ActivatePage = lazy(() => import("@coreModule/clients/portal/auth/activate.tsx"));
const ForgotPasswordPage = lazy(() => import("@coreModule/clients/portal/auth/forgotPassword.tsx"));
const ResetPasswordPage = lazy(() => import("@coreModule/clients/portal/auth/resetPassword.tsx"));
const NotFoundPage = lazy(() => import("@coreModule/clients/portal/notFound/index.tsx"));

/** While the host is being identified: the header's line and nothing else, so the page does not open on a spinner. */
function PortalBoot() {
    return <div className="h-16 border-b" />;
}

/** The state the sections this host offers share with the shell (the shop's cart). */
function SectionProviders({children}: {children: ReactNode}) {
    const {sections} = usePortalSite();
    return sections.reduceRight<ReactNode>((tree, section) => section.Provider ? <section.Provider>{tree}</section.Provider> : tree, children);
}

/**
 * The pages of the sections this host offers, and the modules' host pages. A section spanning companies (the shop) and a
 * company's own site live under `/<path>/*`; on the apex a company's pages live under
 * `/<path>/<company>/*`, and `/<path>` itself opens the section's items in the home catalog.
 */
function PortalRoutes() {
    const {site, sections} = usePortalSite();
    if (site === undefined) return <PortalBoot />;
    const companyHost = site?.scope === "company";
    // The modules' host pages (D96): on every host, whatever sections it lists, and never in the navbar or footer.
    const hostPages = portalHostPagesOf(getPortalContributions());

    return (
        <Routes>
            <Route element={<PortalLayout />}>
                <Route index element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
                <Route path="blog" element={<ErrorBoundary><BlogPage /></ErrorBoundary>} />
                <Route path="blog/:slug" element={<ErrorBoundary><BlogArticlePage /></ErrorBoundary>} />
                <Route path="account" element={<RequireSession />}>
                    <Route element={<AccountLayout />}>
                        <Route index element={<ErrorBoundary><AccountPage /></ErrorBoundary>} />
                        <Route path="profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
                        <Route path="security" element={<ErrorBoundary><SecurityPage /></ErrorBoundary>} />
                    </Route>
                </Route>
                <Route element={<GuestOnly />}>
                    <Route path="login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
                    <Route path="login/:platform" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
                    <Route path="signup" element={<ErrorBoundary><SignUpPage /></ErrorBoundary>} />
                    <Route path="forgot-password" element={<ErrorBoundary><ForgotPasswordPage /></ErrorBoundary>} />
                    <Route path="reset-password/:code" element={<ErrorBoundary><ResetPasswordPage /></ErrorBoundary>} />
                </Route>
                <Route path="activate/:code" element={<ErrorBoundary><ActivatePage /></ErrorBoundary>} />
                <Route element={<SitePageLayout />}>
                    {hostPages.map(({path, Page}) => (
                        <Route key={`host-${path}`} path={path} element={<ErrorBoundary><Page /></ErrorBoundary>} />
                    ))}
                </Route>
                {sections.map((contribution) => {
                    const {section, path, CompanySite} = contribution;
                    const Site = contribution.SectionSite ?? (companyHost ? CompanySite : undefined);
                    if (Site) {
                        return (
                            <Route
                                key={section}
                                path={`${path}/*`}
                                element={<ErrorBoundary><SectionBaseProvider base={`/${path}`}><Site /></SectionBaseProvider></ErrorBoundary>}
                            />
                        );
                    }
                    return [
                        <Route key={section} path={path} element={<Navigate to={sectionHref(contribution)} replace />} />,
                        ...(contribution.sectionPages ?? []).map(({path: pagePath, Page}) => (
                            <Route
                                key={`${section}-${pagePath}`}
                                path={`${path}/${pagePath}`}
                                element={<ErrorBoundary><SectionBaseProvider base={`/${path}`}><Page /></SectionBaseProvider></ErrorBoundary>}
                            />
                        )),
                        CompanySite ? (
                            <Route
                                key={`${section}-company`}
                                path={`${path}/:company/*`}
                                element={<ErrorBoundary><PortalCompanySite contribution={contribution}><CompanySite /></PortalCompanySite></ErrorBoundary>}
                            />
                        ) : null,
                    ];
                })}
                <Route path="*" element={<ErrorBoundary><NotFoundPage /></ErrorBoundary>} />
            </Route>
        </Routes>
    );
}

/**
 * The portal: the one public app. On the apex it spans every listed company (shop, car
 * rental, dentists, properties); on a company's own host it is that company's site.
 */
function PortalApp() {
    ensureDeviceId();

    return (
        <Provider store={store}>
            <LanguageProvider>
                <ThemeProvider>
                    <TooltipProvider>
                        <BrowserRouter>
                            <PortalScrollRestoration />
                            <PortalSiteProvider>
                                <PortalSessionProvider>
                                    {/* The shared socket, for signed-in sessions only (no token, no socket): live updates (D172). */}
                                    <WebSocketProvider showSetupScreen={false}>
                                        <SectionProviders>
                                            <Suspense fallback={<PortalBoot />}>
                                                <PortalRoutes />
                                            </Suspense>
                                        </SectionProviders>
                                    </WebSocketProvider>
                                </PortalSessionProvider>
                            </PortalSiteProvider>
                        </BrowserRouter>
                    </TooltipProvider>
                    <Toaster closeButton richColors position="bottom-right" duration={2500} />
                </ThemeProvider>
            </LanguageProvider>
        </Provider>
    );
}

export default PortalApp;
