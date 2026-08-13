import {compose} from "redux";
import {Link, useLocation} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import NavUser from "@coreModule/clients/panel/private/sidebar/navUser";
import CompaniesSwitcher from "@coreModule/clients/panel/private/sidebar/companies";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@coreModule/components/ui/sidebar.tsx";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {selectInternalChatUnread, selectWebsiteChatMineUnread} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {useFetchChatInboxBadgesOnPanelLoad} from "@coreModule/helpers/chat/fetchInboxBadges.ts";
import {IconHome} from "@tabler/icons-react";
import type {ComponentProps, ReactNode} from "react";
import {ModuleSidebarNavGroups} from "@coreModule/clients/panel/moduleContributions/ModuleSidebarNavGroups.tsx";

export type {
    BaseNavItem,
    NavCollapsible,
    NavGroup,
    NavItem,
    NavLink,
    NavLinkItem,
    NavSubCollapsible,
    ProtectedNav,
} from "@coreModule/helpers/panel/sidebarNav.types.ts";

type AdministrativePanelSideBarProps = WithLanguageType & {
    specificUserId?: string;
    preChildren?: ReactNode;
    postChildren?: ReactNode;
};

function AdministrativePanelSideBar({
    resolveLanguageKey,
    preChildren,
    postChildren,
}: ComponentProps<typeof Sidebar> & AdministrativePanelSideBarProps) {
    useFetchChatInboxBadgesOnPanelLoad();
    const chatUnreadTotal = useSelector(selectInternalChatUnread);
    const publicChatWaitingCount = useSelector((state: RootState) => state.chat.waitingCount);
    const publicChatMineUnread = useSelector(selectWebsiteChatMineUnread);
    const {pathname} = useLocation();
    // The module nav groups resolve their own active state; this entry is hardcoded here.
    const isHomeActive = pathname === "/" || pathname === "/home";

    return (
        <Sidebar collapsible="icon" variant="floating">
            <SidebarHeader>
                <CompaniesSwitcher />
            </SidebarHeader>
            <SidebarContent>
                {preChildren}
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isHomeActive}
                                tooltip={resolveLanguageKey("home.title")}
                            >
                                <Link to="/">
                                    <IconHome />
                                    <span>{resolveLanguageKey("home.title")}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
                <ModuleSidebarNavGroups
                    resolveLanguageKey={resolveLanguageKey}
                    chatUnreadTotal={chatUnreadTotal}
                    publicChatWaitingCount={publicChatWaitingCount}
                    publicChatMineUnread={publicChatMineUnread}
                />
                {postChildren}
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}

export default compose(withLanguage("src/modules/core/clients/panel/private/sidebar/index.tsx"))(
    AdministrativePanelSideBar,
);
