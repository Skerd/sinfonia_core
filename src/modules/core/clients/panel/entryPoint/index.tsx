import {compose} from "redux";
import {SidebarInset, SidebarTrigger} from "@coreModule/components/ui/sidebar.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";
import {Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator} from "@coreModule/components/ui/breadcrumb.tsx";
import ThemeSwitch from "@coreModule/components/custom/themeSwitch.tsx";
import LanguageSwitch from "@coreModule/components/custom/languageSwitch.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {clsx} from "clsx";
import {useLocation, useSearchParams} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {renderCenterPanelContent} from "@coreModule/clients/panel/entryPoint/routeConfig.tsx";
import PanelHomePage from "@coreModule/clients/panel/private/home/PanelHomePage.tsx";
import NotificationBell from "@coreModule/components/custom/notificationBell";
import {useIsMobile} from "@coreModule/helpers/hooks/useMobile.tsx";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";

type CenterPanelProps = WithLanguageType & {
    standalone?: boolean;
}

// Helper function to build breadcrumb items
function buildBreadcrumbs(pathname: string, resolveLanguageKey: Function) {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: Array<{label: string, path: string}> = [];

    if (segments.length === 0 || (segments.length === 1 && segments[0] === "home")) {
        breadcrumbs.push({
            label: resolveLanguageKey("home.title") || "Home",
            path: "/",
        });
        return breadcrumbs;
    }
    
    // First level: menu
    if (segments[0]) {
        breadcrumbs.push({
            label: resolveLanguageKey(`menus.${segments[0]}.title`) || segments[0],
            path: `/${segments[0]}`
        });
    }
    
    // Real Estate specific breadcrumbs with query params
    if (segments[0] === 'tenancy' && segments[1] === 'systemSettings') {
        breadcrumbs.push({
            label: resolveLanguageKey("menus.tenancy.systemSettings.title") || "Configurations",
            path: "/tenancy/systemSettings"
        });
        const resource = segments[2];
        if (resource) {
            breadcrumbs.push({
                label: resolveLanguageKey(`menus.tenancy.systemSettings.${resource}.title`) || resource,
                path: `/tenancy/systemSettings/${resource}`
            });
            if (segments[3] === 'create') {
                breadcrumbs.push({ label: resolveLanguageKey("common.create") || "Create", path: pathname });
            } else if (segments[3] === 'edit') {
                breadcrumbs.push({ label: resolveLanguageKey("common.edit") || "Edit", path: pathname });
            }
        }
    }
    else {
        // For other menus, just show subview if exists
        if (segments[1]) {
            breadcrumbs.push({
                label: resolveLanguageKey(`menus.${segments[0]}.${segments[1]}.title`) || segments[1],
                path: `/${segments[0]}/${segments[1]}`
            });
        }
    }
    
    return breadcrumbs;
}

function CenterPanel({resolveLanguageKey, standalone}: CenterPanelProps){

    const isMobile = useIsMobile();
    const activeChannelId = useSelector((state: RootState) => state.chat.activeChannelId);
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const pathname = location.pathname;
    const segments = pathname.split('/').filter(Boolean);
    const menu = segments[0];
    const subview = segments[1];
    const breadcrumbs = buildBreadcrumbs(pathname, resolveLanguageKey);

    const Main = standalone ? "main" : SidebarInset;
    const hideHeader = standalone || (menu === "company" && subview === "chats" && isMobile && activeChannelId);

    return (
        <Main className="h-svh min-w-0 flex-full max-h-svh overflow-hidden">
            {
                !hideHeader &&
                <header className="z-40 sticky flex pt-1 pe-1 items-center gap-2 shrink-0 border-b">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="my-1" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            {
                                breadcrumbs.map((crumb, index) => (
                                    <div key={index} style={{display: 'flex', alignItems: 'center'}}>
                                        {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                                        <BreadcrumbItem className="hidden md:block">
                                            {index === breadcrumbs.length - 1 ? (
                                                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink href={crumb.path}>
                                                    {crumb.label}
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                    </div>
                                ))
                            }
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="ms-auto flex items-center gap-2 px-1">
                        <NotificationBell />
                        <Separator orientation="vertical" className="my-1 h-6 shrink-0" />
                        <ThemeSwitch />
                        <LanguageSwitch />
                    </div>
                </header>
            }
            <div className={cn("min-w-0 flex-full justify-center overflow-hidden", standalone && "h-full")}>
                <div
                    className={clsx(
                        "min-w-0 w-full max-w-full mx-auto flex-full",
                        standalone ? "h-full" : menu === "company" && subview === "chats" && isMobile ? "px-0" : "px-2 pb-2 mt-2",
                    )}
                >
                    {
                        standalone
                            ? <PanelHomePage />
                            : renderCenterPanelContent({
                                menu,
                                subview,
                                segments,
                                searchParams,
                                resolveLanguageKey,
                            })
                    }
                </div>
                {/*<div style={{height: "25px", minHeight: "25px"}} />*/}
            </div>
        </Main>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/entryPoint/index.tsx"),
)(CenterPanel);