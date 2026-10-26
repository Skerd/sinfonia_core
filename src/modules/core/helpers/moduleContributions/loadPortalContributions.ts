import type {PortalContribution} from "@coreModule/helpers/types/portalContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    isComponentLike,
    isString,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

const isOptionalComponent = (value: unknown) => value === undefined || isComponentLike(value);

export function createPortalContributions(glob: ContributionGlob) {
    return createContributionList<PortalContribution>({
        kind: "portalContribution",
        glob,
        isValid: (entry) => isString(entry.section)
            && isString(entry.path)
            && isOptionalComponent(entry.CompanySite)
            && isOptionalComponent(entry.SectionSite)
            && isOptionalComponent(entry.SectionSearch)
            && isOptionalComponent(entry.AccountSection),
        // A portal visitor's account belongs to the platform owner (core only); the sections
        // follow what the portal lists, not the signed-in company's modules.
        companyScoped: false,
    });
}

const portalContributions = createPortalContributions(
    filterGlobByEnabledModules(
        import.meta.glob<Record<string, unknown>>("@/modules/*/clients/portal/portalContribution.{tsx,ts}", {eager: true}),
    ),
);

export function getPortalContributions(): readonly PortalContribution[] {
    return portalContributions();
}

/** The contribution serving `path` (the URL segment), if any. */
export function getPortalContributionByPath(path: string | undefined): PortalContribution | undefined {
    return portalContributions().find((contribution) => contribution.path === path);
}
