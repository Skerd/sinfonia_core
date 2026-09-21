import type {ComponentProps, ReactNode} from "react";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {User} from "lucide-react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {MEDIA_BASE_URL} from "@coreModule/helpers/constants/media.constants.ts";

type MediaAvatarProps = Omit<ComponentProps<typeof Avatar>, "children"> & {
    /** Media id; the fallback shows when absent, and when the image fails to load. */
    mediaId?: string | null;
    alt?: string;
    /** Replaces the person icon — `userAvatar` passes initials, so people stay distinguishable. */
    fallback?: ReactNode;
    iconSize?: number;
};

/**
 * Shared shell for every avatar in the app: a shadcn `Avatar` showing a privately-served
 * media id, falling back to initials or a person icon.
 *
 * `userAvatar` (identity + tooltip) and `tableAvatar` (thumbnail + lightbox) both render this,
 * so the border, sizing and fallback stay identical between them.
 *
 * Remaining props (`ref` included) reach the `Avatar` root, so this can be the single child of a
 * Radix `asChild` trigger — a tooltip or popover attaches to the avatar itself, with no wrapper
 * element in between to absorb the caller's layout classes.
 */
export function MediaAvatar({mediaId, alt = "", className, fallback, iconSize = 18, ...props}: MediaAvatarProps) {
    return (
        <Avatar
            className={cn("flex items-center justify-center border size-10", className)}
            {...props}
            /* After the spread on purpose: as a Radix `asChild` trigger this element would
               otherwise inherit the trigger's own `data-slot`, and row activation identifies
               avatars by `[data-slot=avatar]` to keep a click on one from opening the row. */
            data-slot="avatar"
        >
            {mediaId ? <AvatarImage src={`${MEDIA_BASE_URL}${mediaId}`} alt={alt}/> : null}
            <AvatarFallback className="font-medium">
                {fallback ?? <User size={iconSize}/>}
            </AvatarFallback>
        </Avatar>
    );
}

export default MediaAvatar;
