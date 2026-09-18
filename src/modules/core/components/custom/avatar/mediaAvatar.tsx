import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {User} from "lucide-react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {MEDIA_BASE_URL} from "@baseModule/helpers/constants/media.constants.ts";

type MediaAvatarProps = {
    /** Media id; the person-icon fallback shows when absent. */
    mediaId?: string | null;
    alt?: string;
    className?: string;
    iconSize?: number;
};

/**
 * Shared shell for every avatar in the app: a shadcn `Avatar` showing a privately-served
 * media id, falling back to a person icon.
 *
 * `userAvatar` (identity + tooltip) and `tableAvatar` (thumbnail + lightbox) both render this,
 * so the border, sizing and fallback stay identical between them.
 */
export function MediaAvatar({mediaId, alt = "", className, iconSize = 18}: MediaAvatarProps) {
    return (
        <Avatar className={cn("flex items-center justify-center border size-10", className)}>
            {mediaId ? <AvatarImage src={`${MEDIA_BASE_URL}${mediaId}`} alt={alt}/> : null}
            <AvatarFallback>
                <User size={iconSize}/>
            </AvatarFallback>
        </Avatar>
    );
}

export default MediaAvatar;
