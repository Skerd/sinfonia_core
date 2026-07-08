import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Crown} from "lucide-react";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useImperativeHandle} from "react";
import {useDispatch} from "react-redux";
import {ChannelUser} from "armonia/src/modules/core/types";
import {promoteToAdmin as promoteToAdminAction} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {MakeUserChannelAdminFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/makeUserChannelAdmin.form.response.type.ts";
import {MakeUserChannelAdminFormType} from "armonia/src/modules/core/api/user/private/chats/channels/makeUserChannelAdmin.form.type.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type PromoteToAdminProps = WithLanguageType & WithAxiosType<MakeUserChannelAdminFormResponseType, MakeUserChannelAdminFormType> & {
    channel: Channel,
    member: ChannelUser
}

function PromoteToAdmin({
    resolveLanguageKey,
    onFilterChange,
    channel,
    member,
    loading,
    innerRef
}: PromoteToAdminProps) {

    const {write} = useAccess("channels");
    const dispatch = useDispatch();
    const promoteToAdmin = () => {
        if( !loading ){
            onFilterChange({
                channelId: channel._id,
                userId: member._id
            })
        }
    }
    const shortcut = "3";
    useKeyboardShortcuts(shortcut, () => {promoteToAdmin(); })

    useImperativeHandle(innerRef, () => ({
        success: (data) => {
            dispatch(promoteToAdminAction(data));
            if( data.messageId ){
                // dispatch(addMessages({messages: [{id: data.messageId}], startOrEnd: "end"}));
            }
        }
    }))

    if( !write || !write.adminUsers ){
        return <HiddenElement />
    }

    return (
        <DropdownMenuItem disabled={loading} onClick={(e) => {e.preventDefault(); e.stopPropagation(); promoteToAdmin();}}>
            <Crown color="green"/>
            {resolveLanguageKey("makeAdmin")}
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/chatMembers/dropdown/promoteToAdmin.tsx"),
    withAxios(
        {
            url: "/api/user/chats/channels/admins",
            method: "PUT",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(PromoteToAdmin);