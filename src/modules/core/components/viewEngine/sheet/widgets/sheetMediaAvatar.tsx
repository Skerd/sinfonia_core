import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

export type SheetMediaAvatarProps = {
    /** Resolved media id (string or stringified ObjectId). */
    mediaId: string;
    /** Display name for `alt` and two-letter fallback. */
    name: string;
    className?: string;
    imageClassName?: string;
};

/**
 * Read-only sheet widget: same pattern as list cards (e.g. company card) when the API returns a media
 * id string instead of a populated `Media` object — `/api/auxiliary/media/:id` for the image.
 */
export default function SheetMediaAvatar({mediaId, name, className, imageClassName}: SheetMediaAvatarProps) {
    const initial = name.trim().length >= 2 ? name.trim().substring(0, 2) : (name.trim().charAt(0) || "?");
    return (
        <Avatar
            className={cn(
                // `Avatar` defaults to `display:flex` (block-level): `width:auto` then fills the parent.
                // `inline-flex` shrink-wraps so the circle stays a fixed `size-*` instead of going full width.
                // `aspect-square` + `size-*` keeps it round in flex row layouts too.
                "box-border inline-flex aspect-square size-12 flex-none self-start overflow-hidden rounded-full border-2 border-background shadow-md",
                className,
            )}
        >
            <AvatarImage
                className={cn("h-full w-full rounded-full object-cover", imageClassName)}
                src={`/api/auxiliary/media/${mediaId}`}
                alt={name}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">{initial}</AvatarFallback>
        </Avatar>
    );
}
