import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {SmilePlus} from "lucide-react";
import {ContextMenuItem, ContextMenuShortcut} from "@coreModule/components/ui/context-menu.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type ReactMessageProps = WithLanguageType & {
    openReactionPicker: Function
}

function ReactMessage({
    resolveLanguageKey,
    openReactionPicker = () => {}
}: ReactMessageProps) {

    const {write} = useAccess("messages");
    function reactToMessage() {
        if( !write || !write.reactions ) return;
        openReactionPicker(true);
    }
    const shortcut = "3";
    useKeyboardShortcuts(shortcut, reactToMessage)

    if( !write || !write.reactions ){
        return <HiddenElement />
    }

    return (
        <ContextMenuItem onClick={(e) => {e.stopPropagation(); reactToMessage();}} className="hover:cursor-pointer">
            <SmilePlus className="mr-2 h-4 w-4"/>
            {resolveLanguageKey("react")}
            <ContextMenuShortcut>⌘{shortcut}</ContextMenuShortcut>
        </ContextMenuItem>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/messages/message/contextActions/react.tsx"),
    withDebug(true, true)
)(ReactMessage);