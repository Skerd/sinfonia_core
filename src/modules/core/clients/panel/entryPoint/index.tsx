import {compose} from "redux";
import {SidebarInset, SidebarTrigger} from "@coreModule/components/ui/sidebar.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";
import {Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator} from "@coreModule/components/ui/breadcrumb.tsx";
import ThemeSwitch from "@coreModule/components/custom/themeSwitch.tsx";
import LanguageSwitch from "@coreModule/components/custom/languageSwitch.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {clsx} from "clsx";
import {Link, useLocation, useSearchParams} from "react-router-dom";
import withLanguage, {WithLanguageType, type ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {PageHeaderProvider, usePageHeader} from "@coreModule/helpers/context/pageHeaderContext.tsx";
import {renderCenterPanelContent} from "@coreModule/clients/panel/entryPoint/routeConfig.tsx";
import NotificationBell from "@coreModule/components/custom/notificationBell";
import {useIsMobile} from "@coreModule/helpers/hooks/useMobile.tsx";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {resolveCenterPanelClassName} from "@coreModule/clients/panel/moduleContributions/loadPanelLayoutContributions.ts";
import {Fragment, useMemo, useState} from "react";
import CommandPalette from "@coreModule/components/custom/commandPalette.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Kbd, KbdGroup} from "@coreModule/components/ui/kbd.tsx";
import {Search} from "lucide-react";

type CenterPanelProps = WithLanguageType;

/** Turns `costControl` into `Cost control` when no translation exists. */
function humanize(segment: string) {
    const spaced = segment.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]+/g, " ");
    return spaced.charAt(0).toLocaleUpperCase() + spaced.slice(1);
}

/**
 * Builds the breadcrumb trail from the route.
 *
 * Walks every segment rather than stopping at two: the previous version
 * special-cased `tenancy/systemSettings` and truncated everything else, so
 * `/realEstate/projects/create` rendered as "Real Estate › Projects" and the
 * create and edit pages had no trail at all.
 *
 * Labels resolve against the same `menus.*` key path the sidebar uses, falling
 * back to `common.*` for the standard CRUD verbs and finally to a humanized
 * segment, so an untranslated route degrades to readable text rather than a
 * raw key.
 */
function buildBreadcrumbs(pathname: string, resolveLanguageKey: ResolveLanguageKey) {
    const translate = (key: string) => {
        const value = resolveLanguageKey(key, true);
        return typeof value === "string" && value ? value : undefined;
    };

    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0 || (segments.length === 1 && segments[0] === "home")) {
        return [{label: translate("home.title") ?? "Home", path: "/"}];
    }

    const breadcrumbs: Array<{label: string; path: string}> = [];
    let keyPath = "menus";
    let urlPath = "";

    for (const segment of segments) {
        // Object ids are not navigation: they carry no label and the crumb the
        // user wants there is the entity name, which the page publishes.
        if (/^[0-9a-f]{24}$/i.test(segment)) continue;

        keyPath += `.${segment}`;
        urlPath += `/${segment}`;
        breadcrumbs.push({
            label:
                translate(`${keyPath}.title`) ??
                translate(`common.${segment}`) ??
                humanize(segment),
            path: urlPath,
        });
    }

    return breadcrumbs;
}

/**
 * The trail is route crumbs followed by whatever the page published. Rendered
 * from inside the provider so a page mounting deeper context re-renders only
 * this row rather than the whole shell.
 */
function ShellBreadcrumb() {
    const pageHeader = usePageHeader();
    const crumbs = [...(pageHeader?.routeCrumbs ?? []), ...(pageHeader?.contextCrumbs ?? [])];

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
                                {isLast || !crumb.path ? (
                                    <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                                ) : (
                                    /*
                                     * asChild + router Link, not href: a bare anchor is a full
                                     * document load, which tears down the Redux store and refetches
                                     * every cached view config on what looks like an in-app click.
                                     */
                                    <BreadcrumbLink asChild className="truncate">
                                        <Link to={crumb.path}>{crumb.label}</Link>
                                    </BreadcrumbLink>
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
    const segments = pathname.split('/').filter(Boolean);
    const menu = segments[0];
    const subview = segments[1];

    const routeCrumbs = useMemo(
        () => buildBreadcrumbs(pathname, resolveLanguageKey),
        [pathname, resolveLanguageKey],
    );

    const hideHeader = menu === "company" && subview === "chats" && isMobile && activeChannelId;

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
                                <Search className="size-4" aria-hidden />
                                <KbdGroup className="pointer-events-none">
                                    <Kbd>⌘</Kbd>
                                    <Kbd>K</Kbd>
                                </KbdGroup>
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
                        className={clsx(
                            "mx-auto flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col",
                            resolveCenterPanelClassName({menu, subview, isMobile})
                                ?? (menu === "company" && subview === "chats" && isMobile
                                    ? "overflow-y-auto px-0"
                                    : "overflow-y-auto px-2 pb-2 mt-2"),
                        )}
                    >
                        {renderCenterPanelContent({
                            menu,
                            subview,
                            segments,
                            searchParams,
                            resolveLanguageKey,
                        })}
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