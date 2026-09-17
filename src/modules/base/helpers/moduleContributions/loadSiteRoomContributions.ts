import type {SiteRoomContribution} from "@baseModule/helpers/types/siteRoomContribution.types.ts";
import {filterGlobByEnabledModules} from "@baseModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    isOptionalRecordOf,
    isString,
    mergeRecords,
} from "@baseModule/helpers/moduleContributions/contributionRegistry.ts";

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
        mergeRecords(KIND, list().map((contribution) => ({source: contribution, record: contribution[field]})));

    let systemSettingsRooms: Readonly<Record<string, string>> | undefined;
    let pathRoomOverrides: Readonly<Record<string, string>> | undefined;

    return {
        list,
        getSystemSettingsRooms: () => (systemSettingsRooms ??= merge("systemSettingsRooms")),
        getPathRoomOverrides: () => (pathRoomOverrides ??= merge("pathRoomOverrides")),
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
