import { UserCog, Wrench } from 'lucide-react'
import { SidebarNav } from './components/sidebar-nav.tsx'
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useParams} from "react-router-dom";
import Account from "@coreModule/clients/panel/private/accountSettings/account";
import Security from "@coreModule/clients/panel/private/accountSettings/security";
import NotificationsForm from "@coreModule/clients/panel/private/accountSettings/notifications";
import {useEffect, useState} from "react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Header from "@coreModule/components/custom/header.tsx";

type AccountSettingsProps = WithLanguageType & {
    specificUserId?: string,
    fullName?: string
}

function AccountSettings({
    resolveLanguageKey,
    specificUserId,
    fullName = ""
}: AccountSettingsProps) {

    const [activeTab, setActiveTab] = useState<string>('account');

    const { subview } = useParams();
    const sidebarNavItems = [
        {
            title: resolveLanguageKey("account"),
            href: specificUserId ? "account" : '/account/account',
            icon: <UserCog size={18} />
        },
        {
            title: resolveLanguageKey("security"),
            href: specificUserId ? "security" : '/account/security',
            icon: <Wrench size={18} />,
        },
        // {
        //     title: resolveLanguageKey("notifications"),
        //     href: specificUserId ? "notifications" : '/account/notifications',
        //     icon: <Bell size={18} />,
        // }
    ]

    useEffect(() => {
        if( !!specificUserId ) return;
        setActiveTab(subview || "account");
    }, [subview])

    return (
        <div className="flex-full gap-4">
            <Header
                title={resolveLanguageKey("title") + `${!!fullName ? `: ${fullName}` : ""}`}
                description={resolveLanguageKey("description")}
            />

            <div className='flex flex-1 flex-col space-y-2 overflow-hidden lg:flex-row lg:space-y-0 lg:space-x-6'>
                <aside className='top-0 lg:sticky lg:w-1/5'>
                    <SidebarNav
                        items={sidebarNavItems}
                        updateActiveTab={(tab: string) => setActiveTab(tab)}
                        activeTab={activeTab}
                        specificUserId={specificUserId}
                    />
                </aside>
                <div className='flex-full flex w-full overflow-y-hidden'>
                    {
                        activeTab === "account" &&
                        <Account specificUserId={specificUserId} />
                    }
                    {
                        activeTab === "security" &&
                        <Security specificUserId={specificUserId}/>
                    }
                    {
                        activeTab === "notifications" &&
                        <NotificationsForm />
                    }
                </div>
            </div>
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/index.tsx"),
    withDebug(true, true)
)(AccountSettings);
