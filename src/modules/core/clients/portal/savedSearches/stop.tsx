import {compose} from "redux";
import {Link, useSearchParams} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Skeleton} from "@coreModule/components/ui/skeleton.tsx";
import {Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle} from "@coreModule/components/ui/empty.tsx";
import type {PortalSavedSearchStopResponse} from "armonia/src/modules/core/api/portal/private/saved/portalSaved.dto.ts";

const STOP_REQUEST = {method: "post" as const, url: "/api/portal/savedSearchAlerts/stop", data: {}};

/**
 * Where the stop link of a saved-search alert lands (D178, P23.7): it turns that search's daily email off at once, no
 * sign-in needed, and says so. The search itself stays in the visitor's Saved tab.
 */
function SavedSearchStopPage({resolveLanguageKey}: WithLanguageType) {
    const [params] = useSearchParams();
    const token = params.get("token") ?? "";
    // Silent: the page itself says when the link does not work.
    const {data, error} = useHttpRequest<PortalSavedSearchStopResponse>(STOP_REQUEST, {token}, token ? 1 : 0);
    const failed = !token || Boolean(error);

    return (
        <Empty className="site-container py-24">
            <EmptyHeader>
                {data ? (
                    <>
                        <EmptyTitle className="font-display text-3xl font-bold tracking-tight">{resolveLanguageKey("stopped")}</EmptyTitle>
                        <EmptyDescription>{resolveLanguageKey("stoppedFor").replace("{label}", data.data.label)}</EmptyDescription>
                    </>
                ) : failed ? (
                    <>
                        <EmptyTitle className="font-display text-3xl font-bold tracking-tight">{resolveLanguageKey("invalid")}</EmptyTitle>
                        <EmptyDescription>{resolveLanguageKey("invalidHint")}</EmptyDescription>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3" aria-busy="true" aria-label={resolveLanguageKey("stopping")}>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                )}
            </EmptyHeader>
            {data || failed ? (
                <EmptyContent>
                    <Button asChild size="lg" className="px-5">
                        <Link to="/account/saved">{resolveLanguageKey("openSaved")}</Link>
                    </Button>
                </EmptyContent>
            ) : null}
        </Empty>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/savedSearches/stop.tsx"))(SavedSearchStopPage);
