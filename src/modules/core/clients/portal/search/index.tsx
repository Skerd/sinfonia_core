import {compose} from "redux";
import {useEffect, useState} from "react";
import {Link, useSearchParams} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {PortalSearchResponse} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";
import PortalSearchForm from "../shared/portalSearchForm.tsx";
import PortalSectionName from "../shared/portalSectionName.tsx";
import {PORTAL_CARD, PORTAL_CONTAINER, PORTAL_HEADING} from "../shared/portalStyles.ts";

/** Everything matching "what" and "where", grouped by section. */
function PortalSearchPage({resolveLanguageKey}: WithLanguageType) {
    const [params] = useSearchParams();
    const query = params.get("q") ?? "";
    const city = params.get("city") ?? "";
    const [groups, setGroups] = useState<PortalSearchResponse["data"] | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setGroups(null);
        setFailed(false);
        apiClient.post<PortalSearchResponse>("/api/portal/search", {query, city})
            .then((res) => { if (!cancelled) setGroups(res.data.data); })
            .catch(() => { if (!cancelled) setFailed(true); });
        return () => { cancelled = true; };
    }, [query, city]);

    return (
        <div className={cn(PORTAL_CONTAINER, "flex flex-col gap-8 py-10")}>
            <div className={PORTAL_CARD}>
                <PortalSearchForm key={`${query}|${city}`} initialQuery={query} initialCity={city} />
            </div>
            {failed ? (
                <p className="text-portal-danger">{resolveLanguageKey("failed")}</p>
            ) : groups === null ? (
                <Loader />
            ) : groups.length === 0 ? (
                <p className="text-portal-ink-muted">{resolveLanguageKey("noResults")}</p>
            ) : (
                groups.map((group) => (
                    <section key={group.key} className="flex flex-col gap-3">
                        <h2 className={cn(PORTAL_HEADING, "text-xl")}><PortalSectionName section={group.key} /></h2>
                        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {group.items.map((item) => (
                                <li key={`${item.kind}:${item.path}:${item.title}`}>
                                    <Link to={item.path} className={cn(PORTAL_CARD, "flex h-full items-center gap-4 p-4 transition hover:border-portal-accent sm:p-4")}>
                                        {item.image ? (
                                            <img src={item.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" loading="lazy" />
                                        ) : (
                                            <div className="h-16 w-16 shrink-0 rounded-xl bg-portal-accent-soft" aria-hidden />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium uppercase tracking-wide text-portal-ink-faded">
                                                {resolveLanguageKey(`kinds.${item.kind}`, true) ?? item.kind}
                                            </p>
                                            <p className="truncate font-semibold">{item.title}</p>
                                            {item.subtitle ? <p className="truncate text-sm text-portal-ink-muted">{item.subtitle}</p> : null}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))
            )}
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/search/index.tsx"))(PortalSearchPage);
