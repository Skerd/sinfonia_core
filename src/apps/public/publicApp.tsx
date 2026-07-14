import {Toaster} from "sonner";
import {Provider} from "react-redux";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {LanguageProvider} from "@coreModule/helpers/context/providers/language-provider.tsx";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import ErrorBoundary from "@coreModule/components/custom/errorBoundary.tsx";
import {lazy, Suspense} from "react";
import Loader from "@coreModule/components/custom/loader.tsx";
import {useIsMobile} from "@coreModule/helpers/hooks/useMobile.tsx";
import {getLocalStorageValue, setLocalStorageValue} from "@coreModule/helpers/context/localStorage/localStorageProvider.ts";
import {generateUUID} from "@coreModule/helpers/general";
import PublicLayout from "@propertyManagementModule/clients/client/public/shared/publicLayout.tsx";
import {sinfoniaRouterBasename} from "../routerBasename";

const HomePage = lazy(() => import("@propertyManagementModule/clients/client/public/home/index.tsx"));
const ProjectsPage = lazy(() => import("@propertyManagementModule/clients/client/public/projects/index.tsx"));
const AboutPage = lazy(() => import("@propertyManagementModule/clients/client/public/about/index.tsx"));
const InvestorsPage = lazy(() => import("@propertyManagementModule/clients/client/public/investors/index.tsx"));
const DevelopersPage = lazy(() => import("@propertyManagementModule/clients/client/public/developers/index.tsx"));
const ContactPage = lazy(() => import("@propertyManagementModule/clients/client/public/contact/index.tsx"));
const PropertyPage = lazy(() => import("@propertyManagementModule/clients/client/public/property/index.tsx"));
const Project3dPage = lazy(() => import("@propertyManagementModule/clients/client/public/project/3d/index.tsx"));
const Project3dFloorPage = lazy(() => import("@propertyManagementModule/clients/client/public/project/3d/floor/index.tsx"));
const ProjectGalleryPage = lazy(() => import("@propertyManagementModule/clients/client/public/project/gallery/index.tsx"));
const ProjectFinancePage = lazy(() => import("@propertyManagementModule/clients/client/public/project/finance/index.tsx"));
const ProjectGridPage = lazy(() => import("@propertyManagementModule/clients/client/public/project/grid/index.tsx"));

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

function PublicApp() {
    const deviceId = getLocalStorageValue("deviceId");
    if (!deviceId) {
        setLocalStorageValue("deviceId", generateUUID());
    }

    return (
        <Provider store={store}>
            <LanguageProvider storageKey="vite-ui-language">
                <BrowserRouter basename={sinfoniaRouterBasename()}>
                    <Suspense fallback={<Loader />}>
                        <Routes>
                            <Route element={<PublicLayout />}>
                                <Route index element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
                                <Route path="projects" element={<ErrorBoundary><ProjectsPage /></ErrorBoundary>} />
                                <Route path="about" element={<ErrorBoundary><AboutPage /></ErrorBoundary>} />
                                <Route path="investors" element={<ErrorBoundary><InvestorsPage /></ErrorBoundary>} />
                                <Route path="developers" element={<ErrorBoundary><DevelopersPage /></ErrorBoundary>} />
                                <Route path="contact" element={<ErrorBoundary><ContactPage /></ErrorBoundary>} />
                                <Route path="property" element={<ErrorBoundary><PropertyPage /></ErrorBoundary>} />
                                <Route path="project/3d" element={<ErrorBoundary><Project3dPage /></ErrorBoundary>} />
                                <Route path="project/3d/floor" element={<ErrorBoundary><Project3dFloorPage /></ErrorBoundary>} />
                                <Route path="project/gallery" element={<ErrorBoundary><ProjectGalleryPage /></ErrorBoundary>} />
                                <Route path="project/finance" element={<ErrorBoundary><ProjectFinancePage /></ErrorBoundary>} />
                                <Route path="project/grid" element={<ErrorBoundary><ProjectGridPage /></ErrorBoundary>} />
                            </Route>
                        </Routes>
                    </Suspense>
                </BrowserRouter>
            </LanguageProvider>
            <ToasterContainer />
        </Provider>
    );
}

export default PublicApp;
