import type {HomeContribution, HomeGuideTip, HomeSetupContext, HomeSetupStep, HomeTourStop} from "@coreModule/helpers/types/homeContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    safeInvoke,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

const KIND = "homeContribution";

const isSetupStep = (step: unknown): step is HomeSetupStep => {
    if (typeof step !== "object" || step === null) return false;
    const {key, title, to, accessModel, doneWhen} = step as Record<string, unknown>;
    return typeof key === "string" && typeof title === "string" && typeof to === "string" && typeof accessModel === "string"
        && typeof doneWhen === "object" && doneWhen !== null;
};

const isGuideTip = (tip: unknown): tip is HomeGuideTip => {
    if (typeof tip !== "object" || tip === null) return false;
    const {target, title, text} = tip as Record<string, unknown>;
    return typeof target === "string" && typeof title === "string" && typeof text === "string";
};

const isTourStop = (stop: unknown): stop is HomeTourStop => {
    if (!isGuideTip(stop)) return false;
    const {to, accessModel} = stop as Record<string, unknown>;
    return (to === undefined || typeof to === "string") && (accessModel === undefined || typeof accessModel === "string");
};

export function createHomeContributions(glob: ContributionGlob) {
    const list = createContributionList<HomeContribution>({
        kind: KIND,
        glob,
        isValid: (entry) => typeof entry.getSetupSteps === "function",
    });

    /** Every module's setup steps, in contribution order; a throwing module and malformed steps are left out (D178). */
    const getSetupSteps = (ctx: HomeSetupContext): HomeSetupStep[] =>
        list().flatMap((contribution) => {
            const steps = safeInvoke(KIND, contribution, () => contribution.getSetupSteps(ctx));
            return Array.isArray(steps)
                ? steps.filter(isSetupStep).map((step) => ({...step, guide: Array.isArray(step.guide) ? step.guide.filter(isGuideTip) : undefined}))
                : [];
        });

    /** Every module's tour stops of its daily pages, in contribution order (D179); malformed stops are left out. */
    const getTour = (ctx: HomeSetupContext): HomeTourStop[] =>
        list().flatMap((contribution) => {
            if (typeof contribution.getTour !== "function") return [];
            const stops = safeInvoke(KIND, contribution, () => contribution.getTour?.(ctx));
            return Array.isArray(stops) ? stops.filter(isTourStop) : [];
        });

    return {list, getSetupSteps, getTour};
}

const homeContributions = createHomeContributions(
    filterGlobByEnabledModules(
        import.meta.glob<Record<string, unknown>>("@/modules/*/clients/panel/homeContribution.{tsx,ts}", {eager: true}),
    ),
);

export function getHomeSetupSteps(ctx: HomeSetupContext): HomeSetupStep[] {
    return homeContributions.getSetupSteps(ctx);
}

export function getHomeTour(ctx: HomeSetupContext): HomeTourStop[] {
    return homeContributions.getTour(ctx);
}
