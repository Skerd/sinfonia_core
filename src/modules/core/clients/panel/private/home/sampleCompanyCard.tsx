import {useCallback, useEffect, useMemo, useState} from "react";
import {compose} from "redux";
import {useSelector} from "react-redux";
import {IconFlask, IconLoader2, IconX} from "@tabler/icons-react";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import useHttpRequest, {type HttpRequest, type HttpRequestLifecycleFunctions} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {ReloginProvider} from "@coreModule/helpers/context/reloginContext.tsx";
import {useRelogin} from "@coreModule/helpers/hooks/useRelogin.ts";
import {notifyCompanyUpdated} from "@coreModule/clients/panel/private/sidebar/companies/companyUpdatedEvent.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import type {SandboxStateResponse} from "armonia/src/modules/core/api/company/private/sandbox/sandbox.dto.ts";

const STATE_REQUEST: HttpRequest = {method: "get", url: "/api/company/sandbox"};
const CREATE_REQUEST: HttpRequest = {method: "put", url: "/api/company/sandbox"};
const DELETE_REQUEST: HttpRequest = {method: "delete", url: "/api/company/sandbox"};
const NO_BODY = {};
/** How often a sample company being prepared is asked about; the seed takes a minute or more. */
const POLL_MS = 5000;
const OFFER_HIDDEN_PREFIX = "panel_sample_company_offer_hidden_";

function readHidden(key: string): boolean {
    try {
        return localStorage.getItem(key) === "1";
    } catch {
        return false;
    }
}

const CARD_CLASS = "rounded-2xl border bg-card p-5 shadow-sm";

/**
 * "Try with sample data" on the panel home (D178, P23.4), for the company's admins: offers a separate sample company,
 * shows while its demo data is prepared, opens it, and deletes it after a confirmation. Inside the sample company it
 * says so and leads back to the real company. Anyone who is not an admin gets nothing (the server refuses them).
 */
function SampleCompanyCardContent({resolveLanguageKey}: WithLanguageType) {
    const company = useSelector((state: RootState) => state.authentication.user.company);
    const {triggerRelogin, switching} = useRelogin();
    const hideKey = `${OFFER_HIDDEN_PREFIX}${company._id}`;
    const [offerHidden, setOfferHidden] = useState(() => readHidden(hideKey));

    const [stateCount, setStateCount] = useState(1);
    const refresh = useCallback(() => setStateCount((count) => count + 1), []);
    const {data, error} = useHttpRequest<SandboxStateResponse>(STATE_REQUEST, NO_BODY, stateCount);
    const sandbox = data?.sandbox;
    const preparing = sandbox?.status === "preparing";
    useEffect(() => {
        if (!preparing) return;
        const timer = setInterval(refresh, POLL_MS);
        return () => clearInterval(timer);
    }, [preparing, refresh]);

    // A made or deleted company also changes the switcher's list.
    const changed = useCallback(() => {
        refresh();
        notifyCompanyUpdated();
    }, [refresh]);

    const [create, setCreate] = useState({body: {} as Record<string, unknown>, count: 0});
    const createLifecycle = useMemo<HttpRequestLifecycleFunctions<SandboxStateResponse>>(() => ({success: changed}), [changed]);
    const createToasts = useMemo(() => ({resolveLanguageKey: (key: string, orNull?: boolean) => resolveLanguageKey(`create.${key}`, orNull)}), [resolveLanguageKey]);
    const {loading: creating} = useHttpRequest<SandboxStateResponse>(CREATE_REQUEST, create.body, create.count, true, createLifecycle, createToasts);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [remove, setRemove] = useState({body: {} as Record<string, unknown>, count: 0});
    const deleteLifecycle = useMemo<HttpRequestLifecycleFunctions<unknown>>(() => ({
        success: () => {
            setConfirmOpen(false);
            changed();
        },
        error: () => setConfirmOpen(false),
    }), [changed]);
    const deleteToasts = useMemo(() => ({resolveLanguageKey: (key: string, orNull?: boolean) => resolveLanguageKey(`delete.${key}`, orNull)}), [resolveLanguageKey]);
    const {loading: deleting} = useHttpRequest(DELETE_REQUEST, remove.body, remove.count, true, deleteLifecycle, deleteToasts);

    if (error || !data) return null;

    const status = preparing ? (
        <p className="flex items-center gap-2 text-sm" role="status">
            <IconLoader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            <span>{resolveLanguageKey("preparing")}</span>
        </p>
    ) : null;

    // Inside the sample company: what it is, and the way back.
    if (data.parent && sandbox) {
        const parent = data.parent;
        return (
            <section aria-labelledby="sample-company-heading" className={CARD_CLASS}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <IconFlask className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                        <div className="flex min-w-0 flex-col gap-1">
                            <h2 id="sample-company-heading" className="font-semibold">{resolveLanguageKey("inSandbox.title")}</h2>
                            <p className="text-sm text-muted-foreground">{resolveLanguageKey("inSandbox.description")}</p>
                            {status}
                            <p className="text-xs text-muted-foreground">{resolveLanguageKey("inSandbox.deleteHint").replace("{name}", parent.name)}</p>
                        </div>
                    </div>
                    <Button type="button" size="sm" variant="outline" className="shrink-0" disabled={switching} onClick={() => triggerRelogin(parent._id)}>
                        {resolveLanguageKey("inSandbox.back").replace("{name}", parent.name)}
                    </Button>
                </div>
            </section>
        );
    }

    if (!sandbox) {
        if (offerHidden) return null;
        const hide = () => {
            try {
                localStorage.setItem(hideKey, "1");
            } catch {
                // A private window keeps it hidden for this visit only.
            }
            setOfferHidden(true);
        };
        const name = resolveLanguageKey("sampleName").replace("{name}", company.name);
        return (
            <section aria-labelledby="sample-company-heading" className={CARD_CLASS}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <IconFlask className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                        <div className="flex min-w-0 flex-col gap-1">
                            <h2 id="sample-company-heading" className="font-semibold">{resolveLanguageKey("offer.title")}</h2>
                            <p className="text-sm text-muted-foreground">{resolveLanguageKey("offer.description").replace("{name}", name)}</p>
                        </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={hide} aria-label={resolveLanguageKey("offer.hide")} title={resolveLanguageKey("offer.hide")}>
                        <IconX />
                    </Button>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button type="button" size="sm" disabled={creating} onClick={() => setCreate((current) => ({body: {name}, count: current.count + 1}))}>
                        {creating ? <IconLoader2 className="animate-spin" aria-hidden /> : null}
                        {resolveLanguageKey("offer.create")}
                    </Button>
                </div>
            </section>
        );
    }

    return (
        <section aria-labelledby="sample-company-heading" className={CARD_CLASS}>
            <div className="flex items-start gap-3">
                <IconFlask className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h2 id="sample-company-heading" className="truncate font-semibold">{sandbox.name}</h2>
                    {status ?? (
                        <p className="text-sm" role="status">
                            {resolveLanguageKey(sandbox.status === "ready" ? "ready" : "failed")}
                        </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                        {resolveLanguageKey(preparing ? "preparingHint" : sandbox.status === "ready" ? "readyHint" : "failedHint")}
                    </p>
                </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
                {/* The server refuses a delete while the seeders still write. */}
                {preparing ? null : (
                    <Button type="button" size="sm" variant="outline" disabled={deleting} onClick={() => setConfirmOpen(true)}>
                        {resolveLanguageKey("delete.button")}
                    </Button>
                )}
                <Button type="button" size="sm" variant={preparing ? "outline" : "default"} disabled={switching} onClick={() => triggerRelogin(sandbox._id)}>
                    {resolveLanguageKey("open")}
                </Button>
            </div>
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={(open: boolean) => { if (!deleting) setConfirmOpen(open); }}
                title={resolveLanguageKey("delete.confirmTitle").replace("{name}", sandbox.name)}
                desc={resolveLanguageKey("delete.confirmDescription")}
                confirmText={resolveLanguageKey("delete.confirm")}
                destructive
                isLoading={deleting}
                handleConfirm={() => setRemove((current) => ({body: {_id: sandbox._id}, count: current.count + 1}))}
            />
        </section>
    );
}

/** Switching companies needs the relogin context, which the panel keeps inside the sidebar's switcher. */
function SampleCompanyCard(props: WithLanguageType) {
    return (
        <ReloginProvider>
            <SampleCompanyCardContent {...props} />
        </ReloginProvider>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/home/sampleCompanyCard.tsx"),
)(SampleCompanyCard);
