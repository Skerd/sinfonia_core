import {useCallback, useState} from "react";
import {Play} from "lucide-react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {
    classifyMedia,
    extensionFromFilename,
    formatFileSize,
    iconForMedia,
    type FieldMediaType,
    type MediaPreviewKind,
} from "@coreModule/components/custom/files/mediaPreviewKind.ts";
import {
    DocxDialogViewer,
    FileDetailsFallback,
    SpreadsheetDialogViewer,
    TextDialogViewer,
} from "@coreModule/components/custom/files/officePreview.tsx";
import PdfDialogViewer from "@coreModule/helpers/pdf/PdfDialogViewer.tsx";
import PdfFirstPageThumb from "@coreModule/helpers/pdf/PdfFirstPageThumb.tsx";

const FILE_NAME_MAX_LENGTH = 18;
const DEFAULT_VIDEO_UNSUPPORTED = "Your browser does not support the video tag.";

export type MediaPreviewContentProps = {
    mode: "thumb" | "dialog";
    src: string;
    mime?: string;
    filename?: string;
    alt?: string;
    fileSizeBytes?: number;
    fileSizeLabel?: string;
    fieldMediaType?: FieldMediaType;
    variant?: "default" | "chat";
    objectFit?: "cover" | "contain" | "fill";
    className?: string;
    videoUnsupportedText?: string;
    iconSize?: "sm" | "md" | "lg";
};

function KindFallback({
    kind,
    mime,
    filename,
    alt,
    iconSize = "md",
    variant = "default",
    className,
}: {
    kind: MediaPreviewKind;
    mime?: string;
    filename?: string;
    alt?: string;
    iconSize?: "sm" | "md" | "lg";
    variant?: "default" | "chat";
    className?: string;
}) {
    const Icon = iconForMedia(kind, mime, filename);
    const ext = extensionFromFilename(filename || alt);
    const label = filename || alt || "";
    const nameWithoutExt =
        ext && label.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
            ? label.slice(0, -(ext.length + 1))
            : label;
    const compact = iconSize === "sm";
    const displayName = compact
        ? nameWithoutExt
        : nameWithoutExt.length > FILE_NAME_MAX_LENGTH
          ? `${nameWithoutExt.substring(0, FILE_NAME_MAX_LENGTH)}…`
          : nameWithoutExt;
    const iconClass =
        iconSize === "lg" ? "h-7 w-7" : compact ? "h-3 w-3" : "h-5 w-5";
    const wrapClass =
        iconSize === "lg" ? "h-12 w-12" : compact ? "h-6 w-6" : "h-10 w-10";

    return (
        <div
            className={cn(
                "flex h-full w-full min-w-0 flex-col items-center justify-center overflow-hidden text-center",
                compact ? "gap-0.5 px-2.5 py-1.5" : "gap-1 px-2.5 py-1.5",
                variant === "chat" ? "bg-background/20" : "bg-muted",
                className,
            )}
        >
            <div
                className={cn(
                    "mx-auto shrink-0 rounded-full bg-primary/10 flex items-center justify-center",
                    wrapClass,
                )}
            >
                <Icon className={cn("text-primary", iconClass)} />
            </div>
            {displayName ? (
                <p
                    title={label}
                    className={cn(
                        "w-full min-w-0 text-muted-foreground",
                        compact ? "truncate text-3xs leading-tight" : "break-all line-clamp-2 text-xs",
                    )}
                >
                    {displayName}
                </p>
            ) : null}
            {ext ? (
                <span className="w-full min-w-0 shrink-0 truncate text-3xs leading-none opacity-70">
                    .{ext}
                </span>
            ) : null}
        </div>
    );
}

export default function MediaPreviewContent({
    mode,
    src,
    mime,
    filename,
    alt,
    fileSizeBytes,
    fileSizeLabel,
    fieldMediaType,
    variant = "default",
    objectFit,
    className,
    videoUnsupportedText,
    iconSize = "md",
}: MediaPreviewContentProps) {
    const [failed, setFailed] = useState(false);
    const kind = classifyMedia({mime, filename: filename || alt, fieldMediaType});
    const fit = objectFit ?? (mode === "dialog" ? "contain" : "cover");
    const fitClass =
        fit === "contain" ? "object-contain" : fit === "fill" ? "object-fill" : "object-cover";
    const displayName = filename || alt || "";
    const sizeLabel = fileSizeLabel || (fileSizeBytes != null ? formatFileSize(fileSizeBytes) : "");
    const onMediaError = useCallback(() => setFailed(true), []);
    const onPdfFail = useCallback(() => setFailed(true), []);

    if (failed || !src) {
        if (mode === "dialog") {
            return (
                <FileDetailsFallback
                    filename={displayName}
                    mime={mime}
                    fileSizeLabel={sizeLabel}
                    src={src || undefined}
                    className={className}
                />
            );
        }
        return (
            <KindFallback
                kind={kind}
                mime={mime}
                filename={filename}
                alt={alt}
                iconSize={iconSize}
                variant={variant}
                className={className}
            />
        );
    }

    if (kind === "image") {
        return (
            <img
                src={src}
                alt={alt || displayName || "attachment"}
                className={cn("h-full w-full", fitClass, mode === "dialog" && "max-h-[85vh] max-w-full rounded-lg", className)}
                onError={onMediaError}
            />
        );
    }

    if (kind === "video") {
        if (mode === "thumb") {
            return (
                <div className={cn("relative h-full w-full", className)}>
                    <video
                        src={src}
                        muted
                        playsInline
                        preload="metadata"
                        className={cn("h-full w-full", fitClass)}
                        onError={onMediaError}
                    />
                    <div className="absolute bottom-1.5 end-1.5 rounded-full bg-background/80 p-1 shadow-sm">
                        <Play className="h-3.5 w-3.5 text-foreground" fill="currentColor" />
                    </div>
                </div>
            );
        }
        return (
            <video
                src={src}
                controls
                autoPlay
                className={cn("max-h-[85vh] max-w-full rounded-lg", className)}
                onError={onMediaError}
            >
                {videoUnsupportedText ?? DEFAULT_VIDEO_UNSUPPORTED}
            </video>
        );
    }

    if (kind === "audio") {
        if (mode === "dialog") {
            return (
                <div className={cn("flex w-full items-center justify-center p-4", className)}>
                    <audio src={src} controls className="w-full max-w-lg" onError={onMediaError} />
                </div>
            );
        }
        return (
            <KindFallback
                kind="audio"
                mime={mime}
                filename={filename}
                alt={alt}
                iconSize={iconSize}
                variant={variant}
                className={className}
            />
        );
    }

    if (kind === "pdf") {
        if (mode === "thumb") {
            if (failed) {
                return (
                    <KindFallback
                        kind="pdf"
                        mime={mime}
                        filename={filename}
                        alt={alt}
                        iconSize={iconSize}
                        variant={variant}
                        className={className}
                    />
                );
            }
            return (
                <PdfFirstPageThumb
                    src={src}
                    fileSizeBytes={fileSizeBytes}
                    className={className}
                    onFail={onPdfFail}
                />
            );
        }
        return <PdfDialogViewer src={src} className={className} />;
    }

    if (mode === "dialog") {
        if (kind === "word") return <DocxDialogViewer src={src} filename={filename} className={className} />;
        if (kind === "spreadsheet") return <SpreadsheetDialogViewer src={src} filename={filename} className={className} />;
        if (kind === "text") return <TextDialogViewer src={src} filename={filename} className={className} />;
        return (
            <FileDetailsFallback
                filename={displayName}
                mime={mime}
                fileSizeLabel={sizeLabel}
                src={src}
                className={className}
            />
        );
    }

    return (
        <KindFallback
            kind={kind}
            mime={mime}
            filename={filename}
            alt={alt}
            iconSize={iconSize}
            variant={variant}
            className={className}
        />
    );
}
