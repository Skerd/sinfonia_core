import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {UserMinus} from "lucide-react";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {useImperativeHandle} from "react";
import {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import {useDispatch} from "react-redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {ChannelUser} from "armonia/src/modules/core/types";
import {removeUsersFromChannel} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {RemoveChannelMembersFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/removeChannelMembers.form.response.type.ts";
import {RemoveChannelMembersFormType} from "armonia/src/modules/core/api/user/private/chats/channels/removeChannelMembers.form.type.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type ChatMemberRemoveFromGroupProps = WithLanguageType & WithAxiosType<RemoveChannelMembersFormResponseType, RemoveChannelMembersFormType> & {
    member: ChannelUser,
    channel: Channel
}

function ChatMemberRemoveFromGroup({
    resolveLanguageKey,
    member,
    channel,
    loading,
    onFilterChange,
    innerRef
}: ChatMemberRemoveFromGroupProps){

    const {write} = useAccess("channels");
    const dispatch = useDispatch();
    const deleteMember = () => {
        if( !loading ){
            onFilterChange({
                channelId: channel._id,
                userIds: [member._id]
            })
        }
    }

    const shortcut = "2";
    useKeyboardShortcuts(shortcut, () => {deleteMember(); })

    useImperativeHandle(innerRef, () => ({
        success: (data) => {
            dispatch(removeUsersFromChannel({data, userId: ""}))
            if( data.messageIds ){
                // dispatch(addMessages({messages: data.messageIds, startOrEnd: "end"}));
            }
        }
    }))

    if( !write || !write.users ){
        return <HiddenElement />
    }

    return (
        <>
            <DropdownMenuItem disabled={loading} onClick={(e) => {e.stopPropagation(); e.preventDefault(); deleteMember();}}>
                <UserMinus color="red" />
                {resolveLanguageKey("removeMember")}
                <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/chatMembers/dropdown/chatMemberRemoveFromGroup.tsx"),
    withAxios(
        {
            url: "/api/user/chats/channels/members",
            method: "DELETE",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(ChatMemberRemoveFromGroup)