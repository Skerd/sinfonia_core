import { Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@coreModule/components/ui/button.tsx";
import { FormLabel } from "@coreModule/components/ui/form.tsx";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import SingleFile from "@coreModule/components/custom/files/singleFile.tsx";

export type MultiLocalFilePickerProps = {
    files: File[];
    onFilesChange: (next: File[]) => void;
    resolveLanguageKey: ResolveLanguageKey;
    disabled?: boolean;
    /** Maximum files allowed (default 10). */
    maxFiles?: number;
    accept?: string;
    /**
     * When true, renders a `FormLabel` using `labelKey`.
     * Omit when a parent (e.g. `TitleWithCollapse`) already shows the same title.
     */
    showLabel?: boolean;
    labelKey?: string;
    addFileKey?: string;
    filesSelectedKey?: string;
    /**
     * Existing attachments (or similar) already occupying slots: count line shows
     * `(aggregateReservedCount + files.length)/maxFiles`, and new picks are capped to the overall `maxFiles` budget.
     */
    aggregateReservedCount?: number;
};

/**
 * Multi-file picker for local `File` instances (not yet uploaded). Intended for `FormData.append`
 * flows alongside react-hook-form / `FormViewRenderer` `renderChildren`.
 *
 * Manages `URL.createObjectURL` / revoke for previews so callers only hold `File[]`.
 */
export default function MultiLocalFilePicker({
    files,
    onFilesChange,
    resolveLanguageKey,
    disabled = false,
    maxFiles = 10,
    accept = "*/*",
    showLabel = false,
    labelKey = "form.mediaLabel",
    addFileKey = "form.addFile",
    filesSelectedKey = "form.filesSelected",
    aggregateReservedCount,
}: MultiLocalFilePickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const objectUrlByFile = useRef(new Map<File, string>());
    const reserved = aggregateReservedCount ?? 0;

    const urlFor = (file: File) => {
        let u = objectUrlByFile.current.get(file);
        if (!u) {
            u = URL.createObjectURL(file);
            objectUrlByFile.current.set(file, u);
        }
        return u;
    };

    useEffect(() => {
        const set = new Set(files);
        for (const [f, u] of objectUrlByFile.current.entries()) {
            if (!set.has(f)) {
                URL.revokeObjectURL(u);
                objectUrlByFile.current.delete(f);
            }
        }
    }, [files]);

    useEffect(() => {
        return () => {
            for (const u of objectUrlByFile.current.values()) {
                URL.revokeObjectURL(u);
            }
            objectUrlByFile.current.clear();
        };
    }, []);

    return (
        <div className="space-y-4">
            {showLabel ? <FormLabel>{String(resolveLanguageKey(labelKey))}</FormLabel> : null}
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept={accept}
                    multiple
                    onChange={(e) => {
                        const picked = Array.from(e.target.files || []);
                        if (picked.length > 0) {
                            const remaining = maxFiles - reserved - files.length;
                            onFilesChange([...files, ...picked.slice(0, Math.max(0, remaining))]);
                        }
                        e.target.value = "";
                    }}
                    disabled={disabled}
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || reserved + files.length >= maxFiles}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {String(resolveLanguageKey(addFileKey))}
                </Button>
                {reserved + files.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                        {reserved + files.length}/{maxFiles} {String(resolveLanguageKey(filesSelectedKey))}
                    </span>
                )}
            </div>
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {files.map((file, index) => (
                        <SingleFile
                            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                            file={{
                                id: `temp-${index}`,
                                file,
                                path: urlFor(file),
                                body: undefined,
                            }}
                            canDownload={true}
                            canRemove={true}
                            canPreview={true}
                            isBig={false}
                            onRemove={() => onFilesChange(files.filter((_, i) => i !== index))}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
