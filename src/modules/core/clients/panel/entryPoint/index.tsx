import {IconSearch} from "@tabler/icons-react";
import {compose} from "redux";
import {SidebarInset, SidebarTrigger} from "@coreModule/components/ui/sidebar.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";
import {Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator} from "@coreModule/components/ui/breadcrumb.tsx";
import ThemeSwitch from "@coreModule/components/custom/preferences/themeSwitch.tsx";
import LanguageSwitch from "@coreModule/components/custom/preferences/languageSwitch.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {clsx} from "clsx";
import {Link, useLocation, useSearchParams} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {PageHeaderProvider, usePageHeader} from "@coreModule/helpers/context/pageHeaderContext.tsx";
import {useAccessHydrated, useAccessMap} from "@coreModule/helpers/context/accessContext.tsx";
import {getModuleSidebarNavGroups} from "@coreModule/helpers/moduleContributions/loadSidebarContributions.ts";
import {filterNavGroups} from "@coreModule/helpers/navigation/filterNavByAccess.ts";
import {flattenPanelNavLinks} from "@coreModule/helpers/navigation/flattenPanelNavLinks.ts";
import {buildRouteCrumbs, navPagePaths} from "@coreModule/helpers/navigation/routeCrumbs.ts";
import {renderCenterPanelContent} from "@coreModule/clients/panel/entryPoint/routeConfig.tsx";
import NotificationBell from "@coreModule/components/custom/notifications/notificationBell.tsx";
import {useIsMobile} from "@coreModule/helpers/hooks/useMobile.tsx";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {resolveCenterPanelClassName} from "@coreModule/helpers/moduleContributions/loadPanelLayoutContributions.ts";
import {Fragment, Suspense, useMemo, useRef, useState} from "react";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import CommandPalette from "@coreModule/components/custom/commandPalette/commandPalette.tsx";
import {CommandPaletteKbd} from "@coreModule/components/custom/commandPalette/commandPaletteShortcut.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {useFadeInOnChange} from "@coreModule/helpers/hooks/useFadeInOnChange.ts";

/**
 * Areas whose pages keep a list of their own on screen (the account settings' menu, a chat's conversations): moving
 * inside one is not a new page, so the center does not fade.
 */
const STAYING_AREA = /^\/(account|company\/(?:chats|websiteChats))(\/|$)/;
const staysInArea = (previous: string, next: string) => {
    const area = STAYING_AREA.exec(previous)?.[1];
    return area !== undefined && STAYING_AREA.exec(next)?.[1] === area;
};

type CenterPanelProps = WithLanguageType;

/**
 * The trail is route crumbs followed by whatever the page published. Rendered
 * from inside the provider so a page mounting deeper context re-renders only
 * this row rather than the whole shell.
 */
function ShellBreadcrumb() {
    const pageHeader = usePageHeader();
    const crumbs = pageHeader?.trail ?? [];

    return (
        <Breadcrumb className="min-w-0 flex-1">
            <BreadcrumbList className="flex-nowrap">
                {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1;
                    return (
                        <Fragment key={`${crumb.path ?? "context"}-${index}`}>
                            {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                            {/*
                              * Only the trailing crumb survives on mobile. Hiding the whole
                              * trail left the header with no indication of location at all.
                              */}
                            <BreadcrumbItem className={cn("min-w-0", !isLast && "hidden md:block")}>
                                {isLast ? (
                                    <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                                ) : crumb.path ? (
                                    /*
                                     * asChild + router Link, not href: a bare anchor is a full
                                     * document load, which tears down the Redux store and refetches
                                     * every cached view config on what looks like an in-app click.
                                     */
                                    <BreadcrumbLink asChild className="truncate">
                                        <Link to={crumb.path}>{crumb.label}</Link>
                                    </BreadcrumbLink>
                                ) : (
                                    // A menu group: names where the page sits but has no page of its own.
                                    <span className="truncate">{crumb.label}</span>
                                )}
                            </BreadcrumbItem>
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}

function CenterPanel({resolveLanguageKey}: CenterPanelProps){

    const isMobile = useIsMobile();
    const activeChannelId = useSelector((state: RootState) => state.chat.activeChannelId);
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [commandOpen, setCommandOpen] = useState(false);
    const pathname = location.pathname;
    // Each new page fades in (D174); opening a sheet or changing a list's filters stays on the same path.
    const pageContent = useRef<HTMLDivElement>(null);
    useFadeInOnChange(pageContent, pathname, {skip: staysInArea});
    const segments = pathname.split('/').filter(Boolean);
    const menu = segments[0];
    const subview = segments[1];

    const isPlatformCompany = useSelector((state: RootState) => state.authentication.user.company.isPlatformOwner);
    const isPlatformAdmin = useSelector((state: RootState) => state.authentication.user.isPlatformAdmin);
    const accessMap = useAccessMap();
    const accessHydrated = useAccessHydrated();

    // The same pages the sidebar offers this user, so a crumb links exactly where the sidebar would.
    const pagePaths = useMemo(
        () => navPagePaths(flattenPanelNavLinks(filterNavGroups(
            getModuleSidebarNavGroups(resolveLanguageKey, {isPlatformCompany, isPlatformAdmin}),
            accessMap,
            accessHydrated,
        ))),
        [resolveLanguageKey, isPlatformCompany, isPlatformAdmin, accessMap, accessHydrated],
    );

    const routeCrumbs = useMemo(
        () => buildRouteCrumbs(pathname, resolveLanguageKey, pagePaths),
        [pathname, resolveLanguageKey, pagePaths],
    );

    const hideHeader = menu === "company" && isMobile && (
        (subview === "chats" && !!activeChannelId)
        || (subview === "websiteChats" && !!activeChannelId)
    );

    // Do not use `.flex-full` here: that class always sets `overflow-y: auto`, which
    // overrides `overflow-hidden` and creates nested scrollports (double scrollbar +
    // empty "black" region at the bottom of tall forms).
    return (
        <PageHeaderProvider routeCrumbs={routeCrumbs}>
            <SidebarInset className="flex h-svh max-h-svh min-h-0 min-w-0 flex-1 flex-col overflow-hidden pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] touch-manipulation">
                {
                    !hideHeader &&
                    <header className="z-40 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-2">
                        <SidebarTrigger className="shrink-0" />
                        <Separator orientation="vertical" className="h-5 shrink-0" />
                        <ShellBreadcrumb />
                        <div className="ms-auto flex shrink-0 items-center gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="hidden gap-2 text-muted-foreground sm:inline-flex"
                                onClick={() => setCommandOpen(true)}
                                aria-label={String(resolveLanguageKey("commandPalette.title") || "Open command palette")}
                            >
                                <IconSearch className="size-4" aria-hidden />
                                <CommandPaletteKbd />
                            </Button>
                            <NotificationBell />
                            <Separator orientation="vertical" className="h-5 shrink-0" />
                            <ThemeSwitch />
                            <LanguageSwitch />
                        </div>
                    </header>
                }
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                    <div
                        ref={pageContent}
                        className={clsx(
                            "mx-auto flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col",
                            resolveCenterPanelClassName({menu, subview, isMobile})
                                ?? (menu === "company" && (subview === "chats" || subview === "websiteChats") && isMobile
                                    ? "overflow-y-auto px-0"
                                    : "overflow-y-auto px-2 pb-2 mt-2"),
                        )}
                    >
                        {/* Every page loads on first visit (D21): one boundary for all of them. */}
                        <Suspense fallback={<Loader />}>
                            {renderCenterPanelContent({
                                menu,
                                subview,
                                segments,
                                searchParams,
                                resolveLanguageKey,
                            })}
                        </Suspense>
                    </div>
                </div>
                <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
            </SidebarInset>
        </PageHeaderProvider>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/entryPoint/index.tsx"),
)(CenterPanel);