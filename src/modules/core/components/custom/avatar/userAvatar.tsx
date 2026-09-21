import {ChannelUser} from "armonia/src/modules/core/types";
import {MessageSenderType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import {SimpleUserType} from "armonia/src/modules/core/api/company/private/users/simpleUsers.form.response.type.ts";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {getName, NamedUser} from "@coreModule/helpers/general/names.ts";
import {MediaAvatar} from "@coreModule/components/viewEngine/widgets/display/mediaAvatar.tsx";

type AvatarUser = ChannelUser | MessageSenderType | SimpleUserType;

type UserAvatarProps = {
    /** Sizing and layout for the avatar itself; it is the element callers lay out. */
    avatarClassName?: string;
    user?: AvatarUser;
    /** When given the avatar becomes a real button, so it is reachable by keyboard. */
    onClick?: () => void;
};

/**
 * Leading letters of the name and surname ("AB"). `Array.from` so a name starting with an
 * astral character (an emoji, or scripts outside the BMP) yields that character, not half of it.
 */
function getInitials(user: NamedUser): string {
    return [user.name, user.surname]
        .map((part) => Array.from(part?.trim() ?? "")[0] ?? "")
        .join("")
        .toUpperCase();
}

/**
 * A person's avatar: their photo (or their initials), their name in a tooltip, optionally clickable.
 *
 * For a bare media thumbnail inside a table, use `tableAvatar` instead — it opens a lightbox and
 * suppresses row activation.
 */
export function UserAvatar({avatarClassName, user, onClick}: UserAvatarProps) {
    const interactive = typeof onClick === "function";
    const fullName = getName(user);

    const avatar = (
        <MediaAvatar
            mediaId={user?.photo}
            // The person's name, not "<name> profile photo": screen readers already announce that
            // this is an image, and an unnamed user used to produce a stray " profile photo".
            alt={fullName}
            fallback={user ? getInitials(user) || undefined : undefined}
            className={cn(
                interactive && "hover:cursor-pointer hover:border-muted-foreground",
                avatarClassName,
            )}
        />
    );

    // No user means no name to show and nothing to open: render the placeholder plainly.
    if (!user) return avatar;

    return (
        <TooltipDisplayer tooltip={fullName || undefined}>
            {interactive ? (
                <button
                    type="button"
                    // Without this the button has no accessible name whenever the photo is missing
                    // or fails to load, since the fallback is initials or an icon, not alt text.
                    aria-label={fullName || undefined}
                    className="inline-flex shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={onClick}
                >
                    {avatar}
                </button>
            ) : (
                // Deliberately no wrapper element: `MediaAvatar` forwards the tooltip trigger's ref
                // and props to the avatar itself. A wrapper `div` used to sit here and silently
                // swallow the caller's layout classes — `avatarClassName="shrink-0 self-end"` landed
                // on the avatar while the *div* was the flex item, so a message from a known sender
                // aligned differently than the same avatar rendered without a user.
                avatar
            )}
        </TooltipDisplayer>
    );
}

export default UserAvatar;
