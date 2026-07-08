import { useRef } from "react";
import { useFormContext } from "react-hook-form";
import { ImageWithRemove } from "@coreModule/components/custom/images/imageWithRemove.tsx";
import { Plus } from "lucide-react";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

const DEFAULT_MEDIA_BASE_URL = "/api/auxiliary/media/";

type MainImageFieldProps = {
    resolveLanguageKey: (key: string) => string;
    loading?: boolean;
    /** When true, value can be File | string (existing media ID); show existing image by URL when string. */
    editMode?: boolean;
    /** Base URL for existing media in edit mode (default: /api/auxiliary/media/) */
    mediaBaseUrl?: string;
};

export function MainImageField({ resolveLanguageKey, loading = false, editMode = false, mediaBaseUrl = DEFAULT_MEDIA_BASE_URL }: MainImageFieldProps) {
    const form = useFormContext();
    const mainImageInputRef = useRef<HTMLInputElement>(null);
    const value = form.watch("mainImage");
    const isFile = value instanceof File;
    const isExistingString = editMode && typeof value === "string" && value;

    return (
        <div>
            <FormField
                control={form.control}
                name="mainImage"
                disabled={loading}
                render={() => (
                    <FormItem>
                    <FormLabel>{resolveLanguageKey("form.mainImageLabel")}{!editMode ? " *" : ""}</FormLabel>
                    <FormControl>
                        <div>
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-10 gap-2">
                                    {
                                        isExistingString &&
                                        <ImageWithRemove
                                            src={`${mediaBaseUrl}${value}`}
                                            alt="Main image"
                                            onRemove={() => form.setValue("mainImage", "", { shouldValidate: true, shouldDirty: true })}
                                            disabled={loading}
                                            aspectSquare={true}
                                        />
                                    }
                                    {
                                        isFile &&
                                        <ImageWithRemove
                                            src={URL.createObjectURL(value)}
                                            alt={value.name}
                                            onRemove={() => form.resetField("mainImage")}
                                            disabled={loading}
                                            aspectSquare={true}
                                        />
                                    }
                                    {
                                        !isExistingString && !isFile &&
                                        <div className="relative">
                                            <div className={cn("rounded-lg aspect-square border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/30", form.formState.errors.mainImage ? "border-destructive" : "border-border")} onClick={() => mainImageInputRef.current?.click()}>
                                                <div className="text-center">
                                                    <Plus className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                                                    <p className="text-sm text-muted-foreground">{resolveLanguageKey("form.uploadNewImageHint")}</p>
                                                </div>
                                            </div>
                                            <input
                                                ref={mainImageInputRef}
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) form.setValue("mainImage", file, { shouldValidate: true, shouldDirty: true });
                                                    e.target.value = "";
                                                }}
                                                disabled={loading}
                                            />
                                        </div>
                                    }
                                </div>
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
