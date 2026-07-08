import {compose} from "redux";
import {useState} from "react";
import {signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {Link, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {DropdownMenuGroup} from "@coreModule/components/ui/dropdown-menu.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Bell, ChevronsUpDown, LogOut, UserCog, Wrench} from "lucide-react";
import {SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,} from "@coreModule/components/ui/sidebar.tsx";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger}from "@coreModule/components/ui/dropdown-menu.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";

type LoggedUserProps = WithLanguageType & {}

function NavUser({
    resolveLanguageKey,
}: LoggedUserProps) {

    const [open, setOpen] = useState(false);
    const { isMobile } = useSidebar();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {name, surname, email, photo} = useSelector((state: RootState) => state.authentication.user);
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
                                    <AvatarImage src={`/api/auxiliary/media/${photo}`} alt={name + "_photo"} />
                                    <AvatarFallback className='rounded-lg uppercase'>{getAvatarFallbackName()}</AvatarFallback>
                                </Avatar>
                                <div className='grid flex-1 text-start text-sm leading-tight'>
                                    <span className='truncate font-semibold'>{name} {surname}</span>
                                    <span className='truncate text-xs'>{email}</span>
                                </div>
                                <ChevronsUpDown className='ms-auto size-4' />
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
                                        <AvatarImage src={`/api/auxiliary/media/${photo}`} alt={name + "_photo"} />
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
                                        <UserCog />
                                        {resolveLanguageKey("account")}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to='/account/security'>
                                        <Wrench />
                                        {resolveLanguageKey("security")}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to='/account/notifications'>
                                        <Bell />
                                        {resolveLanguageKey("notifications")}
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant='destructive' onClick={() => setOpen(true)}>
                                <LogOut />
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
                handleConfirm={async () => {
                    try {
                        await apiClient.post("/api/user/userSession/currentRevoke");
                    } catch {
                        // Local logout must still complete when the network or session is already gone.
                    } finally {
                        dispatch(signOut());
                        navigate("/authenticate/login");
                    }
                }}
            />
        </>
    )
}


export default compose(
    withLanguage("src/modules/core/clients/panel/private/sidebar/navUser/index.tsx"),
    withDebug(true, true)
)(NavUser)