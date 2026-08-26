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
    const truncated =
        label.length > FILE_NAME_MAX_LENGTH ? `${label.substring(0, FILE_NAME_MAX_LENGTH)}…` : label;
    const iconClass =
        iconSize === "lg" ? "h-8 w-8" : iconSize === "sm" ? "h-5 w-5" : "h-6 w-6";
    const wrapClass =
        iconSize === "lg" ? "h-16 w-16" : iconSize === "sm" ? "h-10 w-10" : "h-12 w-12";

    return (
        <div
            className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center",
                variant === "chat" ? "bg-background/20" : "bg-muted",
                className,
            )}
        >
            <div className={cn("mx-auto rounded-full bg-primary/10 flex items-center justify-center", wrapClass)}>
                <Icon className={cn("text-primary", iconClass)} />
            </div>
            {truncated ? (
                <p className="text-muted-foreground text-xs break-all line-clamp-2">{truncated}</p>
            ) : null}
            {ext ? <span className="max-w-full truncate text-3xs opacity-80">.{ext}</span> : null}
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
