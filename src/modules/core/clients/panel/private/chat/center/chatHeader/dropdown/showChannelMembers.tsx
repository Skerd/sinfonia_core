import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {useState} from "react";
import {Dialog, DialogContent} from "@coreModule/components/ui/dialog.tsx";
import {Users} from "lucide-react";
import {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import ChatMembers from "@coreModule/clients/panel/private/chat/center/chatMembers";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type ShowChannelMembersProps = WithLanguageType & {
    channel: Channel
}

function ShowChannelMembers({
    channel,
    resolveLanguageKey
}: ShowChannelMembersProps) {

    const {read} = useAccess("channels");
    const [openMembers, setOpenMembers] = useState<boolean>(false);

    useKeyboardShortcuts("1", () => {setOpenMembers(true);})

    if( !read || !read.users ){
        return <HiddenElement />
    }

    return (
        <>
            <DropdownMenuItem onClick={(event) => {event.preventDefault(); setOpenMembers(true)}}>
                <Users />
                {resolveLanguageKey("members")}
                <DropdownMenuShortcut>⌘1</DropdownMenuShortcut>
            </DropdownMenuItem>

            <Dialog open={openMembers} onOpenChange={setOpenMembers}>
                <DialogContent className="p-0 border-0">
                    <ChatMembers channel={channel} />
                </DialogContent>
            </Dialog>
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/chatHeader/dropdown/showChannelMembers.tsx"),
    withDebug(true, true)
)(ShowChannelMembers);