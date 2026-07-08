import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {useEffect, useState} from "react";
import {Button} from "@coreModule/components/ui/button.tsx";
import UserLinkTelegramDeactivation from "@coreModule/clients/panel/private/apps/apps/telegram/disconnect";
import {useDispatch, useSelector} from "react-redux";
import {telegramLinked} from "@coreModule/helpers/redux/slices/uiSlice.ts";
import {IconTelegram} from '@coreModule/assets/brand-icons'
import ConnectTelegram from "@coreModule/clients/panel/private/apps/apps/telegram/connect";
import {DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@coreModule/components/ui/dialog.tsx";
import {EllipsisVertical, PowerOff} from "lucide-react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {TelegramStatusFormResponseType} from "armonia/src/modules/core/api/user/private/telegram/telegramStatus.form.response.type.ts";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";

type UserLinkTelegramProps = WithLanguageType & WithAxiosType<TelegramStatusFormResponseType> & {
    specificUserId?: string;
}

function UserLinkTelegram({
    resolveLanguageKey,
    specificUserId,
    data,
    loading,
    error,
    onFilterChange
}:UserLinkTelegramProps) {

    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");
    const [forceReload, setForceReload] = useState<number>(1);
    const dispatch = useDispatch();
    const [linked, setLinked] = useState<boolean>(!!data?.enabled);
    const [openWhat, setOpenWhat] = useState<null | "link" | "unlink">(null);
    const {telegramLinked: fromServerLinked} = useSelector((state: RootState) => state.ui);

    useEffect(() => {
        if( fromServerLinked ){
            dispatch(telegramLinked(true));
            setLinked(true);
            setOpenWhat(null);
        }
    }, [fromServerLinked])
    useEffect(() => {
        onFilterChange({forceReload});
    },[forceReload])
    useEffect(() => {
        setLinked(!!data?.enabled);
    }, [data]);

    if( !read.telegram ){
        return <></>
    }
    if( error ){
        return (
            <SimpleError
                title={resolveLanguageKey("failTitle")}
                description={resolveLanguageKey("failTitleTooltip")}
                onClick={() => setForceReload(Date.now())}
            />
        )
    }

    return (
        <>
            <li key={"telegram_app"} className='rounded-lg border p-4 hover:shadow-md'>
                <div className='mb-8 flex items-center justify-between'>
                    <div className={`bg-muted flex size-10 items-center justify-center rounded-lg p-2`}>
                        <IconTelegram />
                    </div>

                    <div className="flex items-center space-x-1">
                        {
                            (!loading) ?
                            <HiddenElement>
                                {
                                    write.telegram &&
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        className={`${linked ? 'border border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900' : ''}`}
                                        onClick={() => { if( !linked ){  setOpenWhat("link"); }}}
                                    >
                                        {linked ? resolveLanguageKey("connected") : resolveLanguageKey("notConnected")}
                                    </Button>
                                }
                            </HiddenElement>
                            :
                            <Loader />
                        }
                        {
                            !loading && linked && write.telegram &&
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size={"icon"}>
                                        <EllipsisVertical />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="start">
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem onClick={() => { if( linked ){ setOpenWhat("unlink"); } }}>
                                            <PowerOff className="text-destructive" />
                                            <p>{resolveLanguageKey("disconnect")}</p>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        }
                    </div>

                </div>
                <div>
                    <h2 className='mb-1 font-semibold'>{resolveLanguageKey("name")}</h2>
                    <p className='line-clamp-2 text-gray-500'>{resolveLanguageKey("description")}</p>
                </div>

                {
                    openWhat === "link" &&
                    <Dialog open={true} onOpenChange={(open) => { if (!open) setOpenWhat(null); }}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{resolveLanguageKey("connect")}</DialogTitle>
                            </DialogHeader>
                            <ConnectTelegram
                                onSuccess={() => {
                                    dispatch(telegramLinked(true));
                                    setLinked(true);
                                    setOpenWhat(null);
                                }}
                                onCancel={() => {setOpenWhat(null);}}
                                specificUserId={specificUserId}
                            />
                        </DialogContent>
                    </Dialog>
                }
                {
                    openWhat === "unlink" &&
                    <Dialog open={true} onOpenChange={(open) => { if (!open) setOpenWhat(null); }}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{resolveLanguageKey("disconnect")}</DialogTitle>
                            </DialogHeader>
                            <UserLinkTelegramDeactivation
                                onSuccess={() => {setLinked(false); setOpenWhat(null);}}
                                onCancel={() => {setOpenWhat(null);}}
                                specificUserId={specificUserId}
                            />
                        </DialogContent>
                    </Dialog>
                }

            </li>
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/apps/apps/telegram/index.tsx"),
    withAxios(
        {
            method: "get",
            url: `/api/user/telegram`,
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }]
        },
        true
    ),
    withDebug(true, true)
)(UserLinkTelegram)