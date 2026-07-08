import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {LoaderCircle, PinOff} from "lucide-react";
import {ContextMenuItem, ContextMenuShortcut} from "@coreModule/components/ui/context-menu.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {useImperativeHandle} from "react";
import {updateMessagePinned} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {useDispatch} from "react-redux";
import {PinMessageFormType} from "armonia/src/modules/core/api/user/private/chats/messages/actions/pinMessage.form.type.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {UnpinMessageFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/actions/unpinMessage.form.response.type.ts";

type UnpinMessageProps = WithLanguageType & WithAxiosType<UnpinMessageFormResponseType, PinMessageFormType> & {
    messageId: string,
}

function UnpinMessage({
    resolveLanguageKey,
    loading,
    onFilterChange,
    messageId,
    innerRef
}: UnpinMessageProps) {

    const {write} = useAccess("messages");
    const dispatch = useDispatch();
    const shortcut = "4";
    const unpinMessage = () => {
        if( !write || !write.pinned ) return;
        onFilterChange({
            messageId
        })
    }
    useKeyboardShortcuts(shortcut, unpinMessage)
    useImperativeHandle(innerRef, () => ({
        success: () => {
            dispatch(
                updateMessagePinned({
                    messageId: messageId,
                    pinned: null
                })
            );
        }
    }))

    if( !write || !write.pinned ){
        return <HiddenElement />
    }

    return (
        <ContextMenuItem disabled={loading} onClick={(e) => {e.stopPropagation(); e.preventDefault(); unpinMessage();}} className="hover:cursor-pointer">
            {loading ? <LoaderCircle className="animate-spin mr-2 h-4 w-4"/> : <PinOff className="mr-2 h-4 w-4"/>}
            {resolveLanguageKey("unpin")}
            <ContextMenuShortcut>⌘{shortcut}</ContextMenuShortcut>
        </ContextMenuItem>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/messages/message/contextActions/unpinMessage.tsx"),
    withAxios(
        {
            url: "/api/user/chats/messages/pin",
            method: "DELETE",
            data: {

            }
        },
        true
    ),
    withDebug(true, true)
)(UnpinMessage);