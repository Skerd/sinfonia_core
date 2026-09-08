import {Toaster} from "@coreModule/components/ui/sonner.tsx";
import {Provider} from "react-redux";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {ThemeProvider} from "@coreModule/helpers/context/providers/theme-provider.tsx";
import {DensityProvider} from "@coreModule/helpers/context/providers/density-provider.tsx";
import {LanguageProvider} from "@coreModule/helpers/context/providers/language-provider.tsx";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import ErrorBoundary from "@coreModule/components/custom/errorBoundary.tsx";
import {lazy, Suspense} from "react";
import Loader from "@coreModule/components/custom/loader.tsx";
import {useIsMobile} from "@coreModule/helpers/hooks/useMobile.tsx";
import {StudioDraftProvider} from "@coreModule/clients/studio/draft/studioDraftProvider.tsx";
import {ensuredDeviceId} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";

const StudioGuard = lazy(() => import("@coreModule/clients/studio/studioGuard.tsx"));
const StudioShell = lazy(() => import("@coreModule/clients/studio/layout/studioShell.tsx"));
const AuthenticationPage = lazy(() => import("@coreModule/clients/panel/pages/public/auth"));

function ToasterContainer() {
    const isMobile = useIsMobile();
    return (
        <Toaster
            closeButton
            richColors
            position={isMobile ? "top-right" : "bottom-right"}
            expand={false}
            duration={1500}
        />
    );
}

/**
 * Arpeggio Studio — a development client for the config-driven render engines.
 *
 * `AuthenticationProvider` sends unauthenticated users to `/authenticate/login` via
 * `window.location`, so this app has to serve that route itself — it is the same core
 * page the panel uses.
 */
function StudioApp() {

    ensuredDeviceId();

    return (
        <Provider store={store}>
            <StudioDraftProvider>
                <LanguageProvider>
                    <ThemeProvider>
                        <DensityProvider>
                            <BrowserRouter>
                                <Suspense fallback={<Loader />}>
                                    <Routes>
                                        <Route
                                            path="/authenticate/:panel/:platform?"
                                            element={
                                                <ErrorBoundary>
                                                    <AuthenticationPage />
                                                </ErrorBoundary>
                                            }
                                        />
                                        <Route element={<StudioGuard />}>
                                            <Route
                                                path="/*"
                                                element={
                                                    <ErrorBoundary>
                                                        <StudioShell />
                                                    </ErrorBoundary>
                                                }
                                            />
                                        </Route>
                                    </Routes>
                                </Suspense>
                            </BrowserRouter>
                            {/* Inside ThemeProvider so toasts resolve the same theme as the app. */}
                            <ToasterContainer />
                        </DensityProvider>
                    </ThemeProvider>
                </LanguageProvider>
            </StudioDraftProvider>
        </Provider>
    );
}

export default StudioApp;
