import {
    Building2,
    MessagesSquare,
    Users,
    UserCog,
    Wrench,
    Bell,
    ShieldUser,
    Building,
    Settings,
    Gauge,
    Boxes,
    Mail,
    MessageSquare,
} from "lucide-react";
import {
    IconBuilding,
    IconCash,
    IconFlag,
    IconMap,
    IconUserKey,
} from "@tabler/icons-react";
import type {SidebarContribution} from "@coreModule/clients/panel/moduleContributions/sidebarContribution.types.ts";
import type {NavGroup, NavItem} from "@coreModule/helpers/panel/sidebarNav.types.ts";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {getTenancySettingsSubCollapsibles} from "@coreModule/clients/panel/moduleContributions/loadTenancySettingsContributions.ts";

function buildCompanyNavGroup(
    resolveLanguageKey: ResolveLanguageKey,
    chatUnreadTotal = 0,
): NavGroup {
    const items: NavItem[] = [
        {
            title: resolveLanguageKey("menus.company.administration.title"),
            url: "/company/administration",
            icon: ShieldUser,
            permissions: [],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.company.users.title"),
            url: "/company/users",
            icon: Users,
            permissions: [],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.company.chats.title"),
            url: "/company/chats",
            badge: chatUnreadTotal > 0 ? chatUnreadTotal : undefined,
            icon: MessagesSquare,
            permissions: [],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.company.settings.company.title"),
            url: "/company/info",
            icon: Building,
            permissions: [],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
    ];
    return {
        title: resolveLanguageKey("menus.company.title"),
        permissions: [],
        usersPermissions: [],
        atLeastOnePermission: true,
        items,
    };
}

function buildAccountNavGroup(resolveLanguageKey: ResolveLanguageKey): NavGroup {
    const items: NavItem[] = [
        {
            title: resolveLanguageKey("menus.account.accountSettings.account.title"),
            url: "/account/account",
            icon: UserCog,
            permissions: [],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.account.accountSettings.security.title"),
            url: "/account/security",
            icon: Wrench,
            permissions: [],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.account.accountSettings.notificationCenter.title"),
            url: "/account/notificationCenter",
            icon: Bell,
            permissions: [],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
    ];
    return {
        title: resolveLanguageKey("menus.account.title"),
        permissions: [],
        usersPermissions: [],
        atLeastOnePermission: true,
        items,
    };
}

function buildTenancyNavGroup(resolveLanguageKey: ResolveLanguageKey): NavGroup {
    const items: NavItem[] = [
        {
            title: resolveLanguageKey("menus.tenancy.resources.serverPerformance.title"),
            url: "/tenancy/serverPerformance",
            icon: Gauge,
            permissions: [],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.tenancy.systemSettings.title"),
            icon: Settings,
            permissions: [],
            usersPermissions: [],
            atLeastOnePermission: true,
            items: [
                {
                    title: resolveLanguageKey("menus.tenancy.systemSettings.core.title"),
                    icon: Boxes,
                    permissions: [],
                    usersPermissions: [],
                    atLeastOnePermission: true,
                    items: [
                        {
                            title: resolveLanguageKey("menus.tenancy.companies.allCompanies.title"),
                            url: "/tenancy/systemSettings/companies",
                            icon: Building2,
                            permissions: [],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.company.settings.roles.title"),
                            url: "/tenancy/systemSettings/roles",
                            icon: IconUserKey,
                            permissions: [],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.countries.title"),
                            url: "/tenancy/systemSettings/countries",
                            icon: IconFlag,
                            permissions: [],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.states.title"),
                            url: "/tenancy/systemSettings/states",
                            icon: IconMap,
                            permissions: [],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.cities.title"),
                            url: "/tenancy/systemSettings/cities",
                            icon: IconBuilding,
                            permissions: [],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.currencies.title"),
                            url: "/tenancy/systemSettings/currencies",
                            icon: IconCash,
                            permissions: [],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.smtpServers.title"),
                            url: "/tenancy/systemSettings/smtpServers",
                            icon: Mail,
                            permissions: [],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.messagingProviders.title"),
                            url: "/tenancy/systemSettings/messagingProviders",
                            icon: MessageSquare,
                            permissions: [],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                    ],
                },
                ...getTenancySettingsSubCollapsibles(resolveLanguageKey),
            ],
        },
    ];
    return {
        title: resolveLanguageKey("menus.tenancy.title"),
        permissions: [],
        usersPermissions: [],
        atLeastOnePermission: true,
        items,
    };
}

const coreCompanySidebarContribution: SidebarContribution = {
    id: "core-company",
    order: 10,
    getNavGroups(resolveLanguageKey, context) {
        return [buildCompanyNavGroup(resolveLanguageKey, context?.chatUnreadTotal ?? 0)];
    },
};

const coreAccountSidebarContribution: SidebarContribution = {
    id: "core-account",
    order: 80,
    getNavGroups(resolveLanguageKey) {
        return [buildAccountNavGroup(resolveLanguageKey)];
    },
};

const coreTenancySidebarContribution: SidebarContribution = {
    id: "core-tenancy",
    order: 90,
    getNavGroups(resolveLanguageKey) {
        return [buildTenancyNavGroup(resolveLanguageKey)];
    },
};

export default [coreCompanySidebarContribution, coreAccountSidebarContribution, coreTenancySidebarContribution];
