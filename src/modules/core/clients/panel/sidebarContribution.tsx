import {
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
    Globe,
    UserCheck,
    Timer,
    MailCheck,
    BookOpen,
    Tags,
} from "lucide-react";
import {
    IconBuilding,
    IconCash,
    IconFlag,
    IconMap,
    IconUserKey,
} from "@tabler/icons-react";
import type {SidebarContribution} from "@coreModule/helpers/types/sidebarContribution.types.ts";
import type {NavGroup, NavItem} from "@coreModule/helpers/types/sidebarNav.types.ts";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {getTenancySettingsSubCollapsibles} from "@coreModule/helpers/moduleContributions/loadTenancySettingsContributions.ts";

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
            icon: ShieldUser,
            permissions: ["users"],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.company.users.title"),
            url: "/company/users",
            icon: Users,
            permissions: ["users"],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.company.chats.title"),
            url: "/company/chats",
            badge: chatUnreadTotal > 0 ? chatUnreadTotal : undefined,
            icon: MessagesSquare,
            permissions: ["channels"],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.company.websiteChats.title"),
            icon: Globe,
            permissions: [],
            usersPermissions: [],
            atLeastOnePermission: true,
            badge: (publicChatWaitingCount + publicChatMineUnread) || undefined,
            items: [
                {
                    title: resolveLanguageKey("menus.company.websiteChats.waiting.title"),
                    url: "/company/websiteChats/waiting",
                    icon: MessagesSquare,
                    permissions: ["channels"],
                    usersPermissions: [],
                    atLeastOnePermission: true,
                    badge: publicChatWaitingCount || undefined,
                },
                {
                    title: resolveLanguageKey("menus.company.websiteChats.mine.title"),
                    url: "/company/websiteChats/mine",
                    icon: UserCheck,
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
            icon: BookOpen,
            permissions: ["blogPosts"],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.company.settings.company.title"),
            url: "/company/info",
            icon: Building,
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
        {
            title: resolveLanguageKey("menus.account.accountSettings.notifications.title"),
            url: "/account/notifications",
            icon: MailCheck,
            permissions: [],
            usersPermissions: [],
            atLeastOnePermission: true,
        },
        {
            title: resolveLanguageKey("menus.account.apps.connectedApps.title"),
            url: "/account/apps",
            icon: Boxes,
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
                            icon: Timer,
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
                            icon: Mail,
                            permissions: ["smtpServers"],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.messagingProviders.title"),
                            url: "/tenancy/systemSettings/messagingProviders",
                            icon: MessageSquare,
                            permissions: ["messagingProviders"],
                            usersPermissions: [],
                            atLeastOnePermission: true,
                        },
                        {
                            title: resolveLanguageKey("menus.tenancy.systemSettings.blogCategories.title"),
                            url: "/tenancy/systemSettings/blogCategories",
                            icon: Tags,
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
    getNavGroups(resolveLanguageKey) {
        return [buildTenancyNavGroup(resolveLanguageKey)];
    },
};

export default [coreCompanySidebarContribution, coreAccountSidebarContribution, coreTenancySidebarContribution];
