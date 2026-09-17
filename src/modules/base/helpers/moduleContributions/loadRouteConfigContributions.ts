import type {ReactNode} from "react";
import type {RouteConfigArgs, RouteConfigContribution} from "@baseModule/helpers/types/routeConfigContribution.types.ts";
import {filterGlobByEnabledModules} from "@baseModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    isOptionalFunction,
} from "@baseModule/helpers/moduleContributions/contributionRegistry.ts";

export function createRouteConfigContributions(glob: ContributionGlob) {
    const list = createContributionList<RouteConfigContribution>({
        kind: "routeConfigContribution",
        glob,
        isValid: (entry) => isOptionalFunction(entry.contributeRoutes),
    });

    /**
     * First contribution that returns non-`undefined` wins; `null` (or `false`) is a handled empty view.
     * Errors propagate on purpose, so a broken module route reaches the error boundary instead of
     * silently falling through to another module or core.
     */
    const run = (args: RouteConfigArgs): ReactNode | undefined => {
        for (const contribution of list()) {
            const out = contribution.contributeRoutes?.(args);
            if (out !== undefined) {
                return out;
            }
        }
        return undefined;
    };

    return {list, run};
}

const routeConfigContributions = createRouteConfigContributions(
    filterGlobByEnabledModules(
        import.meta.glob<Record<string, unknown>>("@/modules/*/clients/panel/routeConfigContribution.{tsx,ts}", {eager: true}),
    ),
);

/**
 * First contribution that returns non-`undefined` wins. `null` is treated as a handled empty view.
 */
export function runRouteConfigContributions(args: RouteConfigArgs): ReactNode | undefined {
    return routeConfigContributions.run(args);
}
