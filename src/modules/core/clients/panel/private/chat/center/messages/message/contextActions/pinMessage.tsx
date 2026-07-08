import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {LoaderCircle, Pin} from "lucide-react";
import {ContextMenuItem, ContextMenuShortcut} from "@coreModule/components/ui/context-menu.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {useImperativeHandle} from "react";
import {updateMessagePinned} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {useDispatch} from "react-redux";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {PinMessageFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/actions/pinMessage.form.response.type.ts";
import {PinMessageFormType} from "armonia/src/modules/core/api/user/private/chats/messages/actions/pinMessage.form.type.ts";

type PinMessageProps = WithLanguageType & WithAxiosType<PinMessageFormResponseType, PinMessageFormType> & {
    messageId: string,
}

function PinMessage({
    resolveLanguageKey,
    loading,
    onFilterChange,
    messageId,
    innerRef
}: PinMessageProps) {

    const {write} = useAccess("messages");
    const dispatch = useDispatch();
    const shortcut = "4";
    const pinMessage = () => {
        if( !write || !write.pinned ) return;
        onFilterChange({
            messageId
        })
    }
    useKeyboardShortcuts(shortcut, pinMessage)

    useImperativeHandle(innerRef, () => ({
        success: (data: PinMessageFormResponseType) => {
            if( !!data ){
                dispatch(
                    updateMessagePinned({
                        messageId: messageId,
                        pinned: data
                    })
                );
            }
        }
    }))

    if( !write || !write.pinned){
        return <HiddenElement />
    }

    return (
        <ContextMenuItem disabled={loading} onClick={(e) => {e.stopPropagation(); e.preventDefault(); pinMessage();}} className="hover:cursor-pointer">
            {loading ? <LoaderCircle className="animate-spin mr-2 h-4 w-4"/> : <Pin className="mr-2 h-4 w-4"/>}
            {resolveLanguageKey("pin")}
            <ContextMenuShortcut>⌘{shortcut}</ContextMenuShortcut>
        </ContextMenuItem>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/messages/message/contextActions/pinMessage.tsx"),
    withAxios(
        {
            url: "/api/user/chats/messages/pin",
            method: "PUT",
            data: {

            }
        },
        true
    ),
    withDebug(true, true)
)(PinMessage);