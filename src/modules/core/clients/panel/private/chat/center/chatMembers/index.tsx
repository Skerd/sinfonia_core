import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import {useEffect, useState} from "react";
import ChatMember from "@coreModule/clients/panel/private/chat/center/chatMembers/chatMember.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useDispatch, useSelector} from "react-redux";
import AddMember from "@coreModule/clients/panel/private/chat/center/chatMembers/addMember";
import {updateChannelUsers} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import NoData from "@coreModule/components/custom/noData.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {ChannelUser} from "armonia/src/modules/core/types";
import {AllChannelMembersFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/allChannelMembers.form.response.type.ts";
import {AllChannelMembersFormType} from "armonia/src/modules/core/api/user/private/chats/channels/allChannelMembers.form.type.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type ChatMembersProps = WithLanguageType & WithAxiosType<AllChannelMembersFormResponseType, AllChannelMembersFormType> & {
    channel: Channel;
};

function ChatMembers({
    resolveLanguageKey,
    onFilterChange,
    data,
    loading,
    error,
    channel
}: ChatMembersProps) {

    const {read} = useAccess("channels");
    const user = useSelector((state: RootState) => state.authentication.user);
    const dispatch = useDispatch();
    const [forceReload, setForceReload] = useState<number>(1);
    const [whoAmI, setWhoAmI] = useState<ChannelUser | null>(null);

    useEffect(() => {
        if( !read ) return;
        onFilterChange({
            channelId: channel._id
        });
    }, [forceReload, read]);

    useEffect(() => {
        if( !!data && !!data.members ){
            dispatch(updateChannelUsers({channelId: channel._id, users: data.members}));
            setWhoAmI(data.members.find((member) => member._id === user.id) ?? null);
        }
    }, [data, user]);

    if( !read){
        return <HiddenElement />
    }
    if( loading){
        return (
            <Loader />
        )
    }
    if( error ){
        return (
            <SimpleError
                title={resolveLanguageKey("failTitle")}
                description={resolveLanguageKey("failTitleTooltip")}
                onClick={() => setForceReload(Date.now())}
            />
        )
    }
    if( !data || !data.members || !data.members.length ){
        return (
            <NoData title={resolveLanguageKey("noData")} />
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="flex items-center justify-between mt-1">
                        <p>{resolveLanguageKey("title")}</p>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[30dvh] overflow-y-auto">
                {
                    channel?.users?.map((member, index) => {
                        return (
                            <div>
                                <ChatMember
                                    channel={channel}
                                    whoAmI={whoAmI}
                                    member={member}
                                    key={member._id + "_" + index}
                                    hasSeparator={index !== (data.members?.length - 1)}
                                />
                            </div>
                        )
                    })
                }
            </CardContent>
            {
                channel?.users?.some((channelUser) => channelUser._id === user.id && channelUser.userType !== "user") &&
                <CardFooter>
                    <AddMember channel={channel}/>
                </CardFooter>
            }
        </Card>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/chatMembers/index.tsx"),
    withAxios(
        {
            url: "/api/user/chats/channels/members",
            method: "POST",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(ChatMembers);

