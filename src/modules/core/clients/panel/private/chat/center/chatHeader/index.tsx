import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {useEffect, useState} from "react";
import {ArrowLeft, MoreVertical, User} from "lucide-react";
import {RootState} from "@baseModule/helpers/redux/store/generalStore.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {AvatarGroup, AvatarGroupTooltip} from "@coreModule/components/animate-ui/components/animate/avatar-group.tsx";
import {DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger} from "@coreModule/components/ui/dropdown-menu.tsx";
import UserAvatar from "@baseModule/components/custom/avatar/userAvatar.tsx";
import {ChannelUser} from "armonia/src/modules/core/types";
import {Card} from "@coreModule/components/ui/card.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import {Dialog, DialogContent} from "@coreModule/components/ui/dialog.tsx";
import {UserProfile} from "@coreModule/clients/panel/private/users/center/cardView";
import LeaveChannel from "@coreModule/clients/panel/private/chat/center/chatHeader/dropdown/leaveChannel.tsx";
import ShowChannelMembers from "@coreModule/clients/panel/private/chat/center/chatHeader/dropdown/showChannelMembers.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import {openChannel} from "@baseModule/helpers/redux/slices/chatSlice.ts";
import HiddenElement from "@baseModule/components/custom/hiddenElement.tsx";
import {getName} from "@baseModule/helpers/general/names.ts";
import {useAccess} from "@baseModule/helpers/hooks/useAccess.ts";
import {MEDIA_BASE_URL} from "@baseModule/helpers/constants/media.constants.ts";

type MessageHeaderProps = {
    defaultTitle: string
};
const howManyAvatars = 5;

function ChatHeader({}: MessageHeaderProps ){

    const {read, delete: canDeleteChannel} = useAccess("channels");
    const dispatch = useDispatch();
    const activeChannelId = useSelector((state: RootState) => state.chat.activeChannelId);
    const channel = useSelector((state: RootState) => state.chat.channels[activeChannelId ?? ""]);
    const user = useSelector((state: RootState) => state.authentication.user);

    const [avatarUser, setAvatarUser] = useState<ChannelUser | null>(null);
    const [viewChannelUserId, setViewChannelUserId] = useState<string | false>(false);

    useEffect(() => {
        if( !!channel && !!channel.users ){
            setAvatarUser(channel.users.find(u => u._id !== user.id) || null);
        }
    }, [channel]);

    if( !activeChannelId || !channel ){
        return <></>
    }
    if( !read ){
        return <HiddenElement />
    }

    const groupUsers = channel.users ?? [];
    const visibleGroupUsers = groupUsers.slice(0, howManyAvatars);
    const overflowGroupUsers = groupUsers.slice(howManyAvatars);

    return (
        <div className='bg-card mb-1 flex flex-none items-center justify-between overflow-visible pt-3 pb-1.5 md:px-2 md:pb-2 shadow-lg sm:rounded-t-md'>

            <div className='flex'>
                <div className="sm:hidden">
                    <Button size='icon' variant='ghost' className='h-full' onClick={() => {dispatch(openChannel(null));}}>
                        <ArrowLeft className='rtl:rotate-180' />
                    </Button>
                </div>
                <div className='flex items-center gap-2'>
                    <HiddenElement>
                        {
                            read.users &&
                            <>
                                {
                                    channel.metaData.isGroup ?
                                    <AvatarGroup className="relative z-20 h-10 -space-x-3 overflow-visible" translate="-12px">
                                        {[
                                            ...visibleGroupUsers.map((channelUser) => {
                                                const fullName = getName(channelUser);
                                                return (
                                                    <Avatar
                                                        key={channelUser._id}
                                                        className="size-10 border-2 border-background hover:cursor-pointer"
                                                        onClick={() => {setViewChannelUserId(channelUser._id)}}
                                                    >
                                                        {
                                                            channelUser.photo
                                                            ? <AvatarImage src={`${MEDIA_BASE_URL}${channelUser.photo}`} alt={`${fullName} profile photo`} />
                                                            : null
                                                        }
                                                        <AvatarFallback>
                                                            <User size={18} />
                                                        </AvatarFallback>
                                                        <AvatarGroupTooltip>
                                                            {fullName}
                                                        </AvatarGroupTooltip>
                                                    </Avatar>
                                                );
                                            }),
                                            ...(
                                                overflowGroupUsers.length > 0
                                                ? [
                                                    <Popover key="overflow">
                                                        <PopoverTrigger asChild>
                                                            <Avatar className="size-10 border-2 border-background bg-muted hover:cursor-pointer">
                                                                <AvatarFallback className="bg-muted text-sm text-muted-foreground">
                                                                    +{overflowGroupUsers.length}
                                                                </AvatarFallback>
                                                                <AvatarGroupTooltip>
                                                                    +{overflowGroupUsers.length}
                                                                </AvatarGroupTooltip>
                                                            </Avatar>
                                                        </PopoverTrigger>
                                                        <PopoverContent asChild>
                                                            <Card className="flex w-fit items-center gap-2 max-h-80 overflow-y-auto">
                                                                {
                                                                    overflowGroupUsers.map((channelUser) => (
                                                                        <UserAvatar
                                                                            key={channelUser._id}
                                                                            user={channelUser}
                                                                            onClick={() => {setViewChannelUserId(channelUser._id)}}
                                                                        />
                                                                    ))
                                                                }
                                                            </Card>
                                                        </PopoverContent>
                                                    </Popover>,
                                                ]
                                                : []
                                            ),
                                        ]}
                                    </AvatarGroup>
                                    :
                                    <>
                                        {
                                            !!avatarUser &&
                                            <UserAvatar user={avatarUser} onClick={() => {setViewChannelUserId(avatarUser._id)}}/>
                                        }
                                    </>
                                }
                            </>
                        }
                    </HiddenElement>
                    {
                        (channel.metaData.isGroup) ?
                        <HiddenElement>
                            {
                                read.name &&
                                <p className='text-sm font-medium lg:text-base'>{channel.name}</p>
                            }
                        </HiddenElement>
                        :
                        <HiddenElement>
                            {
                                read.users &&
                                <>
                                    {
                                        !!avatarUser &&
                                        <p className='text-sm font-medium lg:text-base'>{getName(avatarUser)}</p>
                                    }
                                </>
                            }
                        </HiddenElement>
                    }
                </div>
            </div>

            {
                (read.users || canDeleteChannel) &&
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size='icon' variant='ghost'>
                            <MoreVertical className='stroke-muted-foreground sm:size-5' />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-fit" align="start">
                        {
                            read.users && channel.metaData.isGroup && !channel.metaData.readOnly &&
                            <>
                                <ShowChannelMembers channel={channel}/>
                                <DropdownMenuSeparator />
                            </>
                        }
                        {
                            canDeleteChannel &&
                            <LeaveChannel channel={channel}/>
                        }
                    </DropdownMenuContent>
                </DropdownMenu>
            }

            <Dialog open={!!viewChannelUserId} onOpenChange={(open) => { if( !open ){setViewChannelUserId(false);} }}>
                <DialogContent className="p-0 border-0">
                    <UserProfile
                        specificUserId={viewChannelUserId !== user.id ? viewChannelUserId : viewChannelUserId}
                    />
                </DialogContent>
            </Dialog>

        </div>
    )
}

export default compose(
    withDebug(true, true, "channels")
)(ChatHeader);