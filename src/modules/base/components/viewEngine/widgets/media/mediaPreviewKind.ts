import type {LucideIcon} from "lucide-react";
import {
    File,
    FileArchive,
    FileAudio,
    FileCode,
    FileImage,
    FileSpreadsheet,
    FileText,
    FileType,
    FileVideo,
    Presentation,
} from "lucide-react";

export type FieldMediaType = "image" | "video" | "file";

export type MediaPreviewKind =
    | "image"
    | "video"
    | "audio"
    | "pdf"
    | "word"
    | "spreadsheet"
    | "presentation"
    | "text"
    | "archive"
    | "other";

export type ClassifyMediaInput = {
    mime?: string;
    filename?: string;
    fieldMediaType?: FieldMediaType;
};

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif", "heic", "heif"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "mkv", "m4v", "ogv", "avi"]);
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac", "oga", "weba"]);
const WORD_EXTS = new Set(["doc", "docx", "odt", "rtf"]);
const SHEET_EXTS = new Set(["xls", "xlsx", "ods", "csv"]);
const PPT_EXTS = new Set(["ppt", "pptx", "odp"]);
const TEXT_EXTS = new Set(["txt", "md", "json", "xml", "html", "htm", "csv", "log", "yml", "yaml"]);
const ARCHIVE_EXTS = new Set(["zip", "rar", "7z", "tar", "gz", "tgz", "bz2"]);

const WORD_MIMES = new Set([
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.oasis.opendocument.text",
    "application/rtf",
    "text/rtf",
]);
const SHEET_MIMES = new Set([
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.oasis.opendocument.spreadsheet",
    "text/csv",
    "application/csv",
]);
const PPT_MIMES = new Set([
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.oasis.opendocument.presentation",
]);
const ARCHIVE_MIMES = new Set([
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/vnd.rar",
    "application/x-7z-compressed",
    "application/gzip",
    "application/x-tar",
]);

export const PDF_THUMB_MAX_BYTES = 25 * 1024 * 1024;
export const TEXT_PREVIEW_MAX_BYTES = 512 * 1024;
export const SPREADSHEET_PREVIEW_MAX_ROWS = 200;

export function extensionFromFilename(filename?: string): string {
    if (!filename) return "";
    const base = filename.split(/[?#]/)[0] ?? filename;
    const parts = base.split(".");
    if (parts.length < 2) return "";
    return (parts.pop() ?? "").toLowerCase();
}

export function inferMimeFromFilename(name: string): string {
    const ext = extensionFromFilename(name);
    if (!ext) return "";
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (IMAGE_EXTS.has(ext)) return `image/${ext === "svg" ? "svg+xml" : ext}`;
    if (ext === "pdf") return "application/pdf";
    if (ext === "mp4" || ext === "m4v") return "video/mp4";
    if (ext === "webm") return "video/webm";
    if (ext === "mov") return "video/quicktime";
    if (VIDEO_EXTS.has(ext)) return "video/mp4";
    if (ext === "mp3") return "audio/mpeg";
    if (ext === "wav") return "audio/wav";
    if (ext === "ogg" || ext === "oga") return "audio/ogg";
    if (AUDIO_EXTS.has(ext)) return "audio/mpeg";
    if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (ext === "doc") return "application/msword";
    if (ext === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (ext === "xls") return "application/vnd.ms-excel";
    if (ext === "csv") return "text/csv";
    if (ext === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    if (ext === "ppt") return "application/vnd.ms-powerpoint";
    if (ext === "json") return "application/json";
    if (ext === "xml") return "application/xml";
    if (ext === "html" || ext === "htm") return "text/html";
    if (ext === "txt" || ext === "md" || ext === "log") return "text/plain";
    if (ext === "zip") return "application/zip";
    return "";
}

function normalizeMime(mime?: string): string {
    return (mime ?? "").toLowerCase().split(";")[0]!.trim();
}

export function classifyMedia(input: ClassifyMediaInput): MediaPreviewKind {
    const filename = input.filename ?? "";
    const ext = extensionFromFilename(filename);
    let mime = normalizeMime(input.mime);
    if (!mime || mime === "application/octet-stream") {
        mime = inferMimeFromFilename(filename) || mime;
    }

    if (mime.startsWith("image/") || IMAGE_EXTS.has(ext)) return "image";
    if (mime.startsWith("video/") || VIDEO_EXTS.has(ext)) return "video";
    if (mime.startsWith("audio/") || AUDIO_EXTS.has(ext)) return "audio";
    if (mime === "application/pdf" || ext === "pdf") return "pdf";
    if (WORD_MIMES.has(mime) || (WORD_EXTS.has(ext) && ext !== "rtf" && ext !== "odt") || ext === "docx" || ext === "doc") {
        return "word";
    }
    if (WORD_EXTS.has(ext)) return "word";
    if (SHEET_MIMES.has(mime) || SHEET_EXTS.has(ext)) return "spreadsheet";
    if (PPT_MIMES.has(mime) || PPT_EXTS.has(ext)) return "presentation";
    if (
        mime.startsWith("text/") ||
        mime === "application/json" ||
        mime === "application/xml" ||
        mime === "text/xml" ||
        TEXT_EXTS.has(ext)
    ) {
        return "text";
    }
    if (ARCHIVE_MIMES.has(mime) || ARCHIVE_EXTS.has(ext)) return "archive";

    if (!mime) {
        if (input.fieldMediaType === "image") return "image";
        if (input.fieldMediaType === "video") return "video";
    }
    return "other";
}

export function isDialogPreviewable(kind: MediaPreviewKind): boolean {
    return (
        kind === "image" ||
        kind === "video" ||
        kind === "audio" ||
        kind === "pdf" ||
        kind === "word" ||
        kind === "spreadsheet" ||
        kind === "text"
    );
}

export function iconForMedia(kind: MediaPreviewKind, mime?: string, filename?: string): LucideIcon {
    if (kind === "image") return FileImage;
    if (kind === "video") return FileVideo;
    if (kind === "audio") return FileAudio;
    if (kind === "pdf") return FileText;
    if (kind === "word") return FileType;
    if (kind === "spreadsheet") return FileSpreadsheet;
    if (kind === "presentation") return Presentation;
    if (kind === "archive") return FileArchive;
    if (kind === "text") {
        const ext = extensionFromFilename(filename);
        const normalized = normalizeMime(mime);
        if (ext === "json" || ext === "xml" || ext === "html" || ext === "htm" || normalized === "application/json") {
            return FileCode;
        }
        return FileText;
    }
    return File;
}

export function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function mediaIdFromSrc(src: string): string | null {
    const trimmed = src.split("?")[0]?.replace(/\/+$/, "") ?? "";
    const last = trimmed.split("/").pop() ?? "";
    return /^[a-f0-9]{24}$/i.test(last) ? last : null;
}
