import {useState} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Dialog, DialogContent} from "@coreModule/components/ui/dialog.tsx";
import {MediaAvatar} from "@coreModule/components/custom/avatar/mediaAvatar.tsx";
import {MEDIA_BASE_URL} from "@baseModule/helpers/constants/media.constants.ts";

/** Table rows activate on click, so the avatar must swallow the event before it bubbles. */
function stopRowActivate(e: {stopPropagation: () => void}) {
    e.stopPropagation();
}

/**
 * A media thumbnail for a table cell: opens the full image in a lightbox and keeps the click
 * from activating the row underneath. For a person's avatar use `userAvatar` instead.
 */
export default function TableAvatar({mediaId}: {mediaId: string}) {
    const [open, setOpen] = useState(false);
    const imageSrc = mediaId ? `${MEDIA_BASE_URL}${mediaId}` : undefined;

    return (
        <>
            <button
                type="button"
                disabled={!imageSrc}
                aria-label="View image"
                className={cn(
                    "rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    imageSrc && "hover:cursor-pointer",
                )}
                onClick={(e) => {
                    stopRowActivate(e);
                    if (imageSrc) setOpen(true);
                }}
                onPointerDown={stopRowActivate}
            >
                <MediaAvatar mediaId={mediaId} alt={mediaId + " media"} className="size-8 hover:border-muted-foreground"/>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] min-w-[min(90vw,560px)] min-h-[min(80vh,420px)] w-fit p-0 overflow-auto bg-transparent border-0 flex items-center justify-center">
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt={mediaId + " media"}
                            className="min-w-[min(90vw,500px)] min-h-[min(80vh,400px)] max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg"
                        />
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
}
