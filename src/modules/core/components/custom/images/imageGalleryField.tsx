import { useRef } from "react";
import { useFormContext } from "react-hook-form";
import { ImageWithRemove } from "@coreModule/components/custom/images/imageWithRemove.tsx";
import { Plus } from "lucide-react";
import {Label} from "@coreModule/components/ui/label.tsx";

const MAX_IMAGES = 10;
const DEFAULT_MEDIA_BASE_URL = "/api/auxiliary/media/";

type ImageGalleryFieldProps = {
    resolveLanguageKey: (key: string) => string;
    loading?: boolean;
    /** When true, items can be File | string (existing ID); show existing by URL when string. */
    editMode?: boolean;
    mediaBaseUrl?: string;
};

type Item = { type: "existing" | "newFile" | "placeholder" | "new"; id?: string; file?: File; index: number };

export function ImageGalleryField({ resolveLanguageKey, loading = false, editMode = false, mediaBaseUrl = DEFAULT_MEDIA_BASE_URL }: ImageGalleryFieldProps) {
    const form = useFormContext();
    const imageGalleryInputRef = useRef<HTMLInputElement>(null);

    const imageGallery = form.watch("imageGallery") || [];
    const totalImages = imageGallery.length;
    const items: Item[] = [];
    imageGallery.forEach((item: File | string, index: number) => {
        if (editMode && typeof item === "string") items.push({ type: "existing", id: item, index });
        else items.push({ type: "newFile", file: item as File, index });
    });
    for (let i = 0; i < MAX_IMAGES - totalImages; i++) items.push({ type: "placeholder", index: totalImages + i });

    const removeAt = (index: number) => {
        const current = form.getValues("imageGallery") || [];
        form.setValue("imageGallery", current.filter((_: unknown, i: number) => i !== index), { shouldValidate: true, shouldDirty: true });
    };

    return (
        <div>
            <div className="space-y-2">
                <Label>{resolveLanguageKey("form.imageGalleryLabel")}</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-10 gap-2">
                    {
                        items.map((item, idx) => {
                        if (item.type === "existing" && item.id) {
                            return (
                                <ImageWithRemove
                                    key={item.id}
                                    src={`${mediaBaseUrl}${item.id}`}
                                    alt={`Gallery ${item.index + 1}`}
                                    onRemove={() => removeAt(item.index)}
                                    disabled={loading}
                                    aspectSquare={true}
                                />
                            );
                        }
                        if ((item.type === "newFile" || item.type === "new") && item.file) {
                            return (
                                <ImageWithRemove
                                    key={`new-${idx}`}
                                    src={URL.createObjectURL(item.file)}
                                    alt={item.file.name}
                                    onRemove={() => removeAt(item.index)}
                                    disabled={loading}
                                    aspectSquare={true}
                                />
                            );
                        }
                        const isFirstPlaceholder = idx === items.findIndex((i) => i.type === "placeholder");
                        return (
                            <div key={`placeholder-${idx}`} className="relative">
                                <div className="w-full aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/30" onClick={() => imageGalleryInputRef.current?.click()}>
                                    <div className="text-center">
                                        <Plus className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-xs text-muted-foreground px-2">{item.index + 1}/{MAX_IMAGES}</p>
                                    </div>
                                </div>
                                {
                                    isFirstPlaceholder &&
                                    <input
                                        ref={imageGalleryInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            if (files.length > 0) {
                                                const current = form.getValues("imageGallery") || [];
                                                const remainingSlots = MAX_IMAGES - current.length;
                                                const filesToAdd = files.slice(0, remainingSlots);
                                                form.setValue("imageGallery", [...current, ...filesToAdd], { shouldValidate: true, shouldDirty: true });
                                            }
                                            e.target.value = "";
                                        }}
                                        disabled={loading}
                                    />
                                }
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
