import {Toaster} from "sonner";
import {Provider} from "react-redux";
import {lazy, Suspense} from "react";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {LanguageProvider} from "@coreModule/helpers/context/providers/language-provider.tsx";
import {ensureDeviceId} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";
import {TooltipProvider} from "@coreModule/components/animate-ui/components/animate/tooltip.tsx";
import ErrorBoundary from "@coreModule/components/custom/errors/errorBoundary.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import {getPortalContributions} from "@coreModule/helpers/moduleContributions/loadPortalContributions.ts";
import PortalLayout from "@coreModule/clients/portal/shared/portalLayout.tsx";
import {PortalSectionsProvider} from "@coreModule/clients/portal/shared/portalSectionsContext.tsx";
import PortalSectionSite from "@coreModule/clients/portal/shared/portalSectionSite.tsx";
import PortalCompanySite from "@coreModule/clients/portal/shared/portalCompanySite.tsx";

const HomePage = lazy(() => import("@coreModule/clients/portal/home/index.tsx"));
const SearchPage = lazy(() => import("@coreModule/clients/portal/search/index.tsx"));
const SectionPage = lazy(() => import("@coreModule/clients/portal/section/index.tsx"));
const AccountPage = lazy(() => import("@coreModule/clients/portal/account/index.tsx"));
const LoginPage = lazy(() => import("@coreModule/clients/portal/auth/login.tsx"));
const SignUpPage = lazy(() => import("@coreModule/clients/portal/auth/signup.tsx"));
const ActivatePage = lazy(() => import("@coreModule/clients/portal/auth/activate.tsx"));
const ForgotPasswordPage = lazy(() => import("@coreModule/clients/portal/auth/forgotPassword.tsx"));
const ResetPasswordPage = lazy(() => import("@coreModule/clients/portal/auth/resetPassword.tsx"));
const NotFoundPage = lazy(() => import("@coreModule/clients/portal/notFound/index.tsx"));

/**
 * The central portal: one search across the shop, car rental, dentists and properties of
 * every company that lists itself, booking on the company's own pages hosted here.
 */
function PortalApp() {
    ensureDeviceId();

    return (
        <Provider store={store}>
            <LanguageProvider>
                <TooltipProvider>
                    <BrowserRouter>
                        <PortalSectionsProvider>
                            <Suspense fallback={<Loader />}>
                                <Routes>
                                    <Route element={<PortalLayout />}>
                                        <Route index element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
                                        <Route path="search" element={<ErrorBoundary><SearchPage /></ErrorBoundary>} />
                                        <Route path="account" element={<ErrorBoundary><AccountPage /></ErrorBoundary>} />
                                        <Route path="login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
                                        <Route path="signup" element={<ErrorBoundary><SignUpPage /></ErrorBoundary>} />
                                        <Route path="activate/:code" element={<ErrorBoundary><ActivatePage /></ErrorBoundary>} />
                                        <Route path="forgot-password" element={<ErrorBoundary><ForgotPasswordPage /></ErrorBoundary>} />
                                        <Route path="reset-password/:code" element={<ErrorBoundary><ResetPasswordPage /></ErrorBoundary>} />
                                        {getPortalContributions().filter((contribution) => contribution.SectionSite).map((contribution) => (
                                            <Route
                                                key={contribution.section}
                                                path={`${contribution.path}/*`}
                                                element={<ErrorBoundary><PortalSectionSite contribution={contribution} /></ErrorBoundary>}
                                            />
                                        ))}
                                        <Route path=":sectionPath" element={<ErrorBoundary><SectionPage /></ErrorBoundary>} />
                                        <Route path=":sectionPath/:company/*" element={<ErrorBoundary><PortalCompanySite /></ErrorBoundary>} />
                                        <Route path="*" element={<ErrorBoundary><NotFoundPage /></ErrorBoundary>} />
                                    </Route>
                                </Routes>
                            </Suspense>
                        </PortalSectionsProvider>
                    </BrowserRouter>
                </TooltipProvider>
            </LanguageProvider>
            <Toaster closeButton richColors position="bottom-right" duration={2500} />
        </Provider>
    );
}

export default PortalApp;
