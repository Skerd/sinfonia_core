import {compose} from "redux";
import {useEffect, useMemo, useState} from "react";
import {useSearchParams} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Skeleton} from "@coreModule/components/ui/skeleton.tsx";
import {Tabs, TabsList, TabsTrigger} from "@coreModule/components/ui/tabs.tsx";
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
import {
    PORTAL_SORTS,
    type PortalBrowseFilters,
    type PortalBrowseFormType,
} from "armonia/src/modules/core/api/portal/public/portal/portalBrowse.form.validator.ts";
import PortalKindName from "../shared/portalKindName.tsx";
import {usePortalSite} from "../shared/portalSiteContext.tsx";
import {SectionBaseProvider} from "../shared/sectionBase.tsx";
import {CATALOG_FILTER_PREFIX, CatalogFilterField, CatalogNumberInput} from "../shared/catalogFilters.tsx";
import CatalogCard from "./catalogCard.tsx";

const PAGE_SIZE = 24;
const ALL = "all";
/** Params that belong to one kind and are dropped when switching kinds. */
const KIND_PARAMS = ["page", "priceMin", "priceMax", "sort"];

function numberParam(params: URLSearchParams, key: string): number | undefined {
    const value = Number(params.get(key));
    return params.get(key) && Number.isFinite(value) ? value : undefined;
}

/** The browse request the URL describes. */
function browseForm(params: URLSearchParams): PortalBrowseFormType {
    const filters: PortalBrowseFilters = {};
    params.forEach((value, key) => {
        if (key.startsWith(CATALOG_FILTER_PREFIX)) filters[key.slice(CATALOG_FILTER_PREFIX.length)] = value;
    });
    return {
        kind: params.get("kind") || undefined,
        query: params.get("q") || undefined,
        city: params.get("city") || undefined,
        priceMin: numberParam(params, "priceMin"),
        priceMax: numberParam(params, "priceMax"),
        sort: PORTAL_SORTS.find((sort) => sort === params.get("sort")),
        page: numberParam(params, "page"),
        limit: PAGE_SIZE,
        filters,
    };
}

function CardGrid({children}: {children: React.ReactNode}) {
    return <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">{children}</div>;
}

/** Every kind the host's sections list, as tabs; the chosen kind's filters; its items. */
function Catalog({resolveLanguageKey}: WithLanguageType) {
    const {sections} = usePortalSite();
    const [params, setParams] = useSearchParams();
    const form = useMemo(() => browseForm(params), [params]);
    const [groups, setGroups] = useState<PortalBrowseResponse["data"] | null | undefined>(undefined);
    const catalogs = sections.flatMap((section) => (section.catalogs ?? []).map((catalog) => ({...catalog, path: section.path})));
    const active = catalogs.find((catalog) => catalog.kind === form.kind);

    useEffect(() => {
        let cancelled = false;
        setGroups(undefined);
        apiClient.post<PortalBrowseResponse>("/api/portal/browse", form)
            .then((res) => { if (!cancelled) setGroups(res.data.data); })
            .catch(() => { if (!cancelled) setGroups(null); });
        return () => { cancelled = true; };
    }, [form]);

    const update = (change: (next: URLSearchParams) => void) => {
        setParams((current) => {
            const next = new URLSearchParams(current);
            change(next);
            return next;
        });
    };
    const selectKind = (kind: string) => update((next) => {
        [...next.keys()].filter((key) => key.startsWith(CATALOG_FILTER_PREFIX) || KIND_PARAMS.includes(key)).forEach((key) => next.delete(key));
        if (kind === ALL) next.delete("kind"); else next.set("kind", kind);
    });
    const setParam = (key: string, value: string) => update((next) => {
        if (value) next.set(key, value); else next.delete(key);
        if (key !== "page") next.delete("page");
    });

    if (catalogs.length === 0) return null;
    const page = form.page ?? 1;
    const group = active ? groups?.find((candidate) => candidate.kind === active.kind) : undefined;
    const pageCount = group ? Math.ceil(group.total / PAGE_SIZE) : 0;
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
            <Tabs value={active?.kind ?? ALL} onValueChange={selectKind}>
                <TabsList className="h-auto flex-wrap justify-start">
                    <TabsTrigger value={ALL} className="flex-none px-3">{resolveLanguageKey("all")}</TabsTrigger>
                    {catalogs.map((catalog) => (
                        <TabsTrigger key={catalog.kind} value={catalog.kind} className="flex-none px-3">
                            <PortalKindName kind={catalog.kind} />
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

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

            {groups === undefined ? (
                <CardGrid>
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
                        <EmptyTitle className="font-display text-2xl font-bold">{resolveLanguageKey(groups ? "noResults" : "failed")}</EmptyTitle>
                        {groups ? <EmptyDescription>{resolveLanguageKey("noResultsHint")}</EmptyDescription> : null}
                    </EmptyHeader>
                </Empty>
            ) : group ? (
                <div className="flex flex-col gap-8">
                    <p className="text-sm text-muted-foreground">{resolveLanguageKey("results").replace("{count}", String(group.total))}</p>
                    <CardGrid>{group.items.map((item) => <CatalogCard key={`${item.section}-${item.id}`} item={item} />)}</CardGrid>
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
                <div className="flex flex-col gap-14">
                    {catalogs.map((catalog) => {
                        const rail = groups.find((candidate) => candidate.kind === catalog.kind);
                        if (!rail?.items.length) return null;
                        return (
                            <div key={catalog.kind} className="flex flex-col gap-5">
                                <div className="flex items-baseline justify-between gap-4">
                                    <h2 className="font-display text-2xl font-bold tracking-tight"><PortalKindName kind={catalog.kind} /></h2>
                                    <Button variant="link" className="h-auto p-0" onClick={() => selectKind(catalog.kind)}>
                                        {resolveLanguageKey("seeAll").replace("{count}", String(rail.total))}
                                    </Button>
                                </div>
                                <CardGrid>{rail.items.map((item) => <CatalogCard key={`${item.section}-${item.id}`} item={item} />)}</CardGrid>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/home/catalog.tsx"))(Catalog);
