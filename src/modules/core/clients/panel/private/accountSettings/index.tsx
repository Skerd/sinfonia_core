import { Bell, Boxes, MailCheck, UserCog, Wrench } from 'lucide-react'
import { SidebarNav } from './components/sidebar-nav.tsx'
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useNavigate, useParams} from "react-router-dom";
import Account from "@coreModule/clients/panel/private/accountSettings/account";
import Security from "@coreModule/clients/panel/private/accountSettings/security";
import NotificationCenter from "@coreModule/clients/panel/private/accountSettings/notificationCenter";
import NotificationsForm from "@coreModule/clients/panel/private/accountSettings/notifications";
import ConnectedApps from "@coreModule/clients/panel/private/accountSettings/apps";
import {useEffect, useMemo, useState, type ReactNode} from "react";
import {getAccountSettingsPages} from "@coreModule/helpers/moduleContributions/loadAccountSettingsContributions.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Header from "@coreModule/components/custom/header.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/companyUser.dto.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import Forbidden from "@coreModule/components/custom/pages/forbidden.tsx";

type AccountSettingsProps = WithLanguageType & {
    specificUserId?: string,
    fullName?: string,
    /** Trailing header control when this page is hosted in the user drawer (close). */
    headerEnd?: ReactNode,
}

function AccountSettings({
    resolveLanguageKey,
    specificUserId,
    fullName = "",
    headerEnd,
}: AccountSettingsProps) {

    const [activeTab, setActiveTab] = useState<string>('account');
    const navigate = useNavigate();

    const { subview } = useParams();
    const perspective = specificUserId ? "others" : "self";
    const {read: readProfile} = useAccess("users", perspective);
    const {read: readSessions} = useAccess("userSessions", perspective);
    const {read: readHistory} = useAccess("loginHistories", perspective);
    const {read: readNotifications} = useAccess("notifications", perspective);
    const {read: readAddresses} = useAccess("customerAddresses", perspective);
    const {read: readSavedSearches} = useAccess("savedsearches", perspective);
    const {read: readProviderProfiles} = useAccess("providerProfiles", perspective);
    const readSecurity = readSessions || readHistory
        ? true
        : readSessions === null || readHistory === null
            ? null
            : false;
    const {data: profile} = useHttpRequest<CompanyUserType>(
        {
            method: "get",
            url: "/api/user/data",
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }]
        },
        {},
        readProfile ? 1 : 0,
        true,
        {},
        {specificUserId},
    );
    const isBot = !!profile?.isBot;
    const contributedPages = useMemo(
        () => isBot ? [] : getAccountSettingsPages({specificUserId}),
        [isBot, specificUserId],
    );

    const visiblePages = contributedPages.filter((page) => {
        if (page.id === "addresses") return readAddresses !== false;
        if (page.id === "savedsearches") return readSavedSearches !== false;
        if (page.id === "providerprofile") return readProviderProfiles !== false;
        return true;
    });

    const sidebarNavItems = [
        ...(readProfile !== false ? [{
            title: resolveLanguageKey("account"),
            href: specificUserId ? "account" : '/account/account',
            icon: <UserCog size={18} />
        }] : []),
        ...(!isBot ? [
            ...(readSecurity !== false ? [{
                title: resolveLanguageKey("security"),
                href: specificUserId ? "security" : '/account/security',
                icon: <Wrench size={18} />,
            }] : []),
            ...(readNotifications !== false ? [{
                title: resolveLanguageKey("activity"),
                href: specificUserId ? "notificationCenter" : '/account/notificationCenter',
                icon: <Bell size={18} />,
            }] : []),
            ...(readNotifications !== false ? [{
                title: resolveLanguageKey("notifications"),
                href: specificUserId ? "notifications" : '/account/notifications',
                icon: <MailCheck size={18} />,
            }] : []),
            ...(readProfile !== false ? [{
                title: resolveLanguageKey("connectedApps"),
                href: specificUserId ? "apps" : '/account/apps',
                icon: <Boxes size={18} />,
            }] : []),
            ...visiblePages.map((page) => ({
                title: resolveLanguageKey(page.titleKey),
                href: specificUserId ? page.id : `/account/${page.id}`,
                icon: page.icon,
            })),
        ] : [])
    ]

    useEffect(() => {
        if( !!specificUserId ) return;
        setActiveTab(subview || "account");
    }, [subview])

    useEffect(() => {
        if (!isBot) return;
        if (specificUserId) {
            setActiveTab("account");
            return;
        }
        if (subview === "security" || subview === "notifications" || subview === "notificationCenter" || subview === "apps" || subview === "addresses" || subview === "savedsearches" || subview === "providerprofile") {
            navigate("/account/account", {replace: true});
        }
    }, [isBot, specificUserId, subview, navigate]);

    const hostedInSheet = !!specificUserId;
    const activeRead = isBot || activeTab === "account" ? readProfile
        : activeTab === "security" ? readSecurity
        : activeTab === "notificationCenter" || activeTab === "notifications" ? readNotifications
        : activeTab === "apps" ? readProfile
        : activeTab === "addresses" ? readAddresses
        : activeTab === "savedsearches" ? readSavedSearches
        : activeTab === "providerprofile" ? readProviderProfiles
        : true;

    return (
        <div className={hostedInSheet ? "flex min-h-0 flex-1 flex-col overflow-hidden" : "flex-full gap-4"}>
            {hostedInSheet ? (
                <div className="flex items-start justify-between gap-2 p-2 shadow-sm">
                    <Header
                        className="min-w-0 flex-1"
                        title={resolveLanguageKey("title") + `${!!fullName ? `: ${fullName}` : ""}`}
                        description={resolveLanguageKey("description")}
                    />
                    {headerEnd}
                </div>
            ) : (
                <Header
                    title={resolveLanguageKey("title") + `${!!fullName ? `: ${fullName}` : ""}`}
                    description={resolveLanguageKey("description")}
                />
            )}

            <div className={cn(
                "flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row",
                hostedInSheet ? "mt-4 gap-y-4 px-4 pb-6 lg:gap-x-6" : "gap-y-2 lg:gap-y-0 lg:gap-x-6",
            )}>
                <aside className='top-0 lg:sticky lg:w-1/5'>
                    <SidebarNav
                        items={sidebarNavItems}
                        updateActiveTab={(tab: string) => setActiveTab(tab)}
                        activeTab={activeTab}
                        specificUserId={specificUserId}
                    />
                </aside>
                <div className='flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden'>
                    {
                        activeRead === null ? null
                        : !activeRead ? <Forbidden />
                        : isBot || activeTab === "account" ? <Account specificUserId={specificUserId} />
                        : activeTab === "security" ? <Security specificUserId={specificUserId}/>
                        : activeTab === "notificationCenter" ? <NotificationCenter specificUserId={specificUserId} />
                        : activeTab === "notifications" ? <NotificationsForm specificUserId={specificUserId} />
                        : activeTab === "apps" ? <ConnectedApps specificUserId={specificUserId} />
                        : visiblePages.some((page) => page.id === activeTab) ? visiblePages.map((page) => (
                            activeTab === page.id ? <div key={page.id} className="flex min-h-0 flex-1 flex-col overflow-hidden">{page.render()}</div> : null
                        ))
                        : <Forbidden />
                    }
                </div>
            </div>
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/index.tsx"),
    withDebug(true, true, "users")
)(AccountSettings);
