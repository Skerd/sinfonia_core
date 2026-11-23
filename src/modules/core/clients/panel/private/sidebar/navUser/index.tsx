import {IconBell, IconBoxMultiple, IconCompass, IconSelector, IconLogout, IconMailCheck, IconUserCog, IconTool} from "@tabler/icons-react";
import {compose} from "redux";
import {useMemo, useState} from "react";
import {signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {Link, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {DropdownMenuGroup} from "@coreModule/components/ui/dropdown-menu.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,} from "@coreModule/components/ui/sidebar.tsx";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger}from "@coreModule/components/ui/dropdown-menu.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {MEDIA_BASE_URL} from "@coreModule/helpers/constants/media.constants.ts";
import {getHomeTour} from "@coreModule/helpers/moduleContributions/loadHomeContributions.ts";
import {useGuide} from "../../home/guide/guideContext.tsx";

const CURRENT_REVOKE_REQUEST = {method: "post" as const, url: "/api/user/userSession/currentRevoke", data: {}};

type LoggedUserProps = WithLanguageType & {}

function NavUser({
    resolveLanguageKey,
}: LoggedUserProps) {

    const [open, setOpen] = useState(false);
    const [signOutCount, setSignOutCount] = useState(0);
    const { isMobile } = useSidebar();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const finishSignOut = () => {
        dispatch(signOut());
        navigate("/authenticate/login");
    };
    // Local logout completes either way: the network or the session may already be gone.
    useHttpRequest(CURRENT_REVOKE_REQUEST, {}, signOutCount, true, {success: finishSignOut, error: finishSignOut});
    const {name, surname, email, photo, company} = useSelector((state: RootState) => state.authentication.user);
    const {startTour} = useGuide();
    // The tour of the daily pages can be taken again at any time (D179); only the count matters here, not the texts.
    const hasTour = useMemo(
        () => getHomeTour({resolveLanguageKey: (key) => key, company: {id: company._id, name: company.name}}).length > 0,
        [company._id, company.name],
    );
    // A user without a photo shows the initials; requesting `/media/undefined` answered 400 on every page (TD-B154).
    const photoUrl = photo ? `${MEDIA_BASE_URL}${photo}` : undefined;
    function getAvatarFallbackName() {
        const first = name?.trim();
        const last = surname?.trim();
        if (first) {
            if (last) return `${first[0]}${last[0]}`;
            return first.length >= 2 ? first.slice(0, 2) : first[0];
        }
        if (last) {
            return last.length >= 2 ? last.slice(0, 2) : last[0];
        }
        return "__";
    }

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size='lg'
                                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                            >
                                <Avatar className='h-8 w-8 rounded-lg'>
                                    {photoUrl ? <AvatarImage src={photoUrl} alt={name + "_photo"} /> : null}
                                    <AvatarFallback className='rounded-lg uppercase'>{getAvatarFallbackName()}</AvatarFallback>
                                </Avatar>
                                <div className='grid flex-1 text-start text-sm leading-tight'>
                                    <span className='truncate font-semibold'>{name} {surname}</span>
                                    <span className='truncate text-xs'>{email}</span>
                                </div>
                                <IconSelector className='ms-auto size-4' />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                            side={isMobile ? 'bottom' : 'right'}
                            align='end'
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className='p-0 font-normal'>
                                <div className='flex items-center gap-2 px-1 py-1.5 text-start text-sm'>
                                    <Avatar className='h-8 w-8 rounded-lg'>
                                        {photoUrl ? <AvatarImage src={photoUrl} alt={name + "_photo"} /> : null}
                                        <AvatarFallback className='rounded-lg uppercase'>{getAvatarFallbackName()}</AvatarFallback>
                                    </Avatar>
                                    <div className='grid flex-1 text-start text-sm leading-tight'>
                                        <span className='truncate font-semibold'>{name}</span>
                                        <span className='truncate text-xs'>{email}</span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem asChild>
                                    <Link to='/account/account'>
                                        <IconUserCog />
                                        {resolveLanguageKey("account")}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to='/account/security'>
                                        <IconTool />
                                        {resolveLanguageKey("security")}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to='/account/notificationCenter'>
                                        <IconBell />
                                        {resolveLanguageKey("activity")}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to='/account/notifications'>
                                        <IconMailCheck />
                                        {resolveLanguageKey("notifications")}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to='/account/apps'>
                                        <IconBoxMultiple />
                                        {resolveLanguageKey("connectedApps")}
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            {hasTour ? (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={startTour}>
                                        <IconCompass />
                                        {resolveLanguageKey("takeTour")}
                                    </DropdownMenuItem>
                                </>
                            ) : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant='destructive' onClick={() => setOpen(true)}>
                                <IconLogout />
                                {resolveLanguageKey("signOut")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
            <ConfirmDialog
                open={open}
                onOpenChange={(value: boolean) => {setOpen(value);}}
                title={resolveLanguageKey("dialog.title")}
                desc={resolveLanguageKey("dialog.description")}
                confirmText={resolveLanguageKey("dialog.confirmText")}
                cancelBtnText={resolveLanguageKey("dialog.cancelText")}
                destructive
                handleConfirm={() => setSignOutCount((count) => (count === 0 ? 1 : count))}
            />
        </>
    )
}


export default compose(
    withLanguage("src/modules/core/clients/panel/private/sidebar/navUser/index.tsx"),
    withDebug(true, true, "users")
)(NavUser)