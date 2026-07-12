import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {
    EllipsisVertical,
    Eye,
    FileText,
    Music,
    File as LucidFile,
    Trash2,
    Download,
} from "lucide-react";
import {useEffect, useState} from "react";
import {Dialog, DialogContent} from "@coreModule/components/ui/dialog.tsx";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@coreModule/components/ui/dropdown-menu.tsx";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@coreModule/components/ui/context-menu.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Media} from "armonia/src/modules/core/types";

type FileToUpload = any & {}

function getMediaDisplayName(f: File | Media): string {
    if (f instanceof File) {
        return f.name ?? "";
    }
    const m = f as Media & { originalName?: string };
    return (m.name ?? m.originalName ?? "").trim();
}

type SingleFileProps = WithLanguageType & {
    specificUserId?: string;
    onRemove?: (id: string) => void;
    canRemove?: boolean,
    canDownload?: boolean,
    file: Omit<FileToUpload, "file"> & {file: File | Media},
    isBig?: boolean,
    table?: boolean,
    uploadThis?: boolean,
    /** Chat bubble attachments: compact tile that inherits bubble chrome. */
    variant?: "default" | "chat",
    className?: string,
}
function SingleFile({
    resolveLanguageKey,
    onRemove = () => {},
    canRemove = false,
    canDownload = false,
    file,
    isBig = true,
    uploadThis = false,
    table = false,
    variant = "default",
    className,
}: SingleFileProps) {
    const isChat = variant === "chat";

    const [open, setOpen] = useState(false);
    const [duration, setDuration] = useState<number | null>(null);
    const [canPreview, setCanPreview] = useState(false)

    function formatSeconds(totalSeconds: number): string {
        const seconds = Math.floor(totalSeconds % 60);
        const minutes = Math.floor((totalSeconds / 60) % 60);
        const hours = Math.floor(totalSeconds / 3600);

        const s = String(seconds).padStart(2, "0");
        const m = String(minutes).padStart(2, "0");

        if (hours > 0) {
            return `${("00" + hours).slice(-2)}:${("00" + m).slice(-2)}:${("00" + s).slice(-2)}`; // hh:mm:ss
        }

        return `${("00" + m).slice(-2)}:${s}`; // mm:ss
    }

    const downloadFile = (filePath: string, fileName?: string) => {
        const link = document.createElement("a");
        link.href = filePath;
        link.download = fileName || filePath.split("/").pop() || "file";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderPreviewCard = (innerFile: File | Media, controls: boolean = false, previewPath?: string) => {
        function getFileExtension(fileName: string): string {
            const parts = (fileName ?? "").split(".");
            return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
        }

        const displayName = getMediaDisplayName(innerFile);

        let url: string;
        let type: string;
        if (innerFile instanceof File) {
            url = previewPath && previewPath.trim() !== "" ? previewPath : URL.createObjectURL(innerFile);
            type = innerFile.type ?? "";
        } else {
            url = "/api/auxiliary/media/" + innerFile._id;
            const media = innerFile as Media & { mimeType?: string };
            type = media.mime ?? media.mimeType ?? "";
        }

        const ext = getFileExtension(displayName);
        if (!type && ext === "pdf") {
            type = "application/pdf";
        }

        // card preview (small)
        if (type.startsWith("image/")) {
            return (
                <img
                    src={url}
                    className={cn(
                        "h-full w-full",
                        isChat || controls ? "object-cover" : "object-fill",
                        !isChat && "rounded-lg",
                        {"rounded-se-none rounded-ss-none": (isBig && !controls && !isChat)},
                    )}
                    alt={displayName || "attachment"}
                />
            );
        }
        if (type.startsWith("video/")) {
            return (
                <video
                    src={url}
                    className={cn(
                        "h-full w-full",
                        isChat || controls ? "object-cover" : "object-fill",
                        !isChat && "rounded-lg",
                        {"rounded-se-none rounded-ss-none": (isBig && !controls && !isChat)},
                    )}
                    muted={!controls}
                    controls={controls}
                    autoPlay={controls}
                />
            )
        }
        if (type.startsWith("audio/") && controls) {
            const audio = new Audio(url);
            audio.addEventListener("loadedmetadata", () => {
                setDuration(audio.duration);
            });

            return (
                <div className="w-full h-full flex items-center justify-center">
                    <audio src={url} controls />
                </div>
            );
        }
        if (type.startsWith("audio/") && !controls) {
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <div className="h-full w-full flex flex-col items-center justify-center space-x-1">
                        <Music className={cn({"w-16 h-16": isBig, "w-10 h-10": !isBig})}/>
                        <p className="">{formatSeconds(duration || 0)}</p>
                    </div>
                </div>
            );
        }
        if (type === "application/pdf") {
            return (
                <div className={cn(
                    "flex h-full w-full items-center justify-center rounded-lg",
                    isChat ? "bg-background/20" : "bg-gray-50",
                )}>
                    {
                        controls ?
                        <div className="min-h-32">
                            <iframe src={url} className="h-full w-full border-none" />
                        </div>
                        :
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center">
                            <FileText className={cn({"w-16 h-16": isBig && !isChat, "w-10 h-10": !isBig || isChat})}/>
                            <span className="max-w-full truncate text-[10px] opacity-80">
                                .{getFileExtension(displayName)}
                            </span>
                        </div>
                    }
                </div>
            );
        }

        return (
            <div className={cn(
                "flex h-full w-full items-center justify-center rounded-lg",
                isChat ? "bg-background/20" : "bg-gray-50",
            )}>
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center">
                    <LucidFile className={cn({"w-16 h-16": isBig && !isChat, "w-10 h-10": !isBig || isChat})}/>
                    <span className="max-w-full truncate text-[10px] opacity-80">
                        .{getFileExtension(displayName)}
                    </span>
                </div>
            </div>
        );
    };

    useEffect(() => {
        const inner = file?.file;
        if (!inner) {
            setCanPreview(false);
            return;
        }
        let type: string;
        if (inner instanceof File) {
            type = inner.type ?? "";
        } else {
            const media = inner as Media & { mimeType?: string };
            type = media.mime ?? media.mimeType ?? "";
        }
        setCanPreview(
            type.startsWith("image/") ||
                type.startsWith("video/") ||
                type.startsWith("audio/"),
        );
    }, [file?.id, file?.file]);

    const openPreview = () => setOpen(true);

    const runDownload = () => {
        if (file.file instanceof File) {
            downloadFile(URL.createObjectURL(file.file), file.file.name);
        }
        else {
            downloadFile(`/api/auxiliary/media/` + file.file._id, file.file.name);
        }
    };

    const renderDropDownMenu = () => {

        if( !canRemove && !canDownload && !canPreview ) return <></>;

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {
                        isChat ?
                        <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="size-7 rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm hover:bg-background"
                            onClick={(e) => {e.stopPropagation();}}
                            onPointerDown={(e) => {e.stopPropagation();}}
                        >
                            <EllipsisVertical className="size-3.5" />
                        </Button>
                        :
                        isBig ?
                        <div className="hover:cursor-pointer">
                            <EllipsisVertical size={16} className="text-muted-foreground" />
                        </div>
                        :
                        <Button variant="ghost" className="size-6 text-muted-foreground hover:cursor-pointer">
                            <EllipsisVertical color={"gray"} size={1} />
                        </Button>
                    }
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {
                        canRemove &&
                        <DropdownMenuItem onClick={() => {onRemove(file?.id)}}>
                            <Trash2 color="red"/>
                            <p>{resolveLanguageKey("remove")}</p>
                        </DropdownMenuItem>
                    }
                    {
                        canPreview &&
                        <DropdownMenuItem onClick={openPreview}>
                            <Eye/>
                            <p>{resolveLanguageKey("preview")}</p>
                        </DropdownMenuItem>
                    }
                    {
                        canDownload &&
                        <DropdownMenuItem onClick={runDownload}>
                            <Download />
                            <p>{resolveLanguageKey("download")}</p>
                        </DropdownMenuItem>
                    }

                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    const renderContextMenuItems = () => (
        <>
            {
                canRemove &&
                <ContextMenuItem onClick={() => {onRemove(file?.id)}}>
                    <Trash2 color="red"/>
                    <p>{resolveLanguageKey("remove")}</p>
                </ContextMenuItem>
            }
            {
                canPreview &&
                <ContextMenuItem onClick={openPreview}>
                    <Eye/>
                    <p>{resolveLanguageKey("preview")}</p>
                </ContextMenuItem>
            }
            {
                canDownload &&
                <ContextMenuItem onClick={runDownload}>
                    <Download />
                    <p>{resolveLanguageKey("download")}</p>
                </ContextMenuItem>
            }
        </>
    );

    useEffect(() => {
        if( uploadThis ){
            //TODO fix
            //@ts-ignore
            // addFiles([file])
        }
    }, [uploadThis]);

    const fileCard = (
        <div
            className={cn(
                "group/file relative flex flex-col p-0",
                isChat
                    ? "h-full w-full overflow-hidden rounded-md border border-border/70 bg-muted/30 shadow-sm transition-[border-color,box-shadow,transform] hover:z-10 hover:border-primary hover:ring-2 hover:ring-primary/35 hover:shadow-md"
                    : "rounded-md border bg-card",
                !isChat && {"h-20 w-20": !isBig, "h-36 w-36": isBig, "size-9": table},
                className,
            )}
            onClick={(e) => {e.stopPropagation(); e.preventDefault();}}
            onContextMenu={(e) => {e.stopPropagation();}}
        >
            <>
                {
                    isChat ?
                    <div className="absolute end-1 top-1 z-1 opacity-0 transition-opacity group-hover/file:opacity-100 focus-within:opacity-100 data-[state=open]:opacity-100">
                        {renderDropDownMenu()}
                    </div>
                    :
                    (isBig) ?
                    <div className="flex w-full items-center justify-between ps-1" onClick={(e) => {e.stopPropagation(); e.preventDefault();}}>
                        <div className="flex w-[85%]">
                            {
                                isBig && !!file &&
                                <TooltipDisplayer tooltip={getMediaDisplayName(file.file)}>
                                    <p className="truncate text-xs text-muted-foreground hover:cursor-pointer">{getMediaDisplayName(file.file)}</p>
                                </TooltipDisplayer>
                            }
                        </div>
                        <div className="flex items-center rounded px-0 py-1 hover:bg-muted">
                            {renderDropDownMenu()}
                        </div>
                    </div>
                    :
                    <>
                        {
                            !table &&
                            <div className="absolute top-1.5 right-1.5 z-1">
                                {renderDropDownMenu()}
                            </div>
                        }
                    </>
                }

                <div className={cn(
                    "flex w-full grow overflow-hidden",
                    isChat ? "rounded-md bg-transparent" : "rounded-lg bg-muted",
                    {"rounded-se-none rounded-ss-none ": isBig && !isChat},
                )}>
                    <div
                        className={cn(
                            "relative h-full w-full overflow-hidden hover:cursor-pointer",
                            isChat ? "text-current" : "text-muted-foreground",
                        )}
                        onClick={() => {if( canPreview ){ openPreview(); }}}
                    >
                        {
                            !!file && renderPreviewCard(file.file, false, file.path)
                        }
                    </div>
                </div>
            </>
        </div>
    );

    const previewDialog = (
        <Dialog open={open} onOpenChange={setOpen} modal>
            <DialogContent
                className="max-h-[90vh] w-auto max-w-[min(96vw,56rem)] p-2 sm:max-w-[min(96vw,56rem)]"
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                <div className="flex max-h-[85vh] items-center justify-center overflow-auto">
                    {!!file && renderPreviewCard(file.file, true, file.path)}
                </div>
            </DialogContent>
        </Dialog>
    );

    if (isChat && (canRemove || canDownload || canPreview)) {
        return (
            <>
                <ContextMenu>
                    <ContextMenuTrigger asChild>
                        {fileCard}
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-44">
                        {renderContextMenuItems()}
                    </ContextMenuContent>
                </ContextMenu>
                {previewDialog}
            </>
        );
    }

    return (
        <>
            {fileCard}
            {previewDialog}
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/files/singleFile.tsx")
)(SingleFile);