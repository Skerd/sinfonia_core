import {IconBuilding, IconCash, IconFlag, IconMap, IconUserKey, IconMessages, IconUsers, IconUserCog, IconTool, IconBell, IconUserShield, IconSettings, IconGauge, IconBoxMultiple, IconMail, IconMessage, IconWorld, IconUserCheck, IconStopwatch, IconMailCheck, IconBook, IconTags} from "@tabler/icons-react";
import type {SidebarContribution} from "@coreModule/helpers/types/sidebarContribution.types.ts";
import type {NavGroup, NavItem, NavSubItem} from "@coreModule/helpers/types/sidebarNav.types.ts";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {getTenancySettingsSubCollapsibles} from "@coreModule/helpers/moduleContributions/loadTenancySettingsContributions.ts";
import {getAccountNavItems} from "@coreModule/helpers/moduleContributions/loadAccountNavContributions.ts";

function buildCompanyNavGroup(
    resolveLanguageKey: ResolveLanguageKey,
    chatUnreadTotal = 0,
    publicChatWaitingCount = 0,
    publicChatMineUnread = 0,
): NavGroup {
    const items: NavItem[] = [
        {
            title: resolveLanguageKey("menus.company.administration.title"),
            url: "/company/administration",
            icon: IconUserShield,
            permissions: ["users"],
            usersPermissions: [],
            atLeastOnePermission: true,
            accessPerspective: "others",
        },
        {
            title: resolveLanguageKey("menus.company.users.title"),
            url: "/company/users",
            icon: IconUsers,
            permissions: ["users"],
            usersPermissions: [],
            atLeastOnePermission: true,
            accessPerspective: "others",
        },
        {
            title: resolveLanguageKey("menus.company.chats.title"),
            url: "/company/chats",
            badge: chatUnreadTotal > 0 ? chatUnreadTotal : undefined,
            icon: IconMessages,
            permissions: ["channels"],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.company.websiteChats.title"),
            icon: IconWorld,
            permissions: [],
            usersPermissions: [],
            atLeastOnePermission: true,
            badge: (publicChatWaitingCount + publicChatMineUnread) || undefined,
            items: [
                {
                    title: resolveLanguageKey("menus.company.websiteChats.waiting.title"),
                    url: "/company/websiteChats/waiting",
                    icon: IconMessages,
                    permissions: ["channels"],
                    usersPermissions: [],
                    atLeastOnePermission: true,
                    badge: publicChatWaitingCount || undefined,
                },
                {
                    title: resolveLanguageKey("menus.company.websiteChats.mine.title"),
                    url: "/company/websiteChats/mine",
                    icon: IconUserCheck,
                    permissions: ["channels"],
                    usersPermissions: [],
                    atLeastOnePermission: true,
                    badge: publicChatMineUnread || undefined,
                },
            ],
        },
        {
            title: resolveLanguageKey("menus.company.blog.title"),
            url: "/company/blogPosts",
            icon: IconBook,
            permissions: ["blogPosts"],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.company.settings.company.title"),
            url: "/company/info",
            icon: IconBuilding,
            permissions: ["companies"],
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
            icon: IconUserCog,
            permissions: ["users"],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.account.accountSettings.security.title"),
            url: "/account/security",
            icon: IconTool,
            permissions: ["userSessions", "loginHistories"],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.account.accountSettings.notificationCenter.title"),
            url: "/account/notificationCenter",
            icon: IconBell,
            permissions: ["notifications"],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.account.accountSettings.notifications.title"),
            url: "/account/notifications",
            icon: IconMailCheck,
            permissions: ["notifications"],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.account.accountSettings.connectedApps.title"),
            url: "/account/apps",
            icon: IconBoxMultiple,
            permissions: ["users"],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        ...getAccountNavItems(resolveLanguageKey),
    ];
    return {
        title: resolveLanguageKey("menus.account.title"),
        permissions: [],
        usersPermissions: [],
        atLeastOnePermission: true,
        items,
    };
}

function buildTenancyNavGroup(resolveLanguageKey: ResolveLanguageKey, isPlatformCompany = false, isPlatformAdmin = false): NavGroup {
    // Only platform admins may manage other companies; the server enforces the same rule.
    const platformItems: NavSubItem[] = isPlatformAdmin
        ? [{
            title: resolveLanguageKey("menus.tenancy.companies.allCompanies.title"),
            url: "/tenancy/systemSettings/companies",
            icon: IconBuilding,
            permissions: ["companies"],
            usersPermissions: [],
            atLeastOnePermission: true,
        }]
        : [];
    // Performance covers the whole server, so only the platform company sees it.
    const performanceItems: NavItem[] = isPlatformCompany
        ? [{
            title: resolveLanguageKey("menus.tenancy.resources.serverPerformance.title"),
            url: "/tenancy/serverPerformance",
            icon: IconGauge,
            permissions: ["serverPerformance1m", "serverPerformance1h", "serverPerformance1d"],
            usersPermissions: [],
            atLeastOnePermission: false,
        }]
        : [];
    const items: NavItem[] = [
        ...performanceItems,
        {
            title: resolveLanguageKey("menus.tenancy.systemSettings.title"),
            icon: IconSettings,
            permissions: [],
            usersPermissions: [],
            atLeastOnePermission: true,
            items: [
                {
                    title: resolveLanguageKey("menus.tenancy.systemSettings.core.title"),
                    icon: IconBoxMultiple,
                    permissions: [],
                    usersPermissions: [],
                    atLeastOnePermission: true,
                    items: [
                        ...platformItems,
                        {
                            title: resolveLanguageKey("menus.company.settings.roles.title"),
                            url: "/tenancy/systemSettings/roles",
                            icon: IconUserKey,
                            permissions: ["roles"],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.cronJobs.title"),
                            url: "/tenancy/systemSettings/cronJobs",
                            icon: IconStopwatch,
                            permissions: ["cronjobs"],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.countries.title"),
                            url: "/tenancy/systemSettings/countries",
                            icon: IconFlag,
                            permissions: ["countries"],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.states.title"),
                            url: "/tenancy/systemSettings/states",
                            icon: IconMap,
                            permissions: ["states"],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.cities.title"),
                            url: "/tenancy/systemSettings/cities",
                            icon: IconBuilding,
                            permissions: ["cities"],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.currencies.title"),
                            url: "/tenancy/systemSettings/currencies",
                            icon: IconCash,
                            permissions: ["currencies"],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.smtpServers.title"),
                            url: "/tenancy/systemSettings/smtpServers",
                            icon: IconMail,
                            permissions: ["smtpServers"],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.messagingProviders.title"),
                            url: "/tenancy/systemSettings/messagingProviders",
                            icon: IconMessage,
                            permissions: ["messagingProviders"],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.blogCategories.title"),
                            url: "/tenancy/systemSettings/blogCategories",
                            icon: IconTags,
                            permissions: ["blogCategories"],
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
        return [buildCompanyNavGroup(
            resolveLanguageKey,
            context?.chatUnreadTotal ?? 0,
            context?.publicChatWaitingCount ?? 0,
            context?.publicChatMineUnread ?? 0,
        )];
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
    getNavGroups(resolveLanguageKey, context) {
        return [buildTenancyNavGroup(resolveLanguageKey, context?.isPlatformCompany === true, context?.isPlatformAdmin === true)];
    },
};

export default [coreCompanySidebarContribution, coreAccountSidebarContribution, coreTenancySidebarContribution];
