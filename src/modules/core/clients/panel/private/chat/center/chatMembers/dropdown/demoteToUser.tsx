import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {CornerRightDown} from "lucide-react";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import {ChannelUser} from "armonia/src/modules/core/types";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {useImperativeHandle} from "react";
import {useDispatch} from "react-redux";
import {demoteToUser as demoteToUserAction} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {RemoveUserFromChannelAdminFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/removeUserFromChannelAdmin.form.response.type.ts";
import {RemoveUserFromChannelAdminFormType} from "armonia/src/modules/core/api/user/private/chats/channels/removeUserFromChannelAdmin.form.type.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type DemoteToUserProps = WithLanguageType & WithAxiosType<RemoveUserFromChannelAdminFormResponseType, RemoveUserFromChannelAdminFormType> & {
    channel: Channel,
    member: ChannelUser
}

function DemoteToUser({
    resolveLanguageKey,
    loading,
    onFilterChange,
    channel,
    member,
    innerRef
}:DemoteToUserProps){

    const {write} = useAccess("channels");
    const dispatch = useDispatch();
    const demoteUser = () => {
        if( !loading ){
            onFilterChange({
                channelId: channel._id,
                userId: member._id
            })
        }
    }

    const shortcut = "3";
    useKeyboardShortcuts(shortcut, () => {demoteUser(); })

    useImperativeHandle(innerRef, () => ({
        success: (data) => {
            dispatch(demoteToUserAction(data));
            if( data.messageId ){
                // dispatch(addMessages({messages: [{id: data.messageId}], startOrEnd: "end"}));
            }
        }
    }));

    if( !write || !write.adminUsers ){
        return <HiddenElement />
    }

    return (
        <>
            <DropdownMenuItem onClick={(e) => {e.preventDefault(); e.stopPropagation(); demoteUser(); }}>
                <CornerRightDown color="red"/>
                {resolveLanguageKey("removeFromAdmin")}
                <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
            </DropdownMenuItem>
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/chatMembers/dropdown/demoteToUser.tsx"),
    withAxios(
        {
            url: "/api/user/chats/channels/admins",
            method: "DELETE",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(DemoteToUser);