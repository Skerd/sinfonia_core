import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {Pencil} from "lucide-react";
import {ContextMenuItem, ContextMenuShortcut} from "@coreModule/components/ui/context-menu.tsx";
import {useDispatch} from "react-redux";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {setActionMessage} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {MessageType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";

type EditMessageProps = WithLanguageType & {
    message: MessageType,
}

function EditMessage({
    message,
    resolveLanguageKey
}: EditMessageProps) {

    const {write} = useAccess("messages");
    const dispatch = useDispatch();

    const shortcut = "0";
    const editMessage = () => {
        if( !write || !write.text ) return;
        dispatch(setActionMessage({message, action: "edit"}));
    }
    useKeyboardShortcuts(shortcut, editMessage)

    if( !write || !write.text ){
        return <HiddenElement />
    }

    return (
        <ContextMenuItem onClick={(e) => {e.stopPropagation(); editMessage();}} className="hover:cursor-pointer">
            <Pencil className="mr-2 h-4 w-4" />
            {resolveLanguageKey("edit")}
            <ContextMenuShortcut>⌘{shortcut}</ContextMenuShortcut>
        </ContextMenuItem>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/messages/message/contextActions/editMessage.tsx"),
    withDebug(true, true)
)(EditMessage);