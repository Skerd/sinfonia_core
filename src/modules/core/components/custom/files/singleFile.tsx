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
import {DialogContent} from "@coreModule/components/ui/dialog.tsx";
import {Dialog} from "@radix-ui/react-dialog";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@coreModule/components/ui/dropdown-menu.tsx";
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
    uploadThis?: boolean
}
function SingleFile({
    resolveLanguageKey,
    onRemove = () => {},
    canRemove = false,
    canDownload = false,
    file,
    isBig = true,
    uploadThis = false,
    table = false
}: SingleFileProps) {

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
            return <img src={url} className={cn("w-full h-full object-fill rounded-lg", {"rounded-se-none rounded-ss-none": (isBig && !controls)})}  alt={displayName || "attachment"}/>;
        }
        if (type.startsWith("video/")) {
            return (
                <video
                    src={url}
                    className={cn("w-full h-full object-fill rounded-lg", {"rounded-se-none rounded-ss-none": (isBig && !controls)})}
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
                <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
                    {
                        controls ?
                        <div className="min-h-32">
                            <iframe src={url} className="w-full h-full border-none" />
                        </div>
                        :
                        <div className="h-full w-full flex flex-col items-center justify-center space-x-1">
                            <FileText className={cn({"w-16 h-16": isBig, "w-10 h-10": !isBig})}/>
                            .{getFileExtension(innerFile instanceof File ? innerFile.name : innerFile.name)}
                        </div>
                    }
                </div>
            );
        }

        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="h-full w-full flex flex-col items-center justify-center space-x-1">
                    <LucidFile className={cn({"w-16 h-16": isBig, "w-10 h-10": !isBig})}/>
                    .{getFileExtension(innerFile instanceof File ? innerFile.name : innerFile.name)}
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

    const renderDropDownMenu = () => {

        if( !canRemove && !canDownload && !canPreview ) return <></>;

        return (
            <DropdownMenu>
                <DropdownMenuTrigger>
                    {
                        isBig ?
                        <div className="hover:cursor-pointer">
                            <EllipsisVertical size={16} className="text-muted-foreground" />
                        </div>
                        :
                        <Button variant="ghost" className="hover:cursor-pointer size-6 text-muted-foreground">
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
                        <DropdownMenuItem onClick={() => {setOpen(true)}}>
                            <Eye/>
                            <p>{resolveLanguageKey("preview")}</p>
                        </DropdownMenuItem>
                    }
                    {
                        canDownload &&
                        <DropdownMenuItem onClick={() => {
                            if( file.file instanceof File) {
                                downloadFile(URL.createObjectURL(file.file), file.file.name)
                            }
                            else {
                                downloadFile(`/api/auxiliary/media/` + file.file._id, file.file.name);
                            }
                        }}>
                            <Download />
                            <p>{resolveLanguageKey("download")}</p>
                        </DropdownMenuItem>
                    }

                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    useEffect(() => {
        if( uploadThis ){
            //TODO fix
            //@ts-ignore
            // addFiles([file])
        }
    }, [uploadThis]);

    return (
        <div className={cn("relative flex flex-col p-0 border rounded-md bg-card", {"h-20 w-20": !isBig, "h-36 w-36": isBig, "size-9": table})} onClick={(e) => {e.stopPropagation(); e.preventDefault();}}>
            <>
                {
                    (isBig) ?
                    <div className="ps-1 flex w-full items-center justify-between" onClick={(e) => {e.stopPropagation(); e.preventDefault();}}>
                        <div className="flex w-[85%]">
                            {
                                isBig && !!file &&
                                <TooltipDisplayer tooltip={file.file.name}>
                                    <p className="text-xs text-muted-foreground hover:cursor-pointer truncate">{file.file.name}</p>
                                </TooltipDisplayer>
                            }
                        </div>
                        <div className="flex items-center rounded hover:bg-muted py-1 px-0">
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

                <div className={cn("flex grow w-full rounded-lg bg-muted overflow-hidden", {"rounded-se-none rounded-ss-none ": isBig})}>
                    <div className="relative group w-full h-full overflow-hidden hover:cursor-pointer text-muted-foreground" onClick={() => {if( canPreview ){ setOpen(true); }}}>
                        {
                            !!file && renderPreviewCard(file.file, false, file.path)
                        }
                    </div>
                </div>

                {
                    open &&
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogContent className="max-w-3xl w-auto p-2">
                            <div className="flex items-center justify-center" style={{border: "0px solid red"}}>
                                {!!file && renderPreviewCard(file.file, true, file.path)}
                            </div>
                        </DialogContent>
                    </Dialog>
                }
            </>
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/components/custom/files/singleFile.tsx")
)(SingleFile);