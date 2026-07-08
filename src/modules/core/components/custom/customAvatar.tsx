import {ChannelUser} from "armonia/src/modules/core/types";
import {compose} from "redux";
import {AvatarImage, Avatar, AvatarFallback} from "@coreModule/components/ui/avatar.tsx";
import {User} from "lucide-react";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {MessageSenderType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import {SimpleUserType} from "armonia/src/modules/core/api/company/private/users/simpleUsers.form.response.type.ts";

type CustomAvatarProps = {
    avatarClassName?: string,
    user?: ChannelUser | MessageSenderType | SimpleUserType,
    mediaPath?: string,
    onClick?: Function
}
function CustomAvatar({
    avatarClassName = "",
    user,
    mediaPath = "/api/auxiliary/media/",
    onClick = () => {}
}: CustomAvatarProps) {

    if( !user ){
        return (
            <Avatar className={cn("flex items-center justify-center border size-10 hover:cursor-pointer", avatarClassName)}>
                <User size={18} />
            </Avatar>
        );
    }

    const hasPhoto = Boolean(user?.photo);

    return (
        <TooltipDisplayer tooltip={`${user?.name ?? ""} ${user?.surname ?? ""}`.trim() || undefined}>
            <Avatar className={cn("flex items-center justify-center border hover:border-muted-foreground size-10 hover:cursor-pointer", avatarClassName)} onClick={() => {onClick?.()}}>
                {hasPhoto && <AvatarImage src={`${mediaPath}${user.photo}`} alt={user?.name + " " + user?.surname + " profile photo"} />}
                <AvatarFallback>
                    <User size={18} />
                </AvatarFallback>
            </Avatar>
        </TooltipDisplayer>
    )
}

export default compose()(CustomAvatar)

