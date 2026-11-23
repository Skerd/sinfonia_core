import {useEffect, useId, useMemo, useRef, useState, type ReactNode} from "react";
import {compose} from "redux";
import {useLocation, useNavigate} from "react-router-dom";
import {IconCircleCheckFilled, IconCircleDashed} from "@tabler/icons-react";
import {useSelector} from "react-redux";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {useAccessHydrated, useAccessMap} from "@coreModule/helpers/context/accessContext.tsx";
import {useIsMobile} from "@coreModule/helpers/hooks/useMobile.tsx";
import {getHomeSetupSteps, getHomeTour} from "@coreModule/helpers/moduleContributions/loadHomeContributions.ts";
import type {HomeGuideTip, HomeTourStop, HomeTourTip} from "@coreModule/helpers/types/homeContribution.types.ts";
import {pageHelpOf, type PageHelpSection} from "@coreModule/components/custom/pageHelp.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Popover, PopoverAnchor, PopoverContent} from "@coreModule/components/ui/popover.tsx";
import {canDoStep, canSeeTourStop, isStepDone, nextOpenStep, type SetupAccessMap} from "../setupStepStatus.ts";
import {useGuide} from "./guideContext.tsx";
import {isOnPage} from "./guideRun.ts";

/** How long a tip waits for its element (a page still loading) before it is skipped. */
const TARGET_WAIT_MS = 4000;
/** The sidebar is there at once or not at all (a phone keeps it closed): no long wait for its links and menus. */
const NAV_TARGET_WAIT_MS = 600;
const isSidebarTarget = (target: string) => target.startsWith("nav:") || target.startsWith("sidebar.");
const TARGET_POLL_MS = 150;
/** The outline on the element a tip points at; a class list, so the person can still click and type in it. */
const HIGHLIGHT = ["ring-2", "ring-primary", "ring-offset-2", "ring-offset-background", "rounded-md"];

function findTarget(target: string): HTMLElement | null {
    const element = document.querySelector<HTMLElement>(`[data-tour="${CSS.escape(target)}"]`);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    // A collapsed sidebar group or a hidden tab: not there for the person either.
    return rect.width > 0 && rect.height > 0 ? element : null;
}

/** The element a tip points at, once the page shows it; `missing` when it never does. */
function useGuideTarget(target: string | undefined, pageKey: string): {element: HTMLElement | null; missing: boolean} {
    const [found, setFound] = useState<{key: string; element: HTMLElement | null; missing: boolean}>({key: "", element: null, missing: false});
    const key = `${pageKey}|${target ?? ""}`;

    useEffect(() => {
        if (!target) return;
        const startedAt = Date.now();
        const wait = isSidebarTarget(target) ? NAV_TARGET_WAIT_MS : TARGET_WAIT_MS;
        const timer = window.setInterval(() => {
            const element = findTarget(target);
            if (element) {
                window.clearInterval(timer);
                element.scrollIntoView({block: "center", behavior: "smooth"});
                setFound({key, element, missing: false});
            } else if (Date.now() - startedAt > wait) {
                window.clearInterval(timer);
                setFound({key, element: null, missing: true});
            }
        }, TARGET_POLL_MS);
        return () => window.clearInterval(timer);
    }, [target, key]);

    useEffect(() => {
        const element = found.key === key ? found.element : null;
        if (!element) return;
        element.classList.add(...HIGHLIGHT);
        return () => element.classList.remove(...HIGHLIGHT);
    }, [found, key]);

    return found.key === key ? {element: found.element, missing: found.missing} : {element: null, missing: false};
}

/** A tour stop ready to show: a page stop (D180) becomes a tip at its page's ⓘ, worded by that help. */
type TourTip = HomeTourTip & {explainsPage?: boolean};

function toTourTip(stop: HomeTourStop): TourTip {
    return "page" in stop
        ? {target: "page.help", to: stop.page, accessModel: stop.accessModel, title: "", text: "", explainsPage: true}
        : stop;
}

type TipCardProps = {
    tip: HomeGuideTip;
    /** A page's help points under the text (D180): the same sections its ⓘ opens. */
    points?: PageHelpSection[];
    element: HTMLElement;
    index: number;
    total: number;
    onBack: () => void;
    onNext: () => void;
    onSkip: () => void;
    nextLabel: string;
    resolveLanguageKey: WithLanguageType["resolveLanguageKey"];
};

/** One tip beside its element. It stays open while the person works in the page; Escape ends the guide. */
function TipCard({tip, points = [], element, index, total, onBack, onNext, onSkip, nextLabel, resolveLanguageKey: t}: TipCardProps) {
    const titleId = useId();
    const anchor = useMemo(() => ({current: element}), [element]);
    const sideways = isSidebarTarget(element.getAttribute("data-tour") ?? "");

    return (
        <Popover open>
            <PopoverAnchor virtualRef={anchor} />
            <PopoverContent
                side={sideways ? "right" : "bottom"}
                align="start"
                sideOffset={10}
                collisionPadding={12}
                className={cn("gap-3 p-4", points.length > 0 ? "w-[26rem] max-w-[calc(100vw-1.5rem)]" : "w-80")}
                aria-labelledby={titleId}
                onOpenAutoFocus={(event) => event.preventDefault()}
                onInteractOutside={(event) => event.preventDefault()}
                onEscapeKeyDown={onSkip}
            >
                <div className="flex flex-col gap-1" aria-live="polite">
                    <h2 id={titleId} className="font-semibold">{tip.title}</h2>
                    <p className="text-sm text-muted-foreground">{tip.text}</p>
                </div>
                {points.length > 0 ? (
                    <div className="flex max-h-[min(22rem,45vh)] flex-col gap-3 overflow-y-auto pr-1">
                        {points.map((section, sectionIndex) => (
                            <section key={sectionIndex} className="flex flex-col gap-1">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</h3>
                                {section.body ? <p className="text-sm text-muted-foreground">{section.body}</p> : null}
                                {section.items.length > 0 ? (
                                    <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-muted-foreground">
                                        {section.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                                    </ul>
                                ) : null}
                            </section>
                        ))}
                    </div>
                ) : null}
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                        {t("home.guide.counter").replace("{current}", String(index + 1)).replace("{total}", String(total))}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {index > 0 ? <Button type="button" size="sm" variant="ghost" onClick={onBack}>{t("home.guide.back")}</Button> : null}
                        <Button type="button" size="sm" onClick={onNext}>{nextLabel}</Button>
                    </div>
                </div>
                <Button type="button" variant="link" size="sm" className="h-auto self-start p-0 text-xs text-muted-foreground" onClick={onSkip}>
                    {t("home.guide.skip")}
                </Button>
            </PopoverContent>
        </Popover>
    );
}

/** A card in the corner, for what sits on no one element: a step just done, or setup complete. */
function CornerCard({title, text, finished = true, children}: {title: string; text: string; finished?: boolean; children: ReactNode}) {
    const titleId = useId();
    return (
        <div
            role="dialog"
            aria-labelledby={titleId}
            // Top right, under the header: the bottom corner is where the panel's notifications ("Location added") show.
            className="fixed inset-x-4 top-16 z-50 flex flex-col gap-3 rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg sm:inset-x-auto sm:right-6 sm:w-80"
        >
            <div className="flex items-start gap-2.5" aria-live="polite">
                {finished
                    ? <IconCircleCheckFilled className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                    : <IconCircleDashed className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />}
                <div className="flex flex-col gap-1">
                    <h2 id={titleId} className="font-semibold">{title}</h2>
                    <p className="text-sm text-muted-foreground">{text}</p>
                </div>
            </div>
            <div className="flex justify-end gap-2">{children}</div>
        </div>
    );
}

/**
 * The guided first run (D179), on every private panel page: a setup step's tips on its page, a card when the step is
 * done (with the next open one), and the tour of the modules' pages, each explained by its own help (D180), ending at
 * the page help.
 */
function GuideRunner({resolveLanguageKey: t}: WithLanguageType) {
    const {run, setRun, startStep, startTour, end} = useGuide();
    const {pathname} = useLocation();
    // Read by the tour's page opening without re-running it on every move (it would chase its own navigation).
    const pathnameRef = useRef(pathname);
    pathnameRef.current = pathname;
    const navigate = useNavigate();
    const accessMap = useAccessMap() as SetupAccessMap;
    const accessHydrated = useAccessHydrated();
    // A phone keeps the sidebar closed: its tour stops are left out, so the count matches what the person sees.
    const isMobile = useIsMobile();
    const companyId = useSelector((state: RootState) => state.authentication.user.company._id);
    const companyName = useSelector((state: RootState) => state.authentication.user.company.name);

    const steps = useMemo(
        () => accessHydrated
            ? getHomeSetupSteps({resolveLanguageKey: t, company: {id: companyId, name: companyName}}).filter((step) => canDoStep(step, accessMap))
            : [],
        [t, accessMap, accessHydrated, companyId, companyName],
    );
    const stops = useMemo<TourTip[]>(() => {
        if (!accessHydrated) return [];
        const moduleStops = getHomeTour({resolveLanguageKey: t, company: {id: companyId, name: companyName}})
            .filter((stop) => canSeeTourStop(stop, accessMap))
            .map(toTourTip)
            .filter((stop) => !(isMobile && isSidebarTarget(stop.target)));
        if (moduleStops.length === 0) return [];
        // The tour ends at the page help, on the last page it named.
        const last = moduleStops[moduleStops.length - 1];
        const lastPage = last.to ?? (last.target.startsWith("nav:") ? last.target.slice(4) : undefined);
        return [...moduleStops, {target: "page.help", to: lastPage, title: t("home.guide.helpTitle"), text: t("home.guide.helpText")}];
    }, [t, accessMap, accessHydrated, companyId, companyName, isMobile]);

    const step = run && run.kind !== "tour" ? steps.find((entry) => entry.key === run.stepKey) : undefined;
    const onStepPage = run?.kind === "step" && step ? isOnPage(pathname, step.to) : false;
    const tips = step?.guide ?? [];
    const stepTip = run?.kind === "step" && onStepPage && run.tip < tips.length ? tips[run.tip] : undefined;
    const stop = run?.kind === "tour" ? stops[run.stop] : undefined;
    const tip: HomeGuideTip | undefined = stepTip ?? stop;
    // A stop with its own page is looked for there only: the page being left may still show its own ⓘ.
    const awaitingPage = run?.kind === "tour" && !!stop?.to && !isOnPage(pathname, stop.to);
    const {element, missing} = useGuideTarget(
        awaitingPage ? undefined : tip?.target,
        `${pathname}|${run?.kind === "step" ? run.tip : run?.kind === "tour" ? run.stop : ""}`,
    );

    // A run whose step or stop is gone (no access, another company's checklist) ends.
    useEffect(() => {
        if (!run || !accessHydrated) return;
        if (run.kind !== "tour" && !step) end();
        if (run.kind === "tour" && !stop) end();
    }, [run, accessHydrated, step, stop, end]);

    // A step: its page reached, then left. Leaving asks whether the step is now done (saved), and offers the next one.
    useEffect(() => {
        if (run?.kind !== "step" || !step) return;
        if (onStepPage && !run.seenPage) {
            setRun({...run, seenPage: true});
            return;
        }
        if (onStepPage || !run.seenPage) return;
        let cancelled = false;
        void (async () => {
            const finished = await isStepDone(step).catch(() => false);
            if (cancelled) return;
            const next = await nextOpenStep(steps, step.key);
            if (cancelled) return;
            // Left unfinished with nothing else open: nothing to offer.
            if (!finished && !next) end();
            else setRun({kind: "done", companyId: run.companyId, stepKey: step.key, finished, nextKey: next?.key});
        })();
        return () => {
            cancelled = true;
        };
    }, [run, step, steps, onStepPage, setRun, end]);

    // A tour stop with its own page opens it.
    useEffect(() => {
        if (run?.kind === "tour" && stop?.to && !isOnPage(pathnameRef.current, stop.to)) navigate(stop.to);
    }, [run, stop, navigate]);

    // A tip whose element never shows is skipped.
    useEffect(() => {
        if (!missing || !run) return;
        if (run.kind === "step") setRun({...run, tip: run.tip + 1});
        else if (run.kind === "tour") setRun({...run, stop: run.stop + 1});
    }, [missing, run, setRun]);

    if (!run) return null;

    if (run.kind === "done" && step) {
        const next = run.nextKey ? steps.find((entry) => entry.key === run.nextKey) : undefined;
        if (next) {
            return (
                <CornerCard
                    title={t(run.finished ? "home.guide.stepDone" : "home.guide.stepOpen").replace("{title}", step.title)}
                    text={t("home.guide.nextStep").replace("{title}", next.title)}
                    finished={run.finished}
                >
                    <Button type="button" size="sm" variant="ghost" onClick={end}>{t("home.guide.later")}</Button>
                    <Button type="button" size="sm" onClick={() => {
                        startStep(next.key);
                        navigate(next.to);
                    }}>
                        {t("home.guide.goNext")}
                    </Button>
                </CornerCard>
            );
        }
        return (
            <CornerCard title={t("home.guide.allDoneTitle")} text={stops.length > 0 ? t("home.guide.allDoneTour") : t("home.guide.allDoneText")}>
                <Button type="button" size="sm" variant="ghost" onClick={end}>{t("home.guide.close")}</Button>
                {stops.length > 0 ? <Button type="button" size="sm" onClick={startTour}>{t("home.guide.takeTour")}</Button> : null}
            </CornerCard>
        );
    }

    if (!tip || !element) return null;

    if (run.kind === "step") {
        const last = run.tip === tips.length - 1;
        return (
            <TipCard
                tip={tip}
                element={element}
                index={run.tip}
                total={tips.length}
                onBack={() => setRun({...run, tip: run.tip - 1})}
                // After the last tip the step waits for the save; leaving the page then checks it.
                onNext={() => setRun({...run, tip: run.tip + 1})}
                onSkip={end}
                nextLabel={last ? t("home.guide.gotIt") : t("home.guide.next")}
                resolveLanguageKey={t}
            />
        );
    }

    if (run.kind === "tour") {
        const last = run.stop === stops.length - 1;
        const help = stop?.explainsPage ? pageHelpOf(element) : undefined;
        return (
            <TipCard
                tip={help ? {target: tip.target, title: help.title, text: help.overview} : tip}
                points={help?.sections}
                element={element}
                index={run.stop}
                total={stops.length}
                onBack={() => setRun({...run, stop: run.stop - 1})}
                onNext={() => (last ? end() : setRun({...run, stop: run.stop + 1}))}
                onSkip={end}
                nextLabel={last ? t("home.guide.finish") : t("home.guide.next")}
                resolveLanguageKey={t}
            />
        );
    }

    return null;
}

export default compose(withLanguage("src/modules/core/clients/panel/private/sidebar/index.tsx"))(GuideRunner);
