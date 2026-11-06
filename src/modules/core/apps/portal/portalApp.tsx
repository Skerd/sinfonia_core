import {Toaster} from "sonner";
import {Provider} from "react-redux";
import {lazy, Suspense, type ReactNode} from "react";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {LanguageProvider} from "@coreModule/helpers/context/providers/language-provider.tsx";
import {ThemeProvider} from "@coreModule/helpers/context/providers/theme-provider.tsx";
import {ensureDeviceId} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";
import {TooltipProvider} from "@coreModule/components/ui/tooltip.tsx";
import ErrorBoundary from "@coreModule/components/custom/errors/errorBoundary.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import PortalLayout from "@coreModule/clients/portal/shared/layout/index.tsx";
import {PortalSiteProvider, usePortalSite} from "@coreModule/clients/portal/shared/portalSiteContext.tsx";
import {PortalSessionProvider} from "@coreModule/clients/portal/shared/portalSession.tsx";
import {GuestOnly, RequireSession} from "@coreModule/clients/portal/shared/sessionRoutes.tsx";
import {SectionBaseProvider, sectionHref} from "@coreModule/clients/portal/shared/sectionBase.tsx";
import PortalCompanySite from "@coreModule/clients/portal/shared/portalCompanySite.tsx";
import PortalScrollToTop from "@coreModule/clients/portal/shared/portalScrollToTop.tsx";

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

/** The state the sections this host offers share with the shell (the shop's cart). */
function SectionProviders({children}: {children: ReactNode}) {
    const {sections} = usePortalSite();
    return sections.reduceRight<ReactNode>((tree, section) => section.Provider ? <section.Provider>{tree}</section.Provider> : tree, children);
}

/**
 * The pages of the sections this host offers. A section spanning companies (the shop) and a
 * company's own site live under `/<path>/*`; on the apex a company's pages live under
 * `/<path>/<company>/*`, and `/<path>` itself opens the section's items in the home catalog.
 */
function PortalRoutes() {
    const {site, sections} = usePortalSite();
    if (site === undefined) return <Loader />;
    const companyHost = site?.scope === "company";

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
                            <PortalScrollToTop />
                            <PortalSiteProvider>
                                <PortalSessionProvider>
                                    <SectionProviders>
                                        <Suspense fallback={<Loader />}>
                                            <PortalRoutes />
                                        </Suspense>
                                    </SectionProviders>
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
