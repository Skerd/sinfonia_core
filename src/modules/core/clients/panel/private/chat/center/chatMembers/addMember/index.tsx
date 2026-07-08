import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {UserPlus} from "lucide-react";
import {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import {useState} from "react";
import AddMembersToChannel from "@coreModule/clients/panel/private/chat/center/chatMembers/addMember/addMembersToChannel.tsx";
import NewChatMembers from "@coreModule/clients/panel/private/chat/center/chatMembers/addMember/newMembers.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type AddMemberProps = WithLanguageType & {
    channel: Channel
}

function AddMember({
    resolveLanguageKey,
    channel
}: AddMemberProps) {

    const {write} = useAccess("channels");
    const [open, setOpen] = useState<boolean>(false);

    if( !write || !write.users ){
        return <HiddenElement />
    }

    return (
        <>
            {
                !open ?
                <div className="flex w-full items-center justify-end">
                    <Button variant="outline" onClick={() => setOpen(true)}>
                        <UserPlus />
                        <p>{resolveLanguageKey("addMember")}</p>
                    </Button>
                </div>
                :
                <div className="w-full">
                    <NewChatMembers
                        channel={channel}
                        users={channel.users?.map((user) => user._id) || []}
                        onOpenChange={setOpen}
                        open={open}
                        ChildComponent={AddMembersToChannel}
                    />
                </div>
            }
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/chatMembers/addMember/index.tsx"),
    withDebug(true, true)
)(AddMember);