import type {PortalContribution} from "@coreModule/helpers/types/portalContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    isComponentLike,
    isString,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

const isOptionalComponent = (value: unknown) => value === undefined || isComponentLike(value);

const isCatalog = (value: unknown) => typeof value === "object" && value !== null
    && isString((value as {kind?: unknown}).kind)
    && isOptionalComponent((value as {Filters?: unknown}).Filters);

export function createPortalContributions(glob: ContributionGlob) {
    return createContributionList<PortalContribution>({
        kind: "portalContribution",
        glob,
        isValid: (entry) => isString(entry.section)
            && isString(entry.path)
            && isOptionalComponent(entry.CompanySite)
            && isOptionalComponent(entry.SectionSite)
            && (entry.catalogs === undefined || (Array.isArray(entry.catalogs) && entry.catalogs.every(isCatalog)))
            && isOptionalComponent(entry.Home)
            && isOptionalComponent(entry.Provider)
            && isOptionalComponent(entry.NavAction)
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
