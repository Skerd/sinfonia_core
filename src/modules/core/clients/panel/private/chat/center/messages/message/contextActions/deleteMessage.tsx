import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {toggleDeleteMessageId, updateOpenDelete} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {Trash2} from "lucide-react";
import {ContextMenuItem, ContextMenuShortcut} from "@coreModule/components/ui/context-menu.tsx";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type DeleteMessageProps = WithLanguageType & {
    messageId: string,
    shortcutOverride?: string
}

function DeleteMessage({
    resolveLanguageKey,
    messageId,
    shortcutOverride
}: DeleteMessageProps) {

    const {delete: deleteMessage} = useAccess("messages");
    const shortcut = shortcutOverride ?? "5";
    const dispatch = useDispatch();
    const openDelete = useSelector((state: RootState) => state.chat.openDelete);

    const toggleMessageDelete = () => {
        if( !deleteMessage ) return;
        if( !openDelete ) {
            dispatch(updateOpenDelete(true));
        }
        dispatch(toggleDeleteMessageId(messageId));
    }
    useKeyboardShortcuts(shortcut, toggleMessageDelete)

    if( !deleteMessage ){
        return <HiddenElement />
    }

    return (
        <div>
            <ContextMenuItem onClick={() => {toggleMessageDelete()}} className="hover:cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                {resolveLanguageKey("delete")}
                <ContextMenuShortcut>⌘{shortcut}</ContextMenuShortcut>
            </ContextMenuItem>
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/messages/message/contextActions/deleteMessage.tsx"),
    withDebug(true, true)
)(DeleteMessage);