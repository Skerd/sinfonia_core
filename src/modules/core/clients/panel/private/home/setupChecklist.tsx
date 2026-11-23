import {useEffect, useMemo, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useSelector} from "react-redux";
import {IconCircle, IconCircleCheckFilled, IconX} from "@tabler/icons-react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {useAccessHydrated, useAccessMap} from "@coreModule/helpers/context/accessContext.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {getHomeSetupSteps} from "@coreModule/helpers/moduleContributions/loadHomeContributions.ts";
import type {HomeSetupStep} from "@coreModule/helpers/types/homeContribution.types.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@coreModule/components/ui/dialog.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {canDoStep, type SetupAccessMap} from "./setupStepStatus.ts";
import {useGuide} from "./guide/guideContext.tsx";

const COMPANY_REQUEST: HttpRequest = {method: "get", url: "/api/company"};
const DISMISS_PREFIX = "panel_setup_checklist_hidden_";
/** The welcome of the guided first run (D179), once per person and company. */
const WELCOME_PREFIX = "panel_guide_welcome_seen_";

function readFlag(key: string): boolean {
    try {
        return localStorage.getItem(key) === "1";
    } catch {
        return false;
    }
}

function writeFlag(key: string): void {
    try {
        localStorage.setItem(key, "1");
    } catch {
        // A private window remembers it for this visit only.
    }
}

/** One list step: asks its list for a row (or `minTotal` rows) and reports whether it is done. */
function ListStepCheck({url, minTotal, params, onDone}: {url: string; minTotal: number; params?: Record<string, unknown>; onDone: (done: boolean) => void}) {
    const request = useMemo<HttpRequest>(() => ({method: "post", url}), [url]);
    const body = useMemo(() => ({...params, offset: 0, limit: 1}), [params]);
    const {data} = useHttpRequest<{total?: number}>(request, body, 1);
    useEffect(() => {
        if (data) onDone((data.total ?? 0) >= minTotal);
    }, [data, minTotal, onDone]);
    return null;
}

/**
 * The checklist a new company works through on the panel home (D178): each module's steps (plus core's), shown to
 * whoever may do them, until every step is done or the viewer hides it for this company.
 */
export default function SetupChecklist({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}) {
    const companyId = useSelector((state: RootState) => state.authentication.user.company._id);
    const companyName = useSelector((state: RootState) => state.authentication.user.company.name);
    const userId = useSelector((state: RootState) => state.authentication.user.id);
    const accessMap = useAccessMap() as SetupAccessMap;
    const accessHydrated = useAccessHydrated();
    const {startStep} = useGuide();
    const navigate = useNavigate();
    const hideKey = `${DISMISS_PREFIX}${companyId}`;
    const welcomeKey = `${WELCOME_PREFIX}${companyId}_${userId}`;
    const [hidden, setHidden] = useState(() => readFlag(hideKey));
    const [welcomed, setWelcomed] = useState(() => readFlag(welcomeKey));
    const [done, setDone] = useState<Record<string, boolean>>({});

    const steps = useMemo(
        () => accessHydrated
            ? getHomeSetupSteps({resolveLanguageKey, company: {id: companyId, name: companyName}}).filter((step) => canDoStep(step, accessMap))
            : [],
        [resolveLanguageKey, accessMap, accessHydrated, companyId, companyName],
    );
    const companySteps = steps.filter((step) => "company" in step.doneWhen);
    // `GET /api/company` answers the company itself, with no `data` wrapper.
    const company = useHttpRequest<Record<string, unknown>>(COMPANY_REQUEST, {}, companySteps.length > 0 ? 1 : 0);
    const companyData = company.data ?? undefined;

    // One stable reporter per step, so a step's check does not run again on every render.
    const reporters = useMemo(
        () => Object.fromEntries(steps.map((step) => [step.key, (value: boolean) => setDone((current) => current[step.key] === value ? current : {...current, [step.key]: value})])),
        [steps],
    );

    const isDone = (step: HomeSetupStep): boolean | undefined =>
        "company" in step.doneWhen ? (companyData ? step.doneWhen.company(companyData) : undefined) : done[step.key];
    const known = steps.filter((step) => isDone(step) !== undefined);
    const doneCount = steps.filter((step) => isDone(step) === true).length;

    if (hidden || steps.length === 0) return null;
    // Nothing to show once every step answered done; wait for the answers before showing anything.
    const allAnswered = known.length === steps.length;
    if (allAnswered && doneCount === steps.length) return null;

    function hide() {
        writeFlag(hideKey);
        setHidden(true);
    }

    const openSteps = steps.filter((step) => isDone(step) === false);
    const closeWelcome = () => {
        writeFlag(welcomeKey);
        setWelcomed(true);
    };
    /** A step's run starts with its page: its tips there, then a card offering the next step once it is saved (D179). */
    const begin = (step: HomeSetupStep) => {
        startStep(step.key);
        navigate(step.to);
    };

    return (
        <section
            aria-labelledby="setup-checklist-heading"
            className={cn("rounded-2xl border bg-card p-5 shadow-sm", !allAnswered && "sr-only")}
        >
            {steps.map((step) => "list" in step.doneWhen ? (
                <ListStepCheck key={step.key} url={step.doneWhen.list.url} minTotal={step.doneWhen.list.minTotal ?? 1} params={step.doneWhen.list.params} onDone={reporters[step.key]} />
            ) : null)}
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h2 id="setup-checklist-heading" className="font-semibold">{resolveLanguageKey("home.setup.title")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {resolveLanguageKey("home.setup.progress").replace("{done}", String(doneCount)).replace("{total}", String(steps.length))}
                    </p>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={hide} aria-label={resolveLanguageKey("home.setup.hide")} title={resolveLanguageKey("home.setup.hide")}>
                    <IconX />
                </Button>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{width: `${(doneCount / steps.length) * 100}%`}} />
            </div>
            <ol className="mt-4 flex flex-col divide-y">
                {steps.map((step) => {
                    const stepDone = isDone(step) === true;
                    return (
                        <li key={step.key} className="flex items-center gap-3 py-2.5">
                            {stepDone
                                ? <IconCircleCheckFilled className="size-5 shrink-0 text-success" aria-label={resolveLanguageKey("home.setup.done")} />
                                : <IconCircle className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
                            <div className="flex min-w-0 flex-1 flex-col">
                                <span className={cn("text-sm font-medium", stepDone && "text-muted-foreground line-through")}>{step.title}</span>
                                {step.description && !stepDone ? <span className="text-xs text-muted-foreground">{step.description}</span> : null}
                            </div>
                            {stepDone ? null : (
                                <Button asChild size="sm" variant="outline">
                                    <Link to={step.to} onClick={() => startStep(step.key)}>{resolveLanguageKey("home.setup.start")}</Link>
                                </Button>
                            )}
                        </li>
                    );
                })}
            </ol>
            {/* For a business with most of its setup ahead; an established one with a step left gets no welcome. */}
            <Dialog open={allAnswered && openSteps.length >= Math.ceil(steps.length / 2) && !welcomed} onOpenChange={(open) => (open ? undefined : closeWelcome())}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{resolveLanguageKey("home.guide.welcomeTitle").replace("{company}", companyName)}</DialogTitle>
                        <DialogDescription>
                            {resolveLanguageKey("home.guide.welcomeText").replace("{company}", companyName)}
                        </DialogDescription>
                    </DialogHeader>
                    <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm">
                        {openSteps.map((step) => <li key={step.key}>{step.title}</li>)}
                    </ol>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={closeWelcome}>{resolveLanguageKey("home.guide.later")}</Button>
                        <Button type="button" onClick={() => {
                            closeWelcome();
                            begin(openSteps[0]);
                        }}>
                            {resolveLanguageKey("home.guide.welcomeStart")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}
