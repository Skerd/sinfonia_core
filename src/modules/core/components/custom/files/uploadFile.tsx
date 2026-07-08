import * as React from "react";
import { useFormContext, type FieldPath, type FieldValues } from "react-hook-form";
import { type FileRejection, useDropzone } from "react-dropzone";
import { cn } from "@coreModule/components/lib/utils.ts";
import { Button } from "@coreModule/components/ui/button.tsx";
import { File as FileIcon, FileImage, UploadCloud, X } from "lucide-react";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@coreModule/components/ui/form.tsx";
import withLanguage, { type WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";
import { compose } from "redux";
import { toast } from "sonner";
import { Avatar, AvatarImage } from "@coreModule/components/ui/avatar.tsx";

const DEFAULT_MEDIA_BASE_URL = "/api/auxiliary/media/";

type UploadFieldProps = WithLanguageType & {
    name: string;
    label: string;
    maxFiles?: number;
    maxSize?: number; // in bytes
    accept?: Record<string, string[]>;
    showPreviews?: boolean;
    generateBase64?: boolean;
    loading?: boolean;
    required?: boolean;
    /** For edit mode: show existing media by ID (e.g. current logo) */
    existingMediaId?: string | null;
    mediaBaseUrl?: string;
};

interface FileWithPreviewAndBase64 extends File {
    preview?: string;
    base64?: string;
    isConverting?: boolean;
}

function UploadField({
    name,
    label,
    maxFiles = 1,
    maxSize = 1024 * 1024 * 2,
    accept,
    showPreviews = true,
    generateBase64 = false,
    loading = false,
    required = false,
    existingMediaId,
    mediaBaseUrl = DEFAULT_MEDIA_BASE_URL,
    resolveLanguageKey,
}: UploadFieldProps) {
    const form = useFormContext();
    const [files, setFiles] = React.useState<FileWithPreviewAndBase64[]>([]);
    const filesRef = React.useRef<FileWithPreviewAndBase64[]>([]);
    const skipNextSyncRef = React.useRef(false);

    const value = form.watch(name);
    const isSingle = maxFiles === 1;

    React.useEffect(() => {
        filesRef.current = files;
    }, [files]);

    // Sync form value to internal files state; ensure preview URLs exist for images
    React.useEffect(() => {
        if (skipNextSyncRef.current) {
            skipNextSyncRef.current = false;
            return;
        }
        let next: FileWithPreviewAndBase64[] = [];
        if (value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0)) {
            if (value instanceof File) {
                const f = value as FileWithPreviewAndBase64;
                if (f.type?.startsWith("image/") && !f.preview) {
                    try {
                        f.preview = URL.createObjectURL(f);
                    } catch {
                        /* ignore */
                    }
                }
                next = [f];
            } else if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
                next = (value as File[]).map((f) => {
                    const w = f as FileWithPreviewAndBase64;
                    if (w.type?.startsWith("image/") && !w.preview) {
                        try {
                            w.preview = URL.createObjectURL(w);
                        } catch {
                            /* ignore */
                        }
                    }
                    return w;
                });
            }
        }
        const prev = filesRef.current;
        prev.forEach((p) => {
            if (p.preview && !next.some((n) => n === p || (n.size === p.size && n.name === p.name))) {
                try {
                    URL.revokeObjectURL(p.preview);
                } catch {
                    /* ignore */
                }
            }
        });
        setFiles(next);
    }, [value]);

    const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (e) => reject(e);
        });

    const updateFormValue = React.useCallback(
        (newFiles: FileWithPreviewAndBase64[]) => {
            skipNextSyncRef.current = true;
            if (isSingle) {
                const val = newFiles[0];
                if (generateBase64 && val?.base64 != null) {
                    form.setValue(name, val.base64, { shouldValidate: true, shouldDirty: true });
                } else {
                    form.setValue(name, val ?? "", { shouldValidate: true, shouldDirty: true });
                }
            } else {
                if (generateBase64) {
                    const base64Values = newFiles.map((f) => f.base64 ?? "").filter(Boolean);
                    form.setValue(name, base64Values, { shouldValidate: true, shouldDirty: true });
                } else {
                    form.setValue(name, newFiles, { shouldValidate: true, shouldDirty: true });
                }
            }
        },
        [form, name, isSingle, generateBase64],
    );

    const processFiles = React.useCallback(
        async (acceptedFiles: File[]) => {
            const filesWithPreviews = acceptedFiles.map((file) => {
                const w = file as FileWithPreviewAndBase64;
                if (file.type?.startsWith("image/")) {
                    try {
                        w.preview = URL.createObjectURL(file);
                    } catch {
                        /* ignore */
                    }
                }
                w.isConverting = generateBase64;
                return w;
            });

            const newFiles = isSingle
                ? filesWithPreviews.slice(0, 1)
                : [...files, ...filesWithPreviews].slice(0, maxFiles);

            setFiles(newFiles);
            if (!generateBase64) {
                updateFormValue(newFiles);
            }

            if (generateBase64) {
                for (let i = 0; i < filesWithPreviews.length; i++) {
                    const file = filesWithPreviews[i];
                    try {
                        const base64 = await fileToBase64(file);
                        const currentIndex = newFiles.findIndex((f) => f === file);
                        if (currentIndex !== -1) {
                            const currentFiles = filesRef.current.length > 0 ? filesRef.current : files;
                            const updatedFiles = [...currentFiles];
                            Object.assign(updatedFiles[currentIndex], { base64, isConverting: false });
                            setFiles(updatedFiles);
                            updateFormValue(updatedFiles);
                        }
                    } catch {
                        const currentIndex = newFiles.findIndex((f) => f === file);
                        if (currentIndex !== -1) {
                            setFiles((prev) => {
                                const updated = [...prev];
                                Object.assign(updated[currentIndex], { isConverting: false });
                                return updated;
                            });
                        }
                    }
                }
            }
        },
        [files, maxFiles, isSingle, generateBase64, updateFormValue],
    );

    const onDrop = React.useCallback(
        (acceptedFiles: File[]) => processFiles(acceptedFiles),
        [processFiles],
    );

    const removeFile = (index: number) => {
        const fileToRemove = files[index];
        if (!fileToRemove) return;
        if (fileToRemove.preview) URL.revokeObjectURL(fileToRemove.preview);

        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        if (newFiles.length === 0) {
            form.setValue(name, "", { shouldValidate: true, shouldDirty: true });
        } else {
            updateFormValue(newFiles);
        }
    };

    React.useEffect(() => () => {
            files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    }, [files]);

    const onDropRejected = React.useCallback(
        (rejections: FileRejection[]) => {
            const err = rejections[0]?.errors[0];
            if (err?.code === "file-too-large") {
                const msg = (resolveLanguageKey?.("maxSizeExceeded") ?? "File is too large. Max size is {{size}}MB.")
                    .replace("{{size}}", String((maxSize / 1024 / 1024).toFixed(0)));
                toast.error(msg);
            } else if (err?.message) {
                toast.error(err.message);
            }
        },
        [maxSize, resolveLanguageKey],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        onDropRejected,
        maxSize,
        accept,
        maxFiles,
        disabled: loading,
    });

    const isImageFile = (file: FileWithPreviewAndBase64) => file.type?.startsWith("image/");
    const hasNewFile = files.length > 0;
    const hasExisting = !!existingMediaId;
    const showDropzone = files.length < maxFiles;
    const fieldError = (form.formState.errors as Record<string, unknown>)[name];
    const hasError = !!fieldError;

    return (
        <div>
            <FormField
                control={form.control}
                name={name as FieldPath<FieldValues>}
                disabled={loading}
                render={() => (
                    <FormItem>
                        <FormLabel>
                            {label}
                            {required && " *"}
                        </FormLabel>
                        <FormControl>
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-start gap-4">
                                    {
                                        hasExisting && !hasNewFile &&
                                        <Avatar className="h-16 w-16 border-2 border-border shrink-0">
                                            <AvatarImage
                                                src={`${mediaBaseUrl}${existingMediaId}`}
                                                alt={label}
                                            />
                                        </Avatar>
                                    }
                                    {
                                        showDropzone &&
                                        <div
                                            {...getRootProps()}
                                            className={cn(
                                                "flex w-full flex-col items-center justify-center rounded-md border border-dashed p-6 transition-colors min-w-[200px]",
                                                loading ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                                                hasError && "border-destructive",
                                                !hasError && isDragActive && !loading && "border-primary bg-primary/5",
                                                !hasError && !isDragActive && !loading &&
                                                "border-muted-foreground/25 hover:border-primary/50",
                                            )}
                                        >
                                            <input {...getInputProps()} />
                                            <UploadCloud className="h-10 w-10 text-muted-foreground" />
                                            <div className="flex flex-col space-y-1 text-center mt-2">
                                                <p className="text-sm font-medium">
                                                    {isDragActive
                                                        ? (resolveLanguageKey?.("dropOnly") ?? "Drop the files here")
                                                        : (resolveLanguageKey?.("dragAndDrop") ?? "Drag & drop files here")}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {resolveLanguageKey?.("or") ?? "or"}{" "}
                                                    <span className="font-semibold text-primary">
                                                    {resolveLanguageKey?.("browse") ?? "browse"}
                                                </span>{" "}
                                                    {resolveLanguageKey?.("upload") ?? "to upload"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {maxFiles === 1
                                                        ? (resolveLanguageKey?.("oneFile") ?? "One file only")
                                                        : `${resolveLanguageKey?.("upTo") ?? "Up to"} ${maxFiles} ${resolveLanguageKey?.("files") ?? "files"}`}{" "}
                                                    (max {(maxSize / 1024 / 1024).toFixed(0)}MB{" "}
                                                    {resolveLanguageKey?.("each") ?? "each"})
                                                </p>
                                            </div>
                                        </div>
                                    }

                                    {
                                        files.map((file, index) => (
                                        <div
                                            key={`${file.name}-${index}`}
                                            className="flex items-center justify-between rounded-md border border-border p-3 gap-2"
                                        >
                                            <div className="flex items-center space-x-3">
                                                {showPreviews && isImageFile(file) && file.preview ? (
                                                    <div className="h-10 w-10 overflow-hidden rounded-md border border-border shrink-0">
                                                        <img
                                                            key={file.preview}
                                                            src={file.preview}
                                                            alt={file.name}
                                                            className="h-full w-full object-cover"
                                                            decoding="async"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                                                            }}
                                                        />
                                                    </div>
                                                ) : isImageFile(file) ? (
                                                    <FileImage className="h-5 w-5 text-muted-foreground shrink-0" />
                                                ) : (
                                                    <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                                                )}
                                                <div className="space-y-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {file.isConverting
                                                            ? (resolveLanguageKey?.("converting") ?? "Converting...")
                                                            : `${(file.size / 1024).toFixed(0)} KB`}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFile(index);
                                                }}
                                                disabled={loading}
                                                aria-label={resolveLanguageKey?.("remove") ?? "Remove file"}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
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
    withLanguage("src/modules/core/components/custom/files/uploadFile.tsx")
)(UploadField);
