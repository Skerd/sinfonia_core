import { useMemo } from "react";
import { NavGroup, ProtectNavigation } from "@coreModule/components/custom/navGroup.tsx";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import type { NavGroup as NavGroupDef } from "@coreModule/helpers/panel/sidebarNav.types.ts";
import { getModuleSidebarNavGroups } from "@coreModule/clients/panel/moduleContributions/loadSidebarContributions.ts";

function renderOneNavGroup(nav: NavGroupDef, index: number) {
    const NavGroupProtectedRender = ProtectNavigation(
        1,
        nav.permissions,
        nav.usersPermissions,
        true,
        NavGroup,
    );
    const key = `${nav.title}-${index}`;
    return <NavGroupProtectedRender key={key} items={nav.items} title={nav.title} />;
}

/**
 * Renders every package `clients/panel/sidebarContribution` (import.meta.glob), sorted by `order`.
 * Insertion point in the main sidebar is documented next to {@link AdministrativePanelSideBar}.
 */
export function ModuleSidebarNavGroups({
    resolveLanguageKey,
    chatUnreadTotal = 0,
}: {
    resolveLanguageKey: ResolveLanguageKey;
    chatUnreadTotal?: number;
}) {
    const groups = useMemo(
        () => getModuleSidebarNavGroups(resolveLanguageKey, {chatUnreadTotal}),
        [resolveLanguageKey, chatUnreadTotal],
    );
    return <>{groups.map((nav, i) => renderOneNavGroup(nav, i))}</>;
}
