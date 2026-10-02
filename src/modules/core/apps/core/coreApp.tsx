import {Toaster} from "@coreModule/components/ui/sonner.tsx";
import {Provider} from "react-redux";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {ThemeProvider} from "@coreModule/helpers/context/providers/theme-provider.tsx";
import {DensityProvider} from "@coreModule/helpers/context/providers/density-provider.tsx";
import {LanguageProvider} from "@coreModule/helpers/context/providers/language-provider.tsx";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import ErrorBoundary from "@coreModule/components/custom/errors/errorBoundary.tsx";
import {lazy, Suspense} from "react";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import {useIsMobile} from "@coreModule/helpers/hooks/useMobile.tsx";
import {SidebarProvider} from "@coreModule/components/ui/sidebar.tsx";
import {TooltipProvider} from "@coreModule/components/animate-ui/components/animate/tooltip.tsx";
import {ensureDeviceId} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";

const PrivatePage = lazy(() => import("@coreModule/clients/panel/private"));
const AuthenticationPage = lazy(() => import("@coreModule/clients/panel/public/auth"));
const AdministrativePanelSideBar = lazy(() => import("@coreModule/clients/panel/private/sidebar"));
const CenterPanel = lazy(() => import("@coreModule/clients/panel/entryPoint"));

function ToasterContainer({}: {}){
    const isMobile = useIsMobile();
    return (
        <Toaster
            closeButton
            richColors
            position={isMobile ? "top-right" : "bottom-right"}
            // pauseWhenPageIsHidden={true}
            expand={false}
            duration={1500}
        />
    )
}

function CoreApp() {

    ensureDeviceId();

    return (
        <Provider store={store}>
            <LanguageProvider>
                <ThemeProvider>
                    <DensityProvider>
                        <TooltipProvider>
                            <BrowserRouter>
                                <Suspense fallback={<Loader />}>
                                    <Routes>
                                        <Route path="/authenticate/:panel/:platform?" element={<ErrorBoundary><AuthenticationPage/></ErrorBoundary>}/>
                                        <Route element={<PrivatePage />}>
                                            <Route path="/:menu?/:subview?/:id?/*" element={
                                                <ErrorBoundary>
                                                    <SidebarProvider className="h-svh max-h-svh min-h-0 overflow-hidden">
                                                        <AdministrativePanelSideBar />
                                                        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                                                            <CenterPanel />
                                                        </div>
                                                    </SidebarProvider>
                                                </ErrorBoundary>
                                            } />
                                        </Route>
                                    </Routes>
                                </Suspense>
                            </BrowserRouter>
                            <ToasterContainer />
                        </TooltipProvider>
                    </DensityProvider>
                </ThemeProvider>
            </LanguageProvider>
        </Provider>
    )
}

export default CoreApp
