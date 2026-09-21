import {useRef, type ComponentType} from "react";
import {useFormContext} from "react-hook-form";
import {Plus} from "lucide-react";
import {Label} from "@coreModule/components/ui/label.tsx";
import {MEDIA_BASE_URL} from "@coreModule/helpers/constants/media.constants.ts";
import {useObjectUrls} from "@coreModule/helpers/hooks/components/useObjectUrls.ts";

/** Props every caller of a concrete gallery field (image, video, …) passes through. */
export type GalleryFieldProps = {
    resolveLanguageKey: (key: string) => string;
    loading?: boolean;
    /** When true, entries can be `File | string` (an existing media id shown by URL). */
    editMode?: boolean;
    mediaBaseUrl?: string;
};

/** The shape both `ImageWithRemove` and `VideoWithRemove` already satisfy. */
export type GalleryItemComponentProps = {
    src: string;
    alt: string;
    onRemove: () => void;
    disabled?: boolean;
    aspectSquare?: boolean;
};

type MediaGalleryFieldProps = GalleryFieldProps & {
    /** Form field holding the gallery array, e.g. `"imageGallery"`. */
    fieldName: string;
    maxItems: number;
    /** `accept` for the hidden file input, e.g. `"image/*"`. */
    accept: string;
    labelKey: string;
    ItemComponent: ComponentType<GalleryItemComponentProps>;
    /** Alt text for an already-uploaded entry, given its 1-based position. */
    existingAlt: (position: number) => string;
    /** Alt text for a not-yet-uploaded File. */
    fileAlt: (file: File) => string;
};

type Item =
    | {type: "existing"; id: string; index: number}
    | {type: "newFile"; file: File; index: number}
    | {type: "placeholder"; index: number};

/**
 * Grid of media thumbnails backed by a react-hook-form array field, with a fixed number of
 * "add" placeholders trailing the filled slots.
 *
 * `imageGalleryField` and `videoGalleryField` were byte-for-byte copies of each other apart
 * from the media kind, so the behaviour lives here once and each kind supplies its config.
 */
export function MediaGalleryField({
    resolveLanguageKey,
    loading = false,
    editMode = false,
    mediaBaseUrl = MEDIA_BASE_URL,
    fieldName,
    maxItems,
    accept,
    labelKey,
    ItemComponent,
    existingAlt,
    fileAlt,
}: MediaGalleryFieldProps) {
    const form = useFormContext();
    const inputRef = useRef<HTMLInputElement>(null);

    const gallery: (File | string)[] = form.watch(fieldName) || [];
    const urlForFile = useObjectUrls(gallery);

    const items: Item[] = gallery.map((entry, index) =>
        editMode && typeof entry === "string"
            ? {type: "existing" as const, id: entry, index}
            : {type: "newFile" as const, file: entry as File, index},
    );
    for (let i = gallery.length; i < maxItems; i++) items.push({type: "placeholder", index: i});

    const removeAt = (index: number) => {
        const current: unknown[] = form.getValues(fieldName) || [];
        form.setValue(fieldName, current.filter((_, i) => i !== index), {shouldValidate: true, shouldDirty: true});
    };

    const addFiles = (files: File[]) => {
        if (files.length === 0) return;
        const current: unknown[] = form.getValues(fieldName) || [];
        form.setValue(fieldName, [...current, ...files.slice(0, maxItems - current.length)], {
            shouldValidate: true,
            shouldDirty: true,
        });
    };

    const firstPlaceholder = items.findIndex((i) => i.type === "placeholder");
    const label = resolveLanguageKey(labelKey);

    return (
        // The plain outer wrapper is load-bearing: it keeps this field a single block-level
        // child of whatever layout the form renders it into, as it was before the merge.
        <div>
            <div className="flex flex-col gap-y-2">
                <Label>{label}</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-10 gap-2">
                    {items.map((item, idx) => {
                        if (item.type === "existing") {
                            return (
                                <ItemComponent
                                    key={`existing-${item.id}`}
                                    src={`${mediaBaseUrl}${item.id}`}
                                    alt={existingAlt(item.index + 1)}
                                    onRemove={() => removeAt(item.index)}
                                    disabled={loading}
                                    aspectSquare
                                />
                            );
                        }
                        if (item.type === "newFile") {
                            return (
                                <ItemComponent
                                    key={`new-${idx}`}
                                    src={urlForFile(item.file)}
                                    alt={fileAlt(item.file)}
                                    onRemove={() => removeAt(item.index)}
                                    disabled={loading}
                                    aspectSquare
                                />
                            );
                        }
                        return (
                            <div key={`placeholder-${idx}`} className="relative">
                                <button
                                    type="button"
                                    disabled={loading}
                                    aria-label={label}
                                    className="w-full aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/30 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    onClick={() => inputRef.current?.click()}
                                >
                                    <div className="text-center">
                                        <Plus className="h-10 w-10 mx-auto text-muted-foreground mb-2"/>
                                        <p className="text-xs text-muted-foreground px-2">{item.index + 1}/{maxItems}</p>
                                    </div>
                                </button>
                                {idx === firstPlaceholder && (
                                    <input
                                        ref={inputRef}
                                        type="file"
                                        className="hidden"
                                        accept={accept}
                                        multiple
                                        disabled={loading}
                                        onChange={(e) => {
                                            addFiles(Array.from(e.target.files || []));
                                            e.target.value = "";
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default MediaGalleryField;
