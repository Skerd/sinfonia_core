import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {useEffect, useState} from "react";
import {ArrowLeft, Globe, MoreVertical} from "lucide-react";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Avatar} from "@coreModule/components/ui/avatar.tsx";
import {DropdownMenu, DropdownMenuContent, DropdownMenuTrigger} from "@coreModule/components/ui/dropdown-menu.tsx";
import CustomAvatar from "@coreModule/components/custom/customAvatar.tsx";
import {ChannelUser} from "armonia/src/modules/core/types";
import {Dialog, DialogContent} from "@coreModule/components/ui/dialog.tsx";
import {UserProfile} from "@coreModule/clients/panel/private/users/center/cardView";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {openChannel} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {getName} from "@coreModule/helpers/general";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import ReleaseToBot from "@coreModule/clients/panel/private/websiteChats/center/releaseToBot.tsx";
import ClosePublicChat from "@coreModule/clients/panel/private/websiteChats/center/closePublicChat.tsx";

function WebsiteChatHeader({}: WithLanguageType) {
    const {read, write} = useAccess("channels");
    const canAct = write === true || (!!write && typeof write === "object" && !!write.users);
    const dispatch = useDispatch();
    const activeChannelId = useSelector((state: RootState) => state.chat.activeChannelId);
    const channel = useSelector((state: RootState) => state.chat.channels[activeChannelId ?? ""]);
    const user = useSelector((state: RootState) => state.authentication.user);

    const [avatarUser, setAvatarUser] = useState<ChannelUser | null>(null);
    const [viewChannelUserId, setViewChannelUserId] = useState<string | false>(false);

    useEffect(() => {
        if (channel?.users) {
            setAvatarUser(channel.users.find((u) => u._id !== user.id) || null);
        }
    }, [channel, user.id]);

    if (!activeChannelId || !channel) {
        return <></>;
    }
    if (!read) {
        return <HiddenElement />;
    }

    const title = channel.name || (avatarUser ? getName(avatarUser) : "");

    return (
        <div className="bg-card mb-1 flex flex-none items-center justify-between py-1.5 md:p-2 shadow-lg sm:rounded-t-md">
            <div className="flex">
                <div className="sm:hidden">
                    <Button size="icon" variant="ghost" className="h-full" onClick={() => {dispatch(openChannel(null));}}>
                        <ArrowLeft className="rtl:rotate-180" />
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    {avatarUser ? (
                        <CustomAvatar user={avatarUser} onClick={() => {setViewChannelUserId(avatarUser._id);}} />
                    ) : (
                        <Avatar className="flex size-10 items-center justify-center border">
                            <Globe size={18} />
                        </Avatar>
                    )}
                    <p className="text-sm font-medium lg:text-base">{title}</p>
                </div>
            </div>

            {canAct && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                            <MoreVertical className="stroke-muted-foreground sm:size-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-fit" align="start">
                        <ReleaseToBot channel={channel} />
                        <ClosePublicChat channel={channel} />
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            <Dialog open={!!viewChannelUserId} onOpenChange={(open) => { if (!open) {setViewChannelUserId(false);} }}>
                <DialogContent className="p-0 border-0">
                    <UserProfile
                        specificUserId={viewChannelUserId !== user.id ? viewChannelUserId : viewChannelUserId}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/websiteChats/center/chatHeader.tsx"),
    withDebug(true, true),
)(WebsiteChatHeader);
