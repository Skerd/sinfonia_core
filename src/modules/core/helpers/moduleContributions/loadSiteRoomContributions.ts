import type {SiteRoomContribution} from "@coreModule/helpers/types/siteRoomContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    isOptionalRecordOf,
    isString,
    memoizeOnList,
    mergeRecords,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

const KIND = "siteRoomContribution";

export function createSiteRoomContributions(glob: ContributionGlob) {
    const list = createContributionList<SiteRoomContribution>({
        kind: KIND,
        glob,
        isValid: (entry) =>
            isOptionalRecordOf(entry.systemSettingsRooms, isString)
            && isOptionalRecordOf(entry.pathRoomOverrides, isString),
    });

    const merge = (field: "systemSettingsRooms" | "pathRoomOverrides") =>
        memoizeOnList(list, (entries) =>
            mergeRecords(KIND, entries.map((contribution) => ({source: contribution, record: contribution[field]}))));

    return {
        list,
        getSystemSettingsRooms: merge("systemSettingsRooms"),
        getPathRoomOverrides: merge("pathRoomOverrides"),
    };
}

const siteRoomContributions = createSiteRoomContributions(
    filterGlobByEnabledModules(
        import.meta.glob<Record<string, unknown>>("@/modules/*/clients/panel/siteRoomContribution.{tsx,ts}", {eager: true}),
    ),
);

/** systemSettings resource segment → room id, merged in contribution order (later wins). */
export function getContributedSystemSettingsRooms(): Readonly<Record<string, string>> {
    return siteRoomContributions.getSystemSettingsRooms();
}

/** `"menu/subview"` → room id, merged in contribution order (later wins). */
export function getContributedPathRoomOverrides(): Readonly<Record<string, string>> {
    return siteRoomContributions.getPathRoomOverrides();
}
