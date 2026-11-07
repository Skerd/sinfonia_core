import type {PortalContribution, PortalHostPage, PortalSection} from "@coreModule/helpers/types/portalContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    isComponentLike,
    isPlainObject,
    isString,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

const isOptionalComponent = (value: unknown) => value === undefined || isComponentLike(value);

const isCatalog = (value: unknown) => typeof value === "object" && value !== null
    && isString((value as {kind?: unknown}).kind)
    && isOptionalComponent((value as {Filters?: unknown}).Filters);

const isHostPage = (value: unknown) => isPlainObject(value)
    && isString(value.path) && value.path.replace(/^\/+/, "") !== ""
    && isComponentLike(value.Page);

const isHostPages = (value: unknown) => Array.isArray(value) && value.every(isHostPage);

/** The keys a contribution without a section may carry (D96). */
const HOST_PAGES_ONLY_KEYS = new Set(["id", "order", "section", "hostPages"]);

const isSection = (entry: Record<string, unknown>) => isString(entry.section)
    && isString(entry.path)
    && isOptionalComponent(entry.CompanySite)
    && isOptionalComponent(entry.SectionSite)
    && (entry.catalogs === undefined || (Array.isArray(entry.catalogs) && entry.catalogs.every(isCatalog)))
    && isOptionalComponent(entry.Home)
    && isOptionalComponent(entry.Provider)
    && isOptionalComponent(entry.NavAction)
    && isOptionalComponent(entry.AccountSection)
    && (entry.hostPages === undefined || isHostPages(entry.hostPages));

/** No section, at least one host page, and nothing that only a section can use. */
const isHostPagesOnly = (entry: Record<string, unknown>) => entry.section === undefined
    && isHostPages(entry.hostPages) && (entry.hostPages as unknown[]).length > 0
    && Object.keys(entry).every((key) => HOST_PAGES_ONLY_KEYS.has(key));

export function createPortalContributions(glob: ContributionGlob) {
    return createContributionList<PortalContribution>({
        kind: "portalContribution",
        glob,
        isValid: (entry) => isSection(entry) || isHostPagesOnly(entry),
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

/** Narrows a contribution to a section: the ones the portal lists, routes and links. */
export function isPortalSection(contribution: PortalContribution): contribution is PortalSection {
    return contribution.section !== undefined;
}

/**
 * Every built module's host pages, sections' and host-page-only contributions' alike, in contribution order (D96).
 * The portal mounts them on every host, whatever sections it lists; they never appear in the navbar or footer.
 */
export function portalHostPagesOf(contributions: readonly PortalContribution[]): PortalHostPage[] {
    return contributions.flatMap((contribution) => contribution.hostPages ?? [])
        .map((page) => ({...page, path: page.path.replace(/^\/+/, "")}));
}
