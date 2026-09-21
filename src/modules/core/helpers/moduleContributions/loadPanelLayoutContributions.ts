import type {
    PanelLayoutContribution,
    PanelLayoutContributionArgs,
} from "@coreModule/helpers/types/panelLayoutContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    isOptionalFunction,
    safeInvoke,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

const KIND = "panelLayoutContribution";

export function createPanelLayoutContributions(glob: ContributionGlob) {
    const list = createContributionList<PanelLayoutContribution>({
        kind: KIND,
        glob,
        isValid: (entry) => isOptionalFunction(entry.getCenterPanelClassName),
    });

    /** First contribution (by order) returning a string wins; throwing modules are skipped. */
    const resolveCenterPanelClassName = (args: PanelLayoutContributionArgs): string | undefined => {
        for (const contribution of list()) {
            if (!contribution.getCenterPanelClassName) {
                continue;
            }
            const className = safeInvoke(KIND, contribution, () => contribution.getCenterPanelClassName!(args));
            if (typeof className === "string") {
                return className;
            }
        }
        return undefined;
    };

    return {list, resolveCenterPanelClassName};
}

const panelLayoutContributions = createPanelLayoutContributions(
    filterGlobByEnabledModules(
        import.meta.glob<Record<string, unknown>>("@/modules/*/clients/panel/panelLayoutContribution.{tsx,ts}", {eager: true}),
    ),
);

/** First module that returns a className wins; otherwise undefined. */
export function resolveCenterPanelClassName(args: PanelLayoutContributionArgs): string | undefined {
    return panelLayoutContributions.resolveCenterPanelClassName(args);
}
