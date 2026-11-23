import {useState} from "react";
import {compose} from "redux";
import {Link} from "react-router-dom";
import {IconTrash} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {requestFromApi} from "@coreModule/helpers/apiClient/requestFromApi.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Skeleton} from "@coreModule/components/ui/skeleton.tsx";
import {Switch} from "@coreModule/components/ui/switch.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle} from "@coreModule/components/ui/empty.tsx";
import type {PortalSavedResponse, PortalSavedSearch, PortalSavedSearchResponse} from "armonia/src/modules/core/api/portal/private/saved/portalSaved.dto.ts";
import CatalogCard from "../home/catalogCard.tsx";
import {savedSearchHref} from "../home/savedSearch.ts";

const SAVED_REQUEST = {method: "post" as const, url: "/api/portal/saved", data: {}};

/** One saved search: its words open it on the home catalog; its daily email can be turned off; it can be deleted. */
function SavedSearchRow({search, onChange, onDelete, resolveLanguageKey}: Pick<WithLanguageType, "resolveLanguageKey"> & {
    search: PortalSavedSearch;
    onChange: (search: PortalSavedSearch) => void;
    onDelete: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const switchId = `saved-search-alerts-${search._id}`;

    const setAlerts = async (alerts: boolean) => {
        setBusy(true);
        try {
            const response = await requestFromApi<PortalSavedSearchResponse>({method: "post", url: "/api/portal/saved/searches/alerts", data: {_id: search._id, alerts}, resolveLanguageKey});
            onChange(response.data);
        } catch {
            // The failure toast is shown; the switch keeps the stored value.
        } finally {
            setBusy(false);
        }
    };
    const remove = async () => {
        setBusy(true);
        try {
            await requestFromApi({method: "delete", url: "/api/portal/saved/searches", data: {_id: search._id}, resolveLanguageKey});
            onDelete();
        } catch {
            setBusy(false);
        }
    };

    return (
        <li className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
            <Link to={savedSearchHref(search)} className="min-w-0 flex-1 font-medium underline-offset-4 hover:underline">
                {search.label}
            </Link>
            <div className="flex items-center gap-2">
                <Switch id={switchId} checked={search.alerts} disabled={busy} onCheckedChange={(checked) => void setAlerts(checked)} />
                <Label htmlFor={switchId} className="font-normal text-muted-foreground">{resolveLanguageKey("dailyEmail")}</Label>
            </div>
            <Button
                variant="ghost"
                size="icon"
                disabled={busy}
                aria-label={String(resolveLanguageKey("deleteSearch")).replace("{label}", search.label)}
                title={String(resolveLanguageKey("deleteSearch")).replace("{label}", search.label)}
                onClick={() => void remove()}
            >
                <IconTrash aria-hidden />
            </Button>
        </li>
    );
}

/**
 * The account's Saved tab (D178, P23.7): the items the visitor hearted, as this site's catalog lists them now, and their
 * saved searches with the daily email of what is new.
 */
function PortalSavedPage({resolveLanguageKey}: WithLanguageType) {
    const {data, loading, error} = useHttpRequest<PortalSavedResponse>(SAVED_REQUEST, {}, 1);
    // Changes made here; the page's answer stays as it was loaded.
    const [searches, setSearches] = useState<PortalSavedSearch[] | null>(null);
    const saved = data?.data;
    const shownSearches = searches ?? saved?.searches ?? [];

    return (
        <div className="flex flex-col gap-12">
            <div>
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{resolveLanguageKey("title")}</h1>
                <p className="mt-3 text-lg text-muted-foreground">{resolveLanguageKey("subtitle")}</p>
            </div>

            <section className="flex flex-col gap-5" aria-labelledby="saved-items">
                <h2 id="saved-items" className="font-display text-2xl font-bold tracking-tight">{resolveLanguageKey("items")}</h2>
                {loading && !saved ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3" aria-busy="true" aria-label={resolveLanguageKey("loading")}>
                        {Array.from({length: 3}, (_, index) => <Skeleton key={index} className="aspect-[4/3] rounded-2xl" />)}
                    </div>
                ) : error && !saved ? (
                    <p className="text-muted-foreground">{resolveLanguageKey("failed")}</p>
                ) : saved && saved.favourites.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3">
                        {saved.favourites.map((item, index) => <CatalogCard key={`${item.section}-${item.id}`} item={item} index={index} />)}
                    </div>
                ) : (
                    <Empty className="rounded-3xl bg-muted py-14">
                        <EmptyHeader>
                            <EmptyTitle className="font-display text-xl font-bold">{resolveLanguageKey("noItems")}</EmptyTitle>
                            <EmptyDescription>{resolveLanguageKey("noItemsHint")}</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button asChild variant="outline" className="bg-background"><Link to="/">{resolveLanguageKey("browse")}</Link></Button>
                        </EmptyContent>
                    </Empty>
                )}
                {saved && saved.unavailable > 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {resolveLanguageKey(saved.unavailable === 1 ? "unavailableOne" : "unavailable").replace("{count}", String(saved.unavailable))}
                    </p>
                ) : null}
            </section>

            <section className="flex flex-col gap-3" aria-labelledby="saved-searches">
                <h2 id="saved-searches" className="font-display text-2xl font-bold tracking-tight">{resolveLanguageKey("searches")}</h2>
                {saved && shownSearches.length > 0 ? (
                    <>
                        <p className="text-sm text-muted-foreground">{resolveLanguageKey("searchesHint")}</p>
                        <ul className="divide-y divide-border border-y">
                            {shownSearches.map((search) => (
                                <SavedSearchRow
                                    key={search._id}
                                    search={search}
                                    resolveLanguageKey={resolveLanguageKey}
                                    onChange={(changed) => setSearches(shownSearches.map((row) => row._id === changed._id ? changed : row))}
                                    onDelete={() => setSearches(shownSearches.filter((row) => row._id !== search._id))}
                                />
                            ))}
                        </ul>
                    </>
                ) : saved ? (
                    <Empty className="rounded-3xl bg-muted py-14">
                        <EmptyHeader>
                            <EmptyTitle className="font-display text-xl font-bold">{resolveLanguageKey("noSearches")}</EmptyTitle>
                            <EmptyDescription>{resolveLanguageKey("noSearchesHint")}</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : null}
            </section>
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/account/saved.tsx"))(PortalSavedPage);
