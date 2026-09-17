import { useMemo } from "react";
import { NavGroup } from "@coreModule/components/custom/navGroup.tsx";
import type { ResolveLanguageKey } from "@baseModule/helpers/hocs/withLanguage.tsx";
import type { NavGroup as NavGroupDef } from "@baseModule/helpers/types/sidebarNav.types.ts";
import { getModuleSidebarNavGroups } from "@coreModule/clients/panel/moduleContributions/loadSidebarContributions.ts";
import { filterNavGroups } from "@baseModule/helpers/navigation/filterNavByAccess.ts";
import { useAccessHydrated, useAccessMap } from "@baseModule/helpers/context/accessContext.tsx";

function renderOneNavGroup(nav: NavGroupDef, index: number) {
    return <NavGroup key={`${nav.title}-${index}`} items={nav.items} title={nav.title} />;
}

/**
 * Renders every package `clients/panel/sidebarContribution` (import.meta.glob), sorted by `order`,
 * showing only the groups and entries the current user may read.
 * Insertion point in the main sidebar is documented next to {@link AdministrativePanelSideBar}.
 */
export function ModuleSidebarNavGroups({
    resolveLanguageKey,
    chatUnreadTotal = 0,
    publicChatWaitingCount = 0,
    publicChatMineUnread = 0,
}: {
    resolveLanguageKey: ResolveLanguageKey;
    chatUnreadTotal?: number;
    publicChatWaitingCount?: number;
    publicChatMineUnread?: number;
}) {
    const accessMap = useAccessMap();
    const accessHydrated = useAccessHydrated();
    const groups = useMemo(
        () => filterNavGroups(
            getModuleSidebarNavGroups(resolveLanguageKey, {
                chatUnreadTotal,
                publicChatWaitingCount,
                publicChatMineUnread,
            }),
            accessMap,
            accessHydrated,
        ),
        [resolveLanguageKey, chatUnreadTotal, publicChatWaitingCount, publicChatMineUnread, accessMap, accessHydrated],
    );
    return <>{groups.map((nav, i) => renderOneNavGroup(nav, i))}</>;
}
