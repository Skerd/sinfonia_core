import {ChannelUser} from "armonia/src/modules/core/types";
import {MessageSenderType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import {SimpleUserType} from "armonia/src/modules/core/api/company/private/users/simpleUsers.form.response.type.ts";
import TooltipDisplayer from "@baseModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {getName} from "@baseModule/helpers/general/names.ts";
import {MediaAvatar} from "@coreModule/components/custom/avatar/mediaAvatar.tsx";

type AvatarUser = ChannelUser | MessageSenderType | SimpleUserType;

type UserAvatarProps = {
    avatarClassName?: string;
    user?: AvatarUser;
    /** When given the avatar becomes a real button, so it is reachable by keyboard. */
    onClick?: () => void;
};

/**
 * A person's avatar: their photo (or a person icon), their name in a tooltip, optionally clickable.
 *
 * For a bare media thumbnail inside a table, use `tableAvatar` instead — it opens a lightbox and
 * suppresses row activation.
 */
export function UserAvatar({avatarClassName, user, onClick}: UserAvatarProps) {
    const interactive = typeof onClick === "function";
    const avatar = (
        <MediaAvatar
            mediaId={user?.photo}
            alt={user ? `${getName(user)} profile photo` : ""}
            className={cn(
                interactive && "hover:cursor-pointer hover:border-muted-foreground",
                avatarClassName,
            )}
        />
    );

    // No user means no name to show and nothing to open: render the placeholder plainly.
    if (!user) return avatar;

    const fullName = getName(user).trim();

    return (
        <TooltipDisplayer tooltip={fullName || undefined}>
            {interactive ? (
                <button type="button" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onClick}>
                    {avatar}
                </button>
            ) : (
                <div>{avatar}</div>
            )}
        </TooltipDisplayer>
    );
}

export default UserAvatar;
