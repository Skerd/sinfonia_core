import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {setActionMessage} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {Forward} from "lucide-react";
import {ContextMenuItem, ContextMenuShortcut} from "@coreModule/components/ui/context-menu.tsx";
import {useDispatch} from "react-redux";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {MessageType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";

type ForwardMessageProps = WithLanguageType & {
    message: MessageType
}

function ForwardMessage({
    resolveLanguageKey,
    message
}: ForwardMessageProps) {

    const {write} = useAccess("messages");
    const dispatch = useDispatch();

    const shortcut = "2";
    const forwardMessage = () => {
        if( !write || !write.forwardedText ) return;
        dispatch(setActionMessage({message, action: "forward"}));
    }
    useKeyboardShortcuts(shortcut, forwardMessage)

    if( !write || !write.forwardedText ){
        return <HiddenElement />
    }

    return (
        <ContextMenuItem onClick={(e) => {e.stopPropagation(); forwardMessage();}} className="hover:cursor-pointer">
            <Forward className="mr-2 h-4 w-4" />
            {resolveLanguageKey("forward")}
            <ContextMenuShortcut>⌘{shortcut}</ContextMenuShortcut>
        </ContextMenuItem>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/messages/message/contextActions/forwardMessage.tsx"),
    withDebug(true, true)
)(ForwardMessage);