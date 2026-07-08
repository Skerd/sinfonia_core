import { useRef, useState, useEffect } from "react";
import { useFormContext, type FieldPath, type FieldValues } from "react-hook-form";
import { X, Eye, Play, Plus, FileIcon, FileText } from "lucide-react";
import { Button } from "@coreModule/components/ui/button.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import { Dialog, DialogContent } from "@coreModule/components/ui/dialog.tsx";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@coreModule/components/ui/form.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";

const DEFAULT_MEDIA_BASE_URL = "/api/auxiliary/media/";

const VIDEO_ALT_MAX_LENGTH = 15;

type MediaType = "image" | "video" | "file";

/** Language keys used when resolveLanguageKey is provided: form.mediaField.videoUnsupported */
type MediaPreviewWithRemoveProps = {
    mediaType: MediaType;
    src: string;
    alt: string;
    onRemove: () => void;
    disabled?: boolean;
    className?: string;
    size?: "sm" | "md" | "lg";
    aspectSquare?: boolean;
    resolveLanguageKey?: (key: string) => string;
    /** For mediaType "file": optional size/type for dialog details */
    fileSize?: string;
    fileType?: string;
};

const DEFAULT_VIDEO_UNSUPPORTED = "Your browser does not support the video tag.";

const FILE_NAME_MAX_LENGTH = 18;

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaPreviewWithRemove({
    mediaType,
    src,
    alt,
    onRemove,
    disabled = false,
    className,
    size = "md",
    aspectSquare = false,
    resolveLanguageKey,
    fileSize,
    fileType,
}: MediaPreviewWithRemoveProps) {
    const [open, setOpen] = useState(false);
    const sizeClasses = {
        sm: "w-32 h-32",
        md: "w-40 h-40",
        lg: "w-48 h-48",
    };

    const isFileType = mediaType === "file";
    const isVideoType = mediaType === "video";
    const isImageType = mediaType === "image";
    const needsCenteredBlock = isVideoType || isFileType;

    return (
        <>
            <div className={cn("relative group", className)}>
                <div
                    className={cn(
                        "relative rounded-lg overflow-hidden border-2 border-border",
                        needsCenteredBlock && "bg-muted flex items-center justify-center",
                        aspectSquare ? "w-full aspect-square" : sizeClasses[size]
                    )}
                >
                    {isImageType ? (
                        <img
                            src={src}
                            alt={alt}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-center p-2">
                            <div
                                className={cn(
                                    "mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center",
                                    aspectSquare ? "h-12 w-12" : "h-10 w-10"
                                )}
                            >
                                {isFileType ? (
                                    <FileIcon
                                        className={cn(
                                            "text-primary",
                                            aspectSquare ? "h-6 w-6" : "h-5 w-5"
                                        )}
                                    />
                                ) : (
                                    <Play
                                        className={cn(
                                            "text-primary",
                                            aspectSquare ? "h-6 w-6" : "h-5 w-5"
                                        )}
                                        fill="currentColor"
                                    />
                                )}
                            </div>
                            <p className="text-muted-foreground text-xs break-all line-clamp-2">
                                {isFileType && alt.length > FILE_NAME_MAX_LENGTH
                                    ? `${alt.substring(0, FILE_NAME_MAX_LENGTH)}…`
                                    : alt}
                            </p>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setOpen(true)}
                            disabled={disabled}
                        >
                            {isImageType ? (
                                <Eye className="h-5 w-5" />
                            ) : isFileType ? (
                                <FileText className="h-5 w-5" />
                            ) : (
                                <Play className="h-5 w-5" />
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-10 w-10"
                            onClick={onRemove}
                            disabled={disabled}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className={cn("p-2", isVideoType ? "min-w-3xl w-auto" : "min-w-3xl")}>
                    <div className="flex items-center justify-center">
                        {isImageType ? (
                            <img
                                src={src}
                                alt={alt}
                                className="max-h-[85vh] max-w-full object-contain rounded-lg"
                            />
                        ) : isFileType ? (
                            <div className="rounded-lg border border-border bg-muted/30 p-6 min-w-[280px] space-y-2">
                                <p className="font-medium break-all">{alt}</p>
                                {fileType != null && fileType !== "" && (
                                    <p className="text-sm text-muted-foreground">{fileType}</p>
                                )}
                                {fileSize != null && fileSize !== "" && (
                                    <p className="text-sm text-muted-foreground">{fileSize}</p>
                                )}
                            </div>
                        ) : (
                            <video
                                src={src}
                                controls
                                className="max-h-[85vh] max-w-full rounded-lg"
                                autoPlay
                            >
                                {resolveLanguageKey?.("form.mediaField.videoUnsupported") ?? DEFAULT_VIDEO_UNSUPPORTED}
                            </video>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

type FileMediaPreviewProps = {
    file: File;
    mediaType: MediaType;
    onRemove: () => void;
    disabled?: boolean;
    aspectSquare?: boolean;
    resolveLanguageKey?: (key: string) => string;
};

function FileMediaPreview({
    file,
    mediaType,
    onRemove,
    disabled = false,
    aspectSquare = true,
    resolveLanguageKey,
}: FileMediaPreviewProps) {
    const [url, setUrl] = useState<string | null>(null);
    const isFileType = mediaType === "file";

    useEffect(() => {
        if (isFileType) return;
        const u = URL.createObjectURL(file);
        setUrl(u);
        return () => URL.revokeObjectURL(u);
    }, [file, isFileType]);

    const alt =
        mediaType === "video"
            ? file.name.substring(0, VIDEO_ALT_MAX_LENGTH)
            : file.name;

    if (isFileType) {
        return (
            <MediaPreviewWithRemove
                mediaType={mediaType}
                src=""
                alt={alt}
                onRemove={onRemove}
                disabled={disabled}
                aspectSquare={aspectSquare}
                resolveLanguageKey={resolveLanguageKey}
                fileSize={formatFileSize(file.size)}
                fileType={file.type || undefined}
            />
        );
    }

    if (!url) return null;

    return (
        <MediaPreviewWithRemove
            mediaType={mediaType}
            src={url}
            alt={alt}
            onRemove={onRemove}
            disabled={disabled}
            aspectSquare={aspectSquare}
            resolveLanguageKey={resolveLanguageKey}
        />
    );
}

/**
 * Language keys used when resolveLanguageKey is provided:
 * - form.mediaField.uploadImageHint  (placeholder for single image)
 * - form.mediaField.uploadVideoHint  (placeholder for single video)
 * - form.uploadNewImageHint          (fallback for image upload hint)
 * - form.mediaField.imageAlt         (alt for existing image in gallery)
 * - form.mediaField.videoAlt         (prefix for existing video, e.g. "Video" → "Video 1")
 * - form.mediaField.videoUnsupported (fallback text inside <video> tag)
 */
type MediaFieldProps = WithLanguageType & {
    name: string;
    label: string;
    placeholder?: string;
    mode?: "single" | "multiple";
    mediaType?: MediaType;
    /** File input accept attribute (e.g. "image/*", "video/*", "image/png,.pdf"). Defaults to "image/*" or "video/*" from mediaType when omitted. */
    accept?: string;
    maxCount?: number;
    editMode?: boolean;
    mediaBaseUrl?: string;
    loading?: boolean;
    required?: boolean;
    onDialog?: boolean;
};

type Item =
    | { type: "existing"; id: string; index: number }
    | { type: "newFile"; file: File; index: number }
    | { type: "placeholder"; index: number };

function getDefaultMaxCount(mode: "single" | "multiple", mediaType: MediaType): number {
    if (mode === "single") return 1;
    return mediaType === "video" ? 3 : 10;
}

function MediaField({
    name,
    label,
    placeholder,
    mode = "single",
    mediaType = "image",
    accept: acceptProp,
    maxCount: maxCountProp,
    editMode = false,
    mediaBaseUrl = DEFAULT_MEDIA_BASE_URL,
    loading = false,
    resolveLanguageKey,
    onDialog
}: MediaFieldProps) {
    const form = useFormContext();
    const inputRef = useRef<HTMLInputElement>(null);

    const hints = {
        "image": "uploadImageHint",
        "video": "uploadVideoHint",
        "file": "uploadFileHint"
    }
    const alts = {
        "image":"imageAlt",
        "video":"videoAlt",
        "file":"fileAlt"
    }

    const value = form.watch(name);
    const isSingle = mode === "single";

    const maxCount = maxCountProp ?? getDefaultMaxCount(mode, mediaType);
    const accept = acceptProp ?? (mediaType === "file" ? undefined : mediaType === "image" ? "image/*" : "video/*");

    const items: Item[] = [];

    if (isSingle) {
        const val = value as File | string | undefined;
        if (editMode && typeof val === "string" && val) {
            items.push({ type: "existing", id: val, index: 0 });
        }
        else if (val instanceof File) {
            items.push({ type: "newFile", file: val, index: 0 });
        }
        if (items.length === 0) {
            items.push({ type: "placeholder", index: 0 });
        }
    }
    else {
        const arr = (value as (File | string)[] | undefined) || [];
        arr.forEach((item: File | string, index: number) => {
            if (editMode && typeof item === "string") {
                items.push({ type: "existing", id: item, index });
            } else {
                items.push({ type: "newFile", file: item as File, index });
            }
        });
        const placeholdersNeeded = maxCount - items.length;
        for (let i = 0; i < placeholdersNeeded; i++) {
            items.push({ type: "placeholder", index: items.length + i });
        }
    }

    const removeAt = (index: number) => {
        if (isSingle) {
            form.setValue(name, "", {
                shouldValidate: true,
                shouldDirty: true,
            });
        } else {
            const current = form.getValues(name) as (File | string)[] | undefined;
            const list = current || [];
            form.setValue(
                name,
                list.filter((_: unknown, i: number) => i !== index),
                { shouldValidate: true, shouldDirty: true }
            );
        }
    };

    const handleFileSelect = (files: FileList | null) => {
        if (!files?.length) return;
        const fileList = Array.from(files);

        if (isSingle) {
            const file = fileList[0];
            if (file)
                form.setValue(name, file, {
                    shouldValidate: true,
                    shouldDirty: true,
                });
        } else {
            const current = form.getValues(name) as (File | string)[] | undefined;
            const list = current || [];
            const remaining = maxCount - list.length;
            const toAdd = fileList.slice(0, remaining);
            form.setValue(name, [...list, ...toAdd], {
                shouldValidate: true,
                shouldDirty: true,
            });
        }
    };

    const uploadHint = placeholder || resolveLanguageKey(hints[mediaType]);
    const fieldError = (form.formState.errors as Record<string, unknown>)[name];
    const hasError = !!fieldError;

    const placeholderSlot = (item: Item, slotIndex: number) => {
        const isFirstPlaceholder = !isSingle && item.type === "placeholder" && items.findIndex((i) => i.type === "placeholder") === items.indexOf(item);
        const slotLabel = isSingle ? uploadHint : `${slotIndex + 1}/${maxCount}`;
        return (
            <div key={`placeholder-${slotIndex}`} className="relative">
                <div
                    className={cn(
                        "w-full aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/30",
                        hasError ? "border-destructive" : "border-border"
                    )}
                    onClick={() => inputRef.current?.click()}
                >
                    <div className="text-center space-y-1">
                        <Plus className="mx-auto text-muted-foreground" />
                        <p className="text-xs text-muted-foreground px-2">
                            {uploadHint}
                        </p>
                        <p className="text-xs text-muted-foreground px-2">
                            {slotLabel}
                        </p>
                    </div>
                </div>
                {
                    (isSingle || isFirstPlaceholder) &&
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        accept={accept}
                        multiple={!isSingle}
                        onChange={(e) => {
                            handleFileSelect(e.target.files);
                            e.target.value = "";
                        }}
                        disabled={loading}
                    />
                }
            </div>
        );
    };

    const gridContent = (
        <div className={cn(!onDialog ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-8 gap-2 md:gap-4" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4")}>
            {
                items.map((item, idx) => {
                    if (item.type === "existing") {
                        return (
                            <MediaPreviewWithRemove
                                key={item.id}
                                mediaType={mediaType}
                                src={`${mediaBaseUrl}${item.id}`}
                                alt={resolveLanguageKey(alts[mediaType]) + " " + idx}
                                onRemove={() => removeAt(item.index)}
                                disabled={loading}
                                aspectSquare={true}
                                resolveLanguageKey={resolveLanguageKey}
                            />
                        );
                    }
                    if (item.type === "newFile" && item.file) {
                        return (
                            <FileMediaPreview
                                key={isSingle ? "single" : `new-${idx}`}
                                file={item.file}
                                mediaType={mediaType}
                                onRemove={() => removeAt(item.index)}
                                disabled={loading}
                                aspectSquare={true}
                                resolveLanguageKey={resolveLanguageKey}
                            />
                        );
                    }
                    return placeholderSlot(item, idx);
                })
            }
        </div>
    );

    return (
        <div>
            <FormField
                control={form.control}
                name={name as FieldPath<FieldValues>}
                disabled={loading}
                render={() => (
                    <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                            <div className="space-y-2">
                                {gridContent}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );

}

export default compose(
    withLanguage("src/modules/core/components/custom/files/mediaField.tsx")
)(MediaField)