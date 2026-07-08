import MultiLocalFilePicker from "@coreModule/components/custom/files/multiLocalFilePicker.tsx";
import SingleFile from "@coreModule/components/custom/files/singleFile.tsx";
import { FormControl, FormField, FormItem, FormMessage } from "@coreModule/components/ui/form.tsx";
import type { Media } from "armonia/src/modules/core/types";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import { useFormContext, useWatch } from "react-hook-form";

export type FormEditMediaFieldProps = {
    resolveLanguageKey: ResolveLanguageKey;
    loading?: boolean;
    disabled?: boolean;
    /** Populated media from the parent (same shape as `inspection.media`). */
    formExtras?: Record<string, unknown>;
    /** RHF path for kept existing media ids (string[]). */
    currentMediaField?: string;
    /** RHF path for new `File[]` uploads. */
    newFilesField?: string;
    /** `formExtras` key for populated `Media[]` used to render existing thumbnails. */
    existingListExtraKey?: string;
    maxFiles?: number;
    accept?: string;
    existingFilesLabelKey?: string;
    newFilesLabelKey?: string;
};

function toFileList(value: unknown): File[] {
    if (!Array.isArray(value)) return [];
    return value.filter((x): x is File => x instanceof File);
}

/**
 * Edit flow: existing server media (ids in `currentMediaField`) plus new local files (`newFilesField`).
 * Register as `#FormEditMediaField`; pass `formExtras[existingListExtraKey]` as the inspection `media` array.
 */
export default function FormEditMediaField({
    resolveLanguageKey,
    loading = false,
    disabled = false,
    currentMediaField = "currentMedia",
    newFilesField = "media",
    existingListExtraKey = "editMediaExistingList",
    maxFiles = 10,
    accept = "*/*",
    existingFilesLabelKey = "form.existingFiles",
    newFilesLabelKey = "form.newFiles",
    formExtras,
}: FormEditMediaFieldProps) {
    const form = useFormContext();
    const isDisabled = !!(loading || disabled);
    const rawList = formExtras?.[existingListExtraKey];
    const safeList = Array.isArray(rawList) ? (rawList as Media[]) : [];
    const currentIds = (useWatch({ control: form.control, name: currentMediaField as never }) as string[] | undefined) ?? [];

    return (
        <div className="space-y-4">
            {currentIds.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{String(resolveLanguageKey(existingFilesLabelKey))}</p>
                    <div className="flex flex-wrap gap-2">
                        {currentIds.map((mediaId) => {
                            const media = safeList.find((m: any) => String(m?._id ?? m) === String(mediaId)) as Media | undefined;
                            if (!media) return null;
                            return (
                                <SingleFile
                                    key={mediaId}
                                    file={{
                                        id: mediaId,
                                        file: media,
                                        path: `/api/auxiliary/media/${mediaId}`,
                                        body: undefined,
                                    }}
                                    canDownload={true}
                                    canRemove={!isDisabled}
                                    canPreview={true}
                                    isBig={false}
                                    onRemove={() => {
                                        const raw = form.getValues(currentMediaField as never) as string[] | undefined;
                                        const arr = Array.isArray(raw) ? raw : [];
                                        form.setValue(
                                            currentMediaField as never,
                                            arr.filter((id) => id !== mediaId) as never,
                                            { shouldValidate: true },
                                        );
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            <div>
                <FormField
                    control={form.control}
                    name={newFilesField as never}
                    render={({ field }) => (
                        <FormItem>
                            <p className="text-sm text-muted-foreground">
                                {String(resolveLanguageKey(newFilesLabelKey))}
                            </p>
                            <FormControl>
                                <MultiLocalFilePicker
                                    files={toFileList(field.value)}
                                    onFilesChange={(next) => field.onChange(next.length ? next : undefined)}
                                    resolveLanguageKey={resolveLanguageKey}
                                    disabled={isDisabled}
                                    maxFiles={maxFiles}
                                    accept={accept}
                                    aggregateReservedCount={currentIds.length}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}
