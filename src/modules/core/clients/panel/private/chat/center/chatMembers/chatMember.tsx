import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import CustomAvatar from "@coreModule/components/custom/customAvatar.tsx";
import {DropdownMenu, DropdownMenuContent, DropdownMenuTrigger} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {ChevronDown, Flag, Users} from "lucide-react";
import ChatMemberInfo from "@coreModule/clients/panel/private/chat/center/chatMembers/dropdown/chatMemberInfo.tsx";
import ChatMemberRemoveFromGroup from "@coreModule/clients/panel/private/chat/center/chatMembers/dropdown/chatMemberRemoveFromGroup.tsx";
import {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import PromoteToAdmin from "@coreModule/clients/panel/private/chat/center/chatMembers/dropdown/promoteToAdmin.tsx";
import {ChannelUser} from "armonia/src/modules/core/types";
import DemoteToUser from "@coreModule/clients/panel/private/chat/center/chatMembers/dropdown/demoteToUser.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {Avatar} from "@coreModule/components/ui/avatar.tsx";
import {getName} from "@coreModule/helpers/general";
import {cn} from "@coreModule/components/lib/utils.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";

type ChatMemberProps = WithLanguageType & {
    member: ChannelUser,
    whoAmI: ChannelUser,
    channel: Channel;
    hasSeparator: boolean,
}

function ChatMember({
    resolveLanguageKey,
    channel,
    member,
    whoAmI,
    hasSeparator,
}: ChatMemberProps) {

    const {read} = useAccess("channels");
    const sanitizedUsers = read?.users?.keys || {};

    return (
        <>
            <div className={cn("flex items-center", {"mb-2": hasSeparator})}>
                <div className="flex items-center grow space-x-2">
                    <HiddenElement Render={<Avatar className="flex items-center justify-center border size-10"><Users size={18} /></Avatar>}>
                        {
                            sanitizedUsers.photo &&
                            <CustomAvatar user={member} avatarClassName="size-10"/>
                        }
                    </HiddenElement>
                    <HiddenElement>
                        {
                            (sanitizedUsers.name || sanitizedUsers.surname || sanitizedUsers.fullName) &&
                            <p className="text-muted-foreground">{getName(member)}</p>
                        }
                    </HiddenElement>
                </div>
                <div className="flex items-center space-x-1">
                    {/*<pre>{JSON.stringify(whoAmI, null, 2)}</pre>*/}
                    <HiddenElement>
                        {
                            (read.owner && read.adminUsers) &&
                            <>
                                {
                                    !!whoAmI?.userType && whoAmI?.userType === "user" ?
                                    <div className="pe-2">
                                        {
                                            !!member.userType &&
                                            <p className="text-muted-foreground text-sm">{resolveLanguageKey(member.userType)}</p>
                                        }
                                    </div>
                                    :
                                    <div className="pe-2">
                                        {
                                            (member._id === whoAmI?._id || member?.userType === "owner") ?
                                            <div className="flex items-center space-x-1">
                                                <p className="text-muted-foreground text-sm">{resolveLanguageKey(member.userType!)}</p>
                                                {
                                                    member.userType === "owner" &&
                                                    <Button size="icon" variant='ghost'>
                                                        <Flag className='stroke-muted-foreground sm:size-5' />
                                                    </Button>
                                                }
                                            </div>
                                            :
                                            <div className="flex items-center space-x-0 ">
                                                <p className="text-muted-foreground text-sm">{resolveLanguageKey(member.userType!)}</p>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size='icon' variant='ghost'>
                                                            <ChevronDown className='stroke-muted-foreground sm:size-5'/>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-fit" align="start">
                                                        <ChatMemberInfo
                                                            specificUserId={member._id}
                                                            member={member}
                                                        />
                                                        <ChatMemberRemoveFromGroup
                                                            channel={channel}
                                                            member={member}
                                                        />
                                                        {
                                                            whoAmI?.userType === "owner" &&
                                                            <>
                                                                {
                                                                    member.userType === "admin" ?
                                                                    <DemoteToUser
                                                                        channel={channel}
                                                                        member={member}
                                                                    />
                                                                    :
                                                                    <PromoteToAdmin
                                                                        channel={channel}
                                                                        member={member}
                                                                    />
                                                                }
                                                            </>
                                                        }
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        }
                                    </div>
                                }
                            </>
                        }
                    </HiddenElement>
                </div>
            </div>
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/chatMembers/chatMember.tsx"),
    withDebug(true, true)
)(ChatMember);