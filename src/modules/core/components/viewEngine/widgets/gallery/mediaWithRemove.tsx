import {X, type LucideIcon} from "lucide-react";
import {useState} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Dialog, DialogContent} from "@coreModule/components/ui/dialog.tsx";
import MediaPreviewContent from "@coreModule/components/viewEngine/widgets/media/mediaPreviewContent.tsx";
import type {FieldMediaType} from "@coreModule/components/viewEngine/widgets/media/mediaPreviewKind.ts";

const SIZE_CLASSES = {
    sm: "w-32 h-32",
    md: "w-40 h-40",
    lg: "w-48 h-48",
} as const;

export type MediaWithRemoveProps = {
    src: string;
    alt: string;
    onRemove: () => void;
    disabled?: boolean;
    className?: string;
    size?: keyof typeof SIZE_CLASSES;
    aspectSquare?: boolean;
};

type MediaWithRemoveInternalProps = MediaWithRemoveProps & {
    fieldMediaType: FieldMediaType;
    /** Glyph on the "open larger" button — an eye for stills, a play triangle for video. */
    PreviewIcon: LucideIcon;
    thumbClassName?: string;
    dialogClassName?: string;
};

/**
 * A media thumbnail with hover/focus actions to preview it larger or remove it.
 *
 * `imageWithRemove` and `videoWithRemove` were the same component twice; both now render this
 * through `MediaPreviewContent`, which already knew how to draw either kind (and adds the
 * broken-media fallback the hand-rolled `<img>` never had).
 */
export function MediaWithRemove({
    src,
    alt,
    onRemove,
    disabled = false,
    className,
    size = "md",
    aspectSquare = false,
    fieldMediaType,
    PreviewIcon,
    thumbClassName,
    dialogClassName,
}: MediaWithRemoveInternalProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className={cn("relative group", className)}>
                <div
                    className={cn(
                        "relative rounded-lg overflow-hidden border-2 border-border",
                        thumbClassName,
                        aspectSquare ? "w-full aspect-square" : SIZE_CLASSES[size],
                    )}
                >
                    <MediaPreviewContent mode="thumb" src={src} alt={alt} fieldMediaType={fieldMediaType}/>
                    {/* Actions reveal on hover — and on focus, so they are not invisible to keyboard users. */}
                    <div className="absolute inset-0 bg-overlay opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setOpen(true)}
                            disabled={disabled}
                        >
                            <PreviewIcon className="h-5 w-5"/>
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-10 w-10"
                            onClick={onRemove}
                            disabled={disabled}
                        >
                            <X className="h-5 w-5"/>
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className={cn("min-w-3xl p-2", dialogClassName)}>
                    <div className="flex items-center justify-center">
                        <MediaPreviewContent mode="dialog" src={src} alt={alt} fieldMediaType={fieldMediaType}/>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default MediaWithRemove;
