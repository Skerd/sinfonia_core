// import withLanguage, {WithLanguageType} from "@hocs/withLanguage.tsx";
// import {compose} from "redux";
// import withAxios, {WithAxiosType} from "@hocs/withAxios.tsx";
// import {AlertCircle, ChevronsUpDown, LogOut, VenetianMask} from "lucide-react";
// import {SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar} from "@components/ui/sidebar.tsx";
// import {
//     DropdownMenu,
//     DropdownMenuContent, DropdownMenuItem,
//     DropdownMenuLabel, DropdownMenuSeparator,
//     DropdownMenuTrigger
// } from "@components/ui/dropdown-menu.tsx";
// import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@components/ui/tooltip.tsx";
// import {Alert, AlertTitle} from "@components/ui/alert.tsx";
// import {HashLoader} from "react-spinners";
// import {useEffect, useImperativeHandle, useState} from "react";
// import {exitImpersonation} from "@redux/slices/impersonationSlice.ts";
// import {useDispatch, useSelector} from "react-redux";
// import {RootState} from "@redux/store/generalStore.ts";
//
//
// type ImpersonateProps = WithLanguageType & WithImpersonationType & WithAxiosType &{}
//
// function Impersonate({
//     resolveLanguageKey,
//     loading,
//     error,
//     data,
//     onFilterChange,
//     innerRef
// }: ImpersonateProps) {
//
//     const dispatch = useDispatch();
//     const { isMobile } = useSidebar();
//     const [forceReload, setForceReload] = useState<number>(1);
//     const [failedAttempts, setFailedAttempts] = useState<number>(0);
//
//     useImperativeHandle(innerRef, () => ({
//         success: () => {
//             setFailedAttempts(0);
//         },
//         error: () => {
//             if( failedAttempts >= 4 ){
//                 dispatch(exitImpersonation());
//             }
//             setFailedAttempts(failedAttempts + 1);
//         }
//     }));
//
//     useEffect(() => {
//         onFilterChange();
//     }, [forceReload]);
//
//     if( !specificUserId ){
//         return;
//     }
//
//     return (
//         <>
//             <SidebarMenu>
//                 <SidebarMenuItem>
//                     <DropdownMenu>
//                         {
//                             (loading ) ?
//                             <div className="flex p-2 items-center justify-center w-full border rounded-lg">
//                                 <HashLoader size="20px" loading={true}/>
//                             </div>
//                             :
//                             <>
//                                 {
//                                     ( error || !data ) ?
//                                         <DropdownMenuTrigger asChild >
//                                             <TooltipProvider>
//                                                 <Tooltip>
//                                                     <TooltipTrigger asChild>
//                                                         <Alert variant="destructive" className="cursor-pointer w-auto" onClick={() => {setForceReload(Date.now());} } >
//                                                             <AlertCircle/>
//                                                             <AlertTitle>{resolveLanguageKey("failTitle")} {failedAttempts}/5</AlertTitle>
//                                                         </Alert>
//                                                     </TooltipTrigger>
//                                                     <TooltipContent>
//                                                         <p>{resolveLanguageKey("failTitleTooltip")}</p>
//                                                     </TooltipContent>
//                                                 </Tooltip>
//                                             </TooltipProvider>
//                                         </DropdownMenuTrigger>
//                                         :
//                                         <DropdownMenuTrigger asChild >
//                                             <SidebarMenuButton
//                                                 size='lg'
//                                                 className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:cursor-pointer'
//                                             >
//                                                 <div className='border flex aspect-square size-8 items-center justify-center rounded-lg'>
//                                                     <VenetianMask className="w-6 h-6" />
//                                                 </div>
//                                                 <div className='grid flex-1 text-start text-sm leading-tight'>
//                                                     <span className='truncate font-semibold'>
//                                                       {data.name} {data.surname}
//                                                     </span>
//                                                     <span className='truncate text-xs'>{data.email}</span>
//                                                 </div>
//                                                 <ChevronsUpDown className='ms-auto' />
//                                             </SidebarMenuButton>
//                                         </DropdownMenuTrigger>
//                                 }
//                             </>
//                         }
//                         {
//                             !(loading) &&
//                             <DropdownMenuContent
//                                 className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
//                                 align="start"
//                                 side={isMobile ? "bottom" : "right"}
//                                 sideOffset={4}
//                             >
//                                 <DropdownMenuLabel className='text-muted-foreground text-xs'>
//                                     {resolveLanguageKey("impersonate")}
//                                 </DropdownMenuLabel>
//                                 <DropdownMenuSeparator />
//                                 <DropdownMenuItem className='gap-2 p-2' onClick={() => {
//                                     dispatch(exitImpersonation());
//                                 }}>
//                                     <div className='bg-background flex size-6 items-center justify-center rounded-md border border-destructive'>
//                                         <LogOut className='size-4 text-destructive' />
//                                     </div>
//                                     <div className='text-muted-foreground font-medium'>{resolveLanguageKey("exit")}</div>
//                                 </DropdownMenuItem>
//                             </DropdownMenuContent>
//                         }
//                     </DropdownMenu>
//                 </SidebarMenuItem>
//             </SidebarMenu>
//         </>
//     )
// }
//
// export default compose(
//     withImpersonation(),
//     withLanguage("src/modules/core/clients/panel/private/sidebar/impersonate/index.tsx"),
//     withAxios(
//         {
//             url: "/api/user/impersonate",
//             method: "get",
//             data: {}
//         },
//         true
//     )
// )(Impersonate);