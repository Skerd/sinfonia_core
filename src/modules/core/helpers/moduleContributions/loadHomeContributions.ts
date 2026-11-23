import type {HomeContribution, HomeSetupContext, HomeSetupStep} from "@coreModule/helpers/types/homeContribution.types.ts";
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
            return Array.isArray(steps) ? steps.filter(isSetupStep) : [];
        });

    return {list, getSetupSteps};
}

const homeContributions = createHomeContributions(
    filterGlobByEnabledModules(
        import.meta.glob<Record<string, unknown>>("@/modules/*/clients/panel/homeContribution.{tsx,ts}", {eager: true}),
    ),
);

export function getHomeSetupSteps(ctx: HomeSetupContext): HomeSetupStep[] {
    return homeContributions.getSetupSteps(ctx);
}
