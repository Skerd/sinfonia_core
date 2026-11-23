import {compose} from "redux";
import {useLayoutEffect, useMemo, useRef, useState} from "react";
import {Link, useNavigate, useSearchParams} from "react-router-dom";
import {toast} from "sonner";
import {IconBellPlus, IconCheck} from "@tabler/icons-react";
import {cn} from "@coreModule/components/lib/utils.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {useDynamicLanguage} from "@coreModule/helpers/hooks/useDynamicLanguage.ts";
import {requestFromApi} from "@coreModule/helpers/apiClient/requestFromApi.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Skeleton} from "@coreModule/components/ui/skeleton.tsx";
import {Tabs, TabsList, TabsTrigger} from "@coreModule/components/ui/tabs.tsx";
import {SlidingIndicator} from "@coreModule/components/ui/sliding-indicator.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@coreModule/components/ui/select.tsx";
import {Empty, EmptyDescription, EmptyHeader, EmptyTitle} from "@coreModule/components/ui/empty.tsx";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@coreModule/components/ui/pagination.tsx";
import type {PortalBrowseResponse} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";
import type {PortalSavedSearchResponse} from "armonia/src/modules/core/api/portal/private/saved/portalSaved.dto.ts";
import {PORTAL_SORTS} from "armonia/src/modules/core/api/portal/public/portal/portalBrowse.form.validator.ts";
import PortalKindName from "../shared/portalKindName.tsx";
import {usePortalSite} from "../shared/portalSiteContext.tsx";
import {SectionBaseProvider} from "../shared/sectionBase.tsx";
import {CATALOG_FILTER_PREFIX, CatalogFilterField, CatalogNumberInput} from "../shared/catalogFilters.tsx";
import {usePortalSaved} from "../shared/portalSaved.tsx";
import CatalogCard from "./catalogCard.tsx";
import type {PortalSection} from "@coreModule/helpers/types/portalContribution.types.ts";
import {BROWSE_REQUEST, CATALOG_PAGE_SIZE, browseForm, landingSearch, isNarrowedSearch} from "./catalogBrowse.ts";
import {isSavableSearch, savedSearchLabel, savedSearchQuery} from "./savedSearch.ts";

const ALL = "all";

/** Keep the chosen kind in the scrolling row without moving the page. */
function revealActiveTab(list: HTMLElement | null) {
    const tab = list?.querySelector<HTMLElement>("[data-state='active']");
    if (!list || !tab) return;
    const start = tab.offsetLeft;
    const end = start + tab.offsetWidth;
    if (start < list.scrollLeft) list.scrollLeft = start;
    else if (end > list.scrollLeft + list.clientWidth) list.scrollLeft = end - list.clientWidth;
}
/** Params that belong to one kind and are dropped when switching kinds. */
const KIND_PARAMS = ["page", "priceMin", "priceMax", "sort"];

/** `busyLabel` marks the grid of skeletons a first load shows. */
function CardGrid({children, busyLabel}: {children: React.ReactNode; busyLabel?: string}) {
    return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4" aria-busy={busyLabel ? true : undefined} aria-label={busyLabel}>
            {children}
        </div>
    );
}

/** The kinds' names ("Cars"), from the one dictionary every page that lists kinds reads. */
export const KIND_NAMES = "src/modules/core/clients/portal/shared/portalKindName.tsx";

/**
 * "Save this search" (D178, P23.7): keeps the search on screen (kind, words, city, price, the kind's filters) in the
 * visitor's Saved tab, with a daily email of what is new. Signed out, it asks them to sign in and brings them back.
 */
function SaveSearchButton({params, resolveLanguageKey}: {params: URLSearchParams; resolveLanguageKey: WithLanguageType["resolveLanguageKey"]}) {
    const {signedIn, signIn} = usePortalSaved();
    const navigate = useNavigate();
    const kindNames = useDynamicLanguage(KIND_NAMES);
    const search = useMemo(() => savedSearchQuery(params), [params]);
    // Saved for this search only: changing the search offers saving the new one.
    const [saved, setSaved] = useState<{search: string; state: "saving" | "saved"} | null>(null);
    const current = params.toString();
    const state = saved?.search === current ? saved.state : "idle";
    if (!isSavableSearch(search)) return null;

    const save = async () => {
        if (!signedIn) {
            signIn();
            return;
        }
        const words = (key: string) => String(resolveLanguageKey(key));
        const kindName = search.kind ? String(kindNames.resolveLanguageKey(`${search.kind}.tab`, true) ?? search.kind) : undefined;
        setSaved({search: current, state: "saving"});
        try {
            await requestFromApi<PortalSavedSearchResponse>({
                method: "put",
                url: "/api/portal/saved/searches",
                data: {...search, label: savedSearchLabel(search, {kindName, resolveLanguageKey: words})},
                resolveLanguageKey,
            });
            setSaved({search: current, state: "saved"});
            toast.success(words("searchSaved"), {action: {label: words("openSaved"), onClick: () => navigate("/account/saved")}});
        } catch {
            setSaved(null);
        }
    };

    return (
        <Button variant="outline" size="lg" className="rounded-full" disabled={state !== "idle"} onClick={() => void save()}>
            {state === "saved" ? <IconCheck aria-hidden /> : <IconBellPlus aria-hidden />}
            {resolveLanguageKey(state === "saved" ? "searchSavedShort" : "saveSearch")}
        </Button>
    );
}

type CatalogProps = WithLanguageType & {
    /** A city landing page (D181): only this section's kinds, all in this city, the first kind while the address names none. */
    landing?: {section: PortalSection; city: string};
};

/** Every kind the host's sections list, as tabs; the chosen kind's filters; its items. */
function Catalog({landing, resolveLanguageKey}: CatalogProps) {
    const {sections} = usePortalSite();
    const [params, setParams] = useSearchParams();
    const search = useMemo(() => landing ? landingSearch(params, landing.section, landing.city) : params, [params, landing]);
    // The visitor's own narrowing: a landing page's city is the page, not a search.
    const narrowed = useMemo(() => isNarrowedSearch(params), [params]);
    const form = useMemo(() => browseForm(search), [search]);
    const catalogs = (landing ? [landing.section] : sections).flatMap((section) => (section.catalogs ?? []).map((catalog) => ({...catalog, path: section.path})));
    const active = catalogs.find((catalog) => catalog.kind === form.kind);
    const kindTabs = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        revealActiveTab(kindTabs.current);
    }, [active?.kind]);

    // One request per URL state, silent: the first load shows skeletons, a failure the empty state. Later loads
    // keep the results on screen (dimmed when the wait is noticeable) until the new ones arrive.
    const [browse, setBrowse] = useState({form, count: 1});
    if (browse.form !== form) setBrowse({form, count: browse.count + 1});
    const {data, loading, error} = useHttpRequest<PortalBrowseResponse>(BROWSE_REQUEST, form, browse.count);
    const groups: PortalBrowseResponse["data"] | null | undefined = error && !loading ? null : data?.data;
    const refreshing = loading && groups !== undefined;

    const update = (change: (next: URLSearchParams) => void) => {
        setParams((current) => {
            const next = new URLSearchParams(current);
            change(next);
            return next;
        });
    };
    const setParam = (key: string, value: string) => update((next) => {
        if (value) next.set(key, value); else next.delete(key);
        if (key !== "page") next.delete("page");
    });

    if (catalogs.length === 0) return null;
    // Choosing a kind is a link a search engine follows too: the same address the tab used to write (D181).
    const defaultKind = landing ? catalogs[0].kind : ALL;
    const kindHref = (kind: string) => {
        const next = new URLSearchParams(params);
        [...next.keys()].filter((key) => key.startsWith(CATALOG_FILTER_PREFIX) || KIND_PARAMS.includes(key)).forEach((key) => next.delete(key));
        if (kind === defaultKind) next.delete("kind"); else next.set("kind", kind);
        return `?${next}`;
    };
    const tabs = [
        ...(landing ? [] : [{kind: ALL, label: resolveLanguageKey("all")}]),
        ...catalogs.map((catalog) => ({kind: catalog.kind, label: <PortalKindName kind={catalog.kind} />})),
    ];
    const page = form.page ?? 1;
    const group = active ? groups?.find((candidate) => candidate.kind === active.kind) : undefined;
    const pageCount = group ? Math.ceil(group.total / CATALOG_PAGE_SIZE) : 0;
    const pageHref = (target: number) => {
        const next = new URLSearchParams(params);
        next.set("page", String(target));
        return `?${next}`;
    };
    const goTo = (target: number) => (event: React.MouseEvent) => {
        event.preventDefault();
        setParam("page", String(target));
    };

    return (
        <section className="flex flex-col gap-6" aria-label={resolveLanguageKey("label")}>
            {/* Each tab is a link (the address holds the kind); arrow keys move between them, Enter follows one. One kind needs no tabs. */}
            {tabs.length > 1 ? (
                <Tabs value={active?.kind ?? ALL} activationMode="manual">
                    <TabsList ref={kindTabs} className="relative h-8 w-full min-w-0 max-w-full justify-start overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-fit">
                        {/* The chosen kind's highlight slides from tab to tab. */}
                        <SlidingIndicator activeKey={active?.kind ?? ALL} className="rounded-md bg-background shadow-sm dark:border dark:border-input dark:bg-input/30" />
                        {tabs.map(({kind, label}) => (
                            <TabsTrigger
                                key={kind}
                                value={kind}
                                asChild
                                data-indicator-active={(active?.kind ?? ALL) === kind ? "" : undefined}
                                className="flex-none px-3 data-active:bg-transparent group-data-[variant=default]/tabs-list:data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-transparent"
                            >
                                <Link to={kindHref(kind)}>{label}</Link>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            ) : null}

            {active?.Intro ? <SectionBaseProvider base={`/${active.path}`}><active.Intro /></SectionBaseProvider> : null}

            {active ? (
                <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4">
                    {active.Filters ? <active.Filters /> : null}
                    {(["priceMin", "priceMax"] as const).map((key) => (
                        <CatalogFilterField key={key} label={resolveLanguageKey(key)}>
                            {(id) => <CatalogNumberInput id={id} value={params.get(key) ?? ""} onCommit={(value) => setParam(key, value)} />}
                        </CatalogFilterField>
                    ))}
                    <CatalogFilterField label={resolveLanguageKey("sort")}>
                        {(id) => (
                            <Select value={form.sort ?? "newest"} onValueChange={(sort) => setParam("sort", sort === "newest" ? "" : sort)}>
                                <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {PORTAL_SORTS.map((sort) => <SelectItem key={sort} value={sort}>{resolveLanguageKey(`sorts.${sort}`)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    </CatalogFilterField>
                </div>
            ) : null}

            <div className="flex justify-end empty:hidden">
                <SaveSearchButton params={search} resolveLanguageKey={resolveLanguageKey} />
            </div>

            {groups === undefined ? (
                <CardGrid busyLabel={resolveLanguageKey("loading")}>
                    {Array.from({length: 8}, (_, index) => (
                        <div key={index} className="flex flex-col gap-3">
                            <Skeleton className="aspect-[4/3] rounded-2xl" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    ))}
                </CardGrid>
            ) : !groups || groups.every((candidate) => candidate.items.length === 0) ? (
                <Empty className="rounded-3xl bg-muted py-20">
                    <EmptyHeader>
                        <EmptyTitle className="font-display text-2xl font-bold">{resolveLanguageKey(!groups ? "failed" : narrowed ? "noResults" : "nothingYet")}</EmptyTitle>
                        {groups ? <EmptyDescription>{resolveLanguageKey(narrowed ? "noResultsHint" : "nothingYetHint")}</EmptyDescription> : null}
                    </EmptyHeader>
                </Empty>
            ) : group ? (
                <div className={cn("flex flex-col gap-8 transition-opacity", refreshing && "opacity-50")} aria-busy={refreshing} aria-label={refreshing ? resolveLanguageKey("loading") : undefined}>
                    <p className="text-sm text-muted-foreground">{resolveLanguageKey("results").replace("{count}", String(group.total))}</p>
                    <CardGrid>{group.items.map((item, index) => <CatalogCard key={`${item.section}-${item.id}`} item={item} index={index} />)}</CardGrid>
                    {pageCount > 1 ? (
                        <Pagination>
                            <PaginationContent>
                                {page > 1 ? (
                                    <PaginationItem>
                                        <PaginationPrevious text={resolveLanguageKey("previous")} href={pageHref(page - 1)} onClick={goTo(page - 1)} />
                                    </PaginationItem>
                                ) : null}
                                {Array.from({length: pageCount}, (_, index) => index + 1)
                                    .filter((target) => Math.abs(target - page) <= 2 || target === 1 || target === pageCount)
                                    .map((target) => (
                                        <PaginationItem key={target}>
                                            <PaginationLink isActive={target === page} href={pageHref(target)} onClick={goTo(target)}>{target}</PaginationLink>
                                        </PaginationItem>
                                    ))}
                                {page < pageCount ? (
                                    <PaginationItem>
                                        <PaginationNext text={resolveLanguageKey("next")} href={pageHref(page + 1)} onClick={goTo(page + 1)} />
                                    </PaginationItem>
                                ) : null}
                            </PaginationContent>
                        </Pagination>
                    ) : null}
                </div>
            ) : (
                <div className={cn("flex flex-col gap-14 transition-opacity", refreshing && "opacity-50")} aria-busy={refreshing} aria-label={refreshing ? resolveLanguageKey("loading") : undefined}>
                    {catalogs.map((catalog) => {
                        const rail = groups.find((candidate) => candidate.kind === catalog.kind);
                        if (!rail?.items.length) return null;
                        return (
                            <div key={catalog.kind} className="flex flex-col gap-5">
                                <div className="flex items-baseline justify-between gap-4">
                                    <h2 className="font-display text-2xl font-bold tracking-tight"><PortalKindName kind={catalog.kind} /></h2>
                                    <Button asChild variant="link" className="h-auto p-0">
                                        <Link to={kindHref(catalog.kind)}>{resolveLanguageKey("seeAll").replace("{count}", String(rail.total))}</Link>
                                    </Button>
                                </div>
                                <CardGrid>{rail.items.map((item, index) => <CatalogCard key={`${item.section}-${item.id}`} item={item} index={index} />)}</CardGrid>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/home/catalog.tsx"))(Catalog);
