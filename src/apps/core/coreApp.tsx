import {Toaster} from "sonner";
import {Provider} from "react-redux";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {ThemeProvider} from "@coreModule/helpers/context/providers/theme-provider.tsx";
import {LanguageProvider} from "@coreModule/helpers/context/providers/language-provider.tsx";
import {TableConfigProvider} from "@coreModule/helpers/context/tableConfigContext";
import {ViewConfigProvider} from "@coreModule/helpers/context/viewConfigContext";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import ErrorBoundary from "@coreModule/components/custom/errorBoundary.tsx";
import {lazy, Suspense} from "react";
import Loader from "@coreModule/components/custom/loader.tsx";
import {useIsMobile} from "@coreModule/helpers/hooks/useMobile.tsx";
import {getLocalStorageValue, setLocalStorageValue} from "@coreModule/helpers/context/localStorage/localStorageProvider.ts";
import {generateUUID} from "@coreModule/helpers/general";
import PanelHomePage from "@coreModule/clients/panel/private/home/PanelHomePage.tsx";
import {SidebarProvider} from "@coreModule/components/ui/sidebar.tsx";

const PrivatePage = lazy(() => import("@coreModule/clients/panel/pages/private"));
const AuthenticationPage = lazy(() => import("@coreModule/clients/panel/pages/public/auth"));
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

    const deviceId = getLocalStorageValue("deviceId");
    if( !deviceId ){
        setLocalStorageValue("deviceId", generateUUID());
    }

    return (
        <Provider store={store}>
            <TableConfigProvider>
                <ViewConfigProvider>
                    <LanguageProvider storageKey="vite-ui-language">
                        <ThemeProvider storageKey="vite-ui-theme">
                            <BrowserRouter>
                                <Suspense fallback={<Loader />}>
                                    <Routes>
                                        <Route path="/authenticate/:panel/:platform?" element={<ErrorBoundary><AuthenticationPage/></ErrorBoundary>}/>
                                        <Route element={<PrivatePage />}>
                                            <Route path="/:menu?/:subview?/:id?/*" element={
                                                <>
                                                    <PanelHomePage />
                                                    <SidebarProvider className="h-svh max-h-svh min-h-0 overflow-hidden">
                                                        <AdministrativePanelSideBar />
                                                        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                                                            <CenterPanel />
                                                        </div>
                                                    </SidebarProvider>
                                                </>
                                            } />
                                        </Route>
                                    </Routes>
                                </Suspense>
                            </BrowserRouter>
                        </ThemeProvider>
                    </LanguageProvider>
                </ViewConfigProvider>
            </TableConfigProvider>
            <ToasterContainer />
        </Provider>
    )
}

export default CoreApp
