import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {compose} from "redux";
import {Button} from "@coreModule/components/ui/button.tsx";
import {useEffect, useImperativeHandle, useRef} from "react";
import {useDispatch} from "react-redux";
import {updateChannelUsers} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {AddChannelMembersFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/addChannelMembers.form.response.type.ts";
import {AddChannelMembersFormType} from "armonia/src/modules/core/api/user/private/chats/channels/addChannelMembers.form.type.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import {AllChannelMembersFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/allChannelMembers.form.response.type.ts";

type AddMembersToChannelProps = WithLanguageType & WithAxiosType<AddChannelMembersFormResponseType, AddChannelMembersFormType> & {
    channel: Channel;
    fireUpdate?: number;
    handleClose: Function;
    userIds: string[];
};

function AddMembersToChannel({
    resolveLanguageKey,
    channel,
    fireUpdate = 0,
    onFilterChange,
    loading,
    innerRef,
    handleClose,
    userIds = []
}: AddMembersToChannelProps) {

    const {write} = useAccess("channels");
    const dispatch = useDispatch();
    const lastFiredRef = useRef<number>(0);

    useEffect(() => {
        if (!fireUpdate || !channel || fireUpdate === lastFiredRef.current) return;
        lastFiredRef.current = fireUpdate;
        onFilterChange({
            channelId: channel._id,
            userIds
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run only on fireUpdate change
    }, [fireUpdate]);

    useImperativeHandle(innerRef, () => ({
        start: () => {},
        success: (data: AddChannelMembersFormResponseType) => {
            apiClient.post<AllChannelMembersFormResponseType>("/api/user/chats/channels/members", {channelId: data.channelId})
            .then((res) => {
                let {data: membersData} = res;
                dispatch(updateChannelUsers({channelId: data.channelId, users: membersData.members}));
            })
            .catch(() => {})
            handleClose(false);
        }
    }));

    if (!write || !write.users) {
        return <HiddenElement />;
    }

    return (
        <div className="flex items-center space-x-1">
            <Button
                type="button"
                variant="destructive"
                disabled={loading}
                onClick={() => handleClose(false)}
            >
                {resolveLanguageKey("cancel")}
            </Button>
            <div className="flex grow">
                <Button
                    type="submit"
                    variant="default"
                    disabled={userIds.length === 0 || loading}
                    className="w-full"
                >
                    {resolveLanguageKey("addToChat")}
                </Button>
            </div>
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/chatMembers/addMember/addMembersToChannel.tsx"),
    withAxios(
        {
            url: "/api/user/chats/channels/members",
            method: "PUT",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(AddMembersToChannel);