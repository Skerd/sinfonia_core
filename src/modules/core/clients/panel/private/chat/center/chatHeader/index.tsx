import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {useEffect, useState} from "react";
import {ArrowLeft, MoreVertical} from "lucide-react";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Avatar} from "@coreModule/components/ui/avatar.tsx";
import {DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger} from "@coreModule/components/ui/dropdown-menu.tsx";
import CustomAvatar from "@coreModule/components/custom/customAvatar.tsx";
import {ChannelUser} from "armonia/src/modules/core/types";
import {Card} from "@coreModule/components/ui/card.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import {Dialog, DialogContent} from "@coreModule/components/ui/dialog.tsx";
import {UserProfile} from "@coreModule/clients/panel/private/users/center/cardView";
import LeaveChannel from "@coreModule/clients/panel/private/chat/center/chatHeader/dropdown/leaveChannel.tsx";
import ShowChannelMembers from "@coreModule/clients/panel/private/chat/center/chatHeader/dropdown/showChannelMembers.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {openChannel} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {getName} from "@coreModule/helpers/general";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";

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

    return (
        <div className='bg-card mb-1 flex flex-none items-center justify-between py-1.5 md:p-2 shadow-lg sm:rounded-t-md'>

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
                                    channel?.metaData?.isGroup ?
                                    <div className="flex flex-row flex-wrap items-center gap-12">
                                        <div className="*:data-[slot=avatar]:ring-background flex -space-x-4 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
                                            {
                                                channel.users?.map((channelUser, index) => {
                                                    if( index > howManyAvatars && howManyAvatars < channel.users.length ){
                                                        return <></>
                                                    }
                                                    if( index === howManyAvatars){
                                                        return (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Avatar className="flex size-10 items-center justify-center border bg-muted hover:cursor-pointer">
                                                                        +{channel.users.length - howManyAvatars}
                                                                    </Avatar>
                                                                </PopoverTrigger>
                                                                <PopoverContent asChild>
                                                                    <Card className="flex w-fit items-center gap-2 max-h-80 overflow-y-auto">
                                                                        {
                                                                            channel.users.map((channelUser, index) => {
                                                                                if( index >= howManyAvatars ){
                                                                                    return (
                                                                                        <CustomAvatar user={channelUser} onClick={() => {setViewChannelUserId(channelUser._id)}}/>
                                                                                    )
                                                                                }
                                                                                return <></>
                                                                            })
                                                                        }
                                                                    </Card>
                                                                </PopoverContent>
                                                            </Popover>
                                                        )
                                                    }
                                                    return (
                                                        <CustomAvatar user={channelUser} avatarClassName="hover:z-1" onClick={() => {setViewChannelUserId(channelUser._id)}}/>
                                                    )
                                                })
                                            }
                                        </div>
                                    </div>
                                    :
                                    <>
                                        {
                                            !!avatarUser &&
                                            <CustomAvatar user={avatarUser} onClick={() => {setViewChannelUserId(avatarUser._id)}}/>
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
    withDebug(true, true)
)(ChatHeader);