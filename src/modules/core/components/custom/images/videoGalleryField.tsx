import { useRef } from "react";
import { useFormContext } from "react-hook-form";
import { VideoWithRemove } from "@coreModule/components/custom/images/videoWithRemove.tsx";
import { Plus } from "lucide-react";
import {Label} from "@coreModule/components/ui/label.tsx";

const MAX_VIDEOS = 3;
const DEFAULT_MEDIA_BASE_URL = "/api/auxiliary/media/";

type VideoGalleryFieldProps = {
    resolveLanguageKey: (key: string) => string;
    loading?: boolean;
    /** When true, items can be File | string (existing ID); show existing by URL when string. */
    editMode?: boolean;
    mediaBaseUrl?: string;
};

type Item = { type: "existing" | "newFile" | "placeholder" | "new" ; id?: string; file?: File; index: number };

export function VideoGalleryField({ resolveLanguageKey, loading = false, editMode = false, mediaBaseUrl = DEFAULT_MEDIA_BASE_URL }: VideoGalleryFieldProps) {
    const form = useFormContext();
    const videoGalleryInputRef = useRef<HTMLInputElement>(null);

    const videoGallery = form.watch("videoGallery") || [];
    const totalVideos = videoGallery.length;
    const items: Item[] = [];
    videoGallery.forEach((item: File | string, index: number) => {
        if (editMode && typeof item === "string") items.push({ type: "existing", id: item, index });
        else items.push({ type: "newFile", file: item as File, index });
    });
    for (let i = 0; i < MAX_VIDEOS - totalVideos; i++) items.push({ type: "placeholder", index: totalVideos + i });

    const removeAt = (index: number) => {
        const current = form.getValues("videoGallery") || [];
        form.setValue("videoGallery", current.filter((_: unknown, i: number) => i !== index), { shouldValidate: true, shouldDirty: true });
    };

    return (
        <div>
            <div className="space-y-2">
                <Label>{resolveLanguageKey("form.videoGalleryLabel")}</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-10 gap-2">
                    {
                        items.map((item, idx) => {
                        if (item.type === "existing" && item.id) {
                            return (
                                <VideoWithRemove
                                    key={item.id}
                                    src={`${mediaBaseUrl}${item.id}`}
                                    alt={`Video ${item.index + 1}`}
                                    onRemove={() => removeAt(item.index)}
                                    disabled={loading}
                                    aspectSquare={true}
                                />
                            );
                        }
                        if ((item.type === "newFile" || item.type === "new") && item.file) {
                            return (
                                <VideoWithRemove
                                    key={`new-${idx}`}
                                    src={URL.createObjectURL(item.file)}
                                    alt={item.file.name.substring(0, 15)}
                                    onRemove={() => removeAt(item.index)}
                                    disabled={loading}
                                    aspectSquare={true}
                                />
                            );
                        }
                        const isFirstPlaceholder = idx === items.findIndex((i) => i.type === "placeholder");
                        return (
                            <div key={`placeholder-${idx}`} className="relative">
                                <div
                                    className="w-full aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/30"
                                    onClick={() => videoGalleryInputRef.current?.click()}
                                >
                                    <div className="text-center">
                                        <Plus className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-xs text-muted-foreground px-2">{item.index + 1}/{MAX_VIDEOS}</p>
                                    </div>
                                </div>
                                {isFirstPlaceholder && (
                                    <input
                                        ref={videoGalleryInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="video/*"
                                        multiple
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            if (files.length > 0) {
                                                const current = form.getValues("videoGallery") || [];
                                                const remainingSlots = MAX_VIDEOS - current.length;
                                                const filesToAdd = files.slice(0, remainingSlots);
                                                form.setValue("videoGallery", [...current, ...filesToAdd], { shouldValidate: true, shouldDirty: true });
                                            }
                                            e.target.value = "";
                                        }}
                                        disabled={loading}
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
