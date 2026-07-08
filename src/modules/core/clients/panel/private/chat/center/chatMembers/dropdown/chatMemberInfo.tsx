import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Info} from "lucide-react";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useState} from "react";
import {Dialog, DialogContent} from "@coreModule/components/ui/dialog.tsx";
import {UserProfile} from "@coreModule/clients/panel/private/users/center/cardView";
import {ChannelUser} from "armonia/src/modules/core/types";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type ChatMemberInfoProps = WithLanguageType & {
    specificUserId: string,
    member: ChannelUser
}

function ChatMemberInfo({
    resolveLanguageKey,
    member
}: ChatMemberInfoProps){

    const {read} = useAccess("users");
    const [open, setOpen] = useState<boolean>(false);

    const shortcut = "1";
    useKeyboardShortcuts(shortcut, () => {setOpen(true); })

    if( !read ){
        return <HiddenElement />
    }

    return (
        <>
            <DropdownMenuItem onClick={(event) => {event.preventDefault(); setOpen(true);}}>
                <Info />
                {resolveLanguageKey("info")}
                <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 border-0">
                    <UserProfile specificUserId={member._id} />
                </DialogContent>
            </Dialog>
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/chatMembers/dropdown/chatMemberInfo.tsx"),
    withDebug(true, true)
)(ChatMemberInfo)