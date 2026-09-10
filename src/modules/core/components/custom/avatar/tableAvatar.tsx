import {useState} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {Dialog, DialogContent} from "@coreModule/components/ui/dialog.tsx";
import {User} from "lucide-react";

function stopRowActivate(e: {stopPropagation: () => void}) {
    e.stopPropagation();
}

export default function TableAvatar({mediaId}: {mediaId: string}) {
    const [open, setOpen] = useState(false);
    const mediaPath = "/api/auxiliary/media/";
    const imageSrc = mediaId ? `${mediaPath}${mediaId}` : undefined;

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
                <Avatar className="flex items-center border hover:border-muted-foreground size-8">
                    {!!mediaId && <AvatarImage src={imageSrc} alt={mediaId + " media"} />}
                    <AvatarFallback>
                        <User size={18} />
                    </AvatarFallback>
                </Avatar>
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
