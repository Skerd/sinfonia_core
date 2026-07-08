import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {setActionMessage} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {Reply} from "lucide-react";
import {ContextMenuItem, ContextMenuShortcut} from "@coreModule/components/ui/context-menu.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {useDispatch} from "react-redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {MessageType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";

type ReplyMessageProps = WithLanguageType & {
    message: MessageType
}

function ReplyMessage({
    resolveLanguageKey,
    message
}: ReplyMessageProps) {

    const {write} = useAccess("messages");
    const dispatch = useDispatch();

    const shortcut = "1";
    const replyToMessage = () => {
        if( !write || !write.replyTo ) return;
        dispatch(setActionMessage({message, action: "reply"}));
    }
    useKeyboardShortcuts(shortcut, replyToMessage)

    if( !write || !write.replyTo ){
        return <HiddenElement />
    }

    return (
        <ContextMenuItem onClick={(e) => {e.stopPropagation(); replyToMessage();}} className="hover:cursor-pointer">
            <Reply className="mr-2 h-4 w-4" />
            {resolveLanguageKey("reply")}
            <ContextMenuShortcut>⌘{shortcut}</ContextMenuShortcut>
        </ContextMenuItem>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/messages/message/contextActions/replyMessage.tsx"),
    withDebug(true, true)
)(ReplyMessage);