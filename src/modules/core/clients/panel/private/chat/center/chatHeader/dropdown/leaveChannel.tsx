import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {LogOut} from "lucide-react";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useEffect, useImperativeHandle, useState} from "react";
import {toast} from "sonner";
import {deleteChannel, openChannel, updateChannelReadOnlyState} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {useDispatch} from "react-redux";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import {DeleteChannelFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/deleteChannel.form.response.type.ts";
import {DeleteChannelFormType} from "armonia/src/modules/core/api/user/private/chats/channels/deleteChannel.form.type.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type ToastPromiseHandlers = {
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}

type LeaveChannelProps = WithLanguageType & WithAxiosType<DeleteChannelFormResponseType, DeleteChannelFormType> & {
    channel: Channel
}

function LeaveChannel({
    channel,
    resolveLanguageKey,
    loading,
    onFilterChange,
    innerRef
}: LeaveChannelProps) {

    const {delete: canDeleteChannel} = useAccess("channels");
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const toastPromiseHandlersRef = useState<ToastPromiseHandlers>(() => ({resolve: () => undefined, reject: () => undefined,}))[0];

    const shortCut = "2";

    useKeyboardShortcuts(shortCut, () => {setOpen(true);})

    useImperativeHandle(innerRef, () => ({
        start: () => {
            const newPromise = new Promise((resolve, reject) => {
                toastPromiseHandlersRef.resolve = resolve;
                toastPromiseHandlersRef.reject = reject;
            });
            toast.promise(newPromise, {
                loading: resolveLanguageKey(    channel.metaData.isGroup && !channel.metaData.readOnly ? "axiosOnFunction.startLeave" : "axiosOnFunction.startDelete").title,
                success: resolveLanguageKey(    channel.metaData.isGroup && !channel.metaData.readOnly ? "axiosOnFunction.successLeave" : "axiosOnFunction.successDelete").title,
                error: () => resolveLanguageKey(channel.metaData.isGroup && !channel.metaData.readOnly ? "axiosOnFunction.errorLeave" : "axiosOnFunction.errorDelete").title,
                duration: resolveLanguageKey(   channel.metaData.isGroup && !channel.metaData.readOnly ? "axiosOnFunction.startLeave" : "axiosOnFunction.startDelete").time
            });
        },
        success: () => {
            toastPromiseHandlersRef.resolve?.(undefined);
            setOpen(false);
            if( !channel.metaData.isGroup ){
                dispatch(openChannel(null));
                dispatch(deleteChannel(channel._id));
            }
            else{
                if( channel.metaData.readOnly ){
                    dispatch(openChannel(null));
                    dispatch(deleteChannel(channel._id));
                }
                else{
                    dispatch(updateChannelReadOnlyState({
                        _id: channel._id,
                        state: true
                    }));
                }
            }
        },
        error: () => {
            toastPromiseHandlersRef.reject?.(undefined);
        }
    }));

    useEffect(() => {
        return () => {
            toastPromiseHandlersRef.resolve?.(undefined);
        }
    }, []);

    if( !canDeleteChannel ){
        return <HiddenElement />
    }

    return (
        <>
            <DropdownMenuItem onClick={(event) => {event.preventDefault(); setOpen(true);}} disabled={loading}>
                <LogOut/>
                {resolveLanguageKey((channel.metaData.isGroup && !channel.metaData.readOnly) ? "leaveGroup" : "deleteChat")}
                <DropdownMenuShortcut>⌘{shortCut}</DropdownMenuShortcut>
            </DropdownMenuItem>

            <ConfirmDialog
                open={open}
                isLoading={loading}
                onOpenChange={(value: boolean) => {setOpen(value);}}
                title={resolveLanguageKey((channel.metaData.isGroup && !channel.metaData.readOnly) ? "dialog.titleLeave" : "dialog.titleDelete")}
                desc={resolveLanguageKey((channel.metaData.isGroup && !channel.metaData.readOnly) ? "dialog.descriptionLeave": "dialog.descriptionDelete")}
                confirmText={resolveLanguageKey((channel.metaData.isGroup && !channel.metaData.readOnly) ? "dialog.confirmTextLeave" : "dialog.confirmTextDelete")}
                cancelBtnText={resolveLanguageKey("dialog.cancelText")}
                destructive
                handleConfirm={() => {
                    if( !loading ){
                        onFilterChange({
                            channelId: channel._id
                        })
                    }
                }}
                className='sm:max-w-sm'
            />
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/chatHeader/dropdown/leaveChannel.tsx"),
    withAxios(
        {
            url: "/api/user/chats/channels",
            method: "DELETE",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(LeaveChannel);