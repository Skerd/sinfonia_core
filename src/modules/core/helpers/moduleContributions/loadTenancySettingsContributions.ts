import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {NavSubCollapsible, NavSubItem} from "@coreModule/helpers/types/sidebarNav.types.ts";
import type {TenancySettingsContribution} from "@coreModule/helpers/types/tenancySettingsContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    contributionModuleName,
    createContributionList,
    isPlatformEntry,
    safeInvoke,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";
import {isUnderUrl, platformUrlsOf} from "@coreModule/helpers/moduleContributions/loadRouteConfigContributions.ts";

const KIND = "tenancySettingsContribution";

/** Only the links to `urls` (and what is under them), and the collapsibles still holding one. */
export function keepPlatformItems(items: readonly NavSubItem[], urls: readonly string[]): NavSubItem[] {
    return items.flatMap((item): NavSubItem[] => {
        if ("items" in item && item.items) {
            const children = keepPlatformItems(item.items, urls);
            return children.length ? [{...item, items: children}] : [];
        }
        const path = typeof item.url === "string" ? item.url : item.url?.pathname;
        return path && urls.some((url) => isUnderUrl(path, url)) ? [item] : [];
    });
}

/**
 * A module kept only for its platform pages (D195, D197) shows only the entries of those pages; the module's
 * route contribution names them (`platformUrls`).
 */
function narrowToPlatformPages(urls: readonly string[], item: NavSubCollapsible): NavSubCollapsible | undefined {
    const items = keepPlatformItems(item.items, urls);
    return items.length ? {...item, items} : undefined;
}

export function createTenancySettingsContributions(
    glob: ContributionGlob,
    urlsOf: (moduleName: string) => readonly string[] = platformUrlsOf,
) {
    const list = createContributionList<TenancySettingsContribution>({
        kind: KIND,
        glob,
        isValid: (entry) => typeof entry.getTenancySettingsItems === "function",
        platformPages: true,
    });

    /** One collapsible per contribution, in order; `null`/`undefined` results and throwing modules are skipped. */
    const getSubCollapsibles = (resolveLanguageKey: ResolveLanguageKey): NavSubCollapsible[] =>
        list().flatMap((contribution) => {
            const item = safeInvoke(KIND, contribution, () => contribution.getTenancySettingsItems(resolveLanguageKey));
            if (!item || typeof item !== "object") return [];
            if (!isPlatformEntry(contribution)) return [item];
            const moduleName = contributionModuleName(contribution);
            const narrowed = narrowToPlatformPages(moduleName ? urlsOf(moduleName) : [], item);
            return narrowed ? [narrowed] : [];
        });

    return {list, getSubCollapsibles};
}

const tenancySettingsContributions = createTenancySettingsContributions(
    filterGlobByEnabledModules(
        import.meta.glob<Record<string, unknown>>(
            "@/modules/*/clients/panel/tenancySettingsContribution.{tsx,ts}",
            {eager: true},
        ),
    ),
);

export function getTenancySettingsSubCollapsibles(resolveLanguageKey: ResolveLanguageKey): NavSubCollapsible[] {
    return tenancySettingsContributions.getSubCollapsibles(resolveLanguageKey);
}
