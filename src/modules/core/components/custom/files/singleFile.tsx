import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {
    EllipsisVertical,
    Eye,
    Trash2,
    Download,
} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
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
import MediaPreviewContent from "@coreModule/components/custom/files/mediaPreviewContent.tsx";
import {
    classifyMedia,
    isDialogPreviewable,
} from "@coreModule/components/custom/files/mediaPreviewKind.ts";

type FileToUpload = any & {}

function getMediaDisplayName(f: File | Media): string {
    if (f instanceof File) {
        return f.name ?? "";
    }
    const m = f as Media & { originalName?: string };
    return (m.name ?? m.originalName ?? "").trim();
}

function resolvePreviewSource(innerFile: File | Media, previewPath?: string): {
    url: string;
    mime: string;
    filename: string;
    fileSizeBytes?: number;
} {
    const filename = getMediaDisplayName(innerFile);
    if (innerFile instanceof File) {
        const url = previewPath && previewPath.trim() !== "" ? previewPath : URL.createObjectURL(innerFile);
        return {
            url,
            mime: innerFile.type ?? "",
            filename,
            fileSizeBytes: innerFile.size,
        };
    }
    const media = innerFile as Media & { mimeType?: string; originalName?: string };
    return {
        url: "/api/auxiliary/media/" + innerFile._id,
        mime: media.mime ?? media.mimeType ?? "",
        filename,
        fileSizeBytes: typeof media.size === "number" ? media.size : undefined,
    };
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

    const preview = useMemo(() => {
        if (!file?.file) return null;
        return resolvePreviewSource(file.file, file.path);
    }, [file?.file, file?.path]);

    useEffect(() => {
        const inner = file?.file;
        if (!inner) {
            setCanPreview(false);
            return;
        }
        const source = resolvePreviewSource(inner, file.path);
        const kind = classifyMedia({mime: source.mime, filename: source.filename});
        setCanPreview(isDialogPreviewable(kind));
    }, [file?.id, file?.file, file?.path]);

    useEffect(() => {
        if (!preview) {
            setDuration(null);
            return;
        }
        const kind = classifyMedia({mime: preview.mime, filename: preview.filename});
        if (kind !== "audio") {
            setDuration(null);
            return;
        }
        const audio = new Audio(preview.url);
        const onMeta = () => setDuration(audio.duration);
        audio.addEventListener("loadedmetadata", onMeta);
        return () => {
            audio.removeEventListener("loadedmetadata", onMeta);
            audio.src = "";
        };
    }, [preview]);

    const openPreview = () => setOpen(true);

    const runDownload = () => {
        if (file.file instanceof File) {
            downloadFile(URL.createObjectURL(file.file), file.file.name);
        }
        else {
            downloadFile(`/api/auxiliary/media/` + file.file._id, file.file.name);
        }
    };

    const thumbObjectFit = isChat ? "cover" : "fill";

    const renderPreviewCard = (mode: "thumb" | "dialog") => {
        if (!preview) return null;
        const kind = classifyMedia({mime: preview.mime, filename: preview.filename});
        const audioCaption =
            kind === "audio" && mode === "thumb" && duration != null ? formatSeconds(duration) : undefined;
        return (
            <div className="relative h-full w-full">
                <MediaPreviewContent
                    mode={mode}
                    src={preview.url}
                    mime={preview.mime}
                    filename={preview.filename}
                    alt={preview.filename || "attachment"}
                    fileSizeBytes={preview.fileSizeBytes}
                    variant={isChat ? "chat" : "default"}
                    objectFit={mode === "thumb" ? thumbObjectFit : isChat ? "cover" : "fill"}
                    iconSize={isBig && !isChat ? "lg" : "sm"}
                    className={cn(
                        !isChat && mode === "thumb" && "rounded-lg",
                        {"rounded-se-none rounded-ss-none": (isBig && mode === "thumb" && !isChat)},
                    )}
                />
                {audioCaption ? (
                    <p className="absolute inset-x-0 bottom-1 text-center text-xs">{audioCaption}</p>
                ) : null}
            </div>
        );
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
                        {!!file && renderPreviewCard("thumb")}
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
                    {!!file && renderPreviewCard("dialog")}
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
