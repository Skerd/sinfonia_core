import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import type {Media} from "armonia/src/modules/core/types";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useFormContext} from "react-hook-form";
import MultiLocalFilePicker from "@coreModule/components/custom/files/multiLocalFilePicker.tsx";
import SingleFile from "@coreModule/components/custom/files/singleFile.tsx";

export type FormMultiLocalFileFieldProps = {
    /** RHF field path (e.g. `media`). Value may be `File[]` (create) or `(string | File)[]` (edit: kept ids + new files). */
    name: string;
    resolveLanguageKey: ResolveLanguageKey;
    loading?: boolean;
    disabled?: boolean;
    maxFiles?: number;
    accept?: string;
    showLabel?: boolean;
    labelKey?: string;
    addFileKey?: string;
    filesSelectedKey?: string;
    /** Populated `Media[]` from the parent; used with `existingListExtraKey` to render existing server files. */
    formExtras?: Record<string, unknown>;
    /** When set, `formExtras[existingListExtraKey]` is used to resolve thumbnails for string ids in the field value. */
    existingListExtraKey?: string;
    /** i18n key for the “existing files” caption (edit). */
    existingFilesLabelKey?: string;
    /** i18n key shown above the picker when there are kept server ids (edit). */
    newFilesLabelKey?: string;
};

function splitIdsAndFiles(value: unknown): {ids: string[]; files: File[]} {
    if (!Array.isArray(value)) return {ids: [], files: []};
    const ids: string[] = [];
    const files: File[] = [];
    for (const item of value) {
        if (typeof item === "string" && item.trim() !== "") ids.push(item);
        else if (item instanceof File) files.push(item);
    }
    return {ids, files};
}

/** Always return an array (including `[]`). Using `undefined` on `onChange` would revert RHF to `defaultValues` and bring back initial ids/files. */
function toCombinedValue(ids: string[], files: File[]): (string | File)[] {
    return [...ids, ...files];
}

function toFileList(value: unknown): File[] {
    if (!Array.isArray(value)) return [];
    return value.filter((x): x is File => x instanceof File);
}

/**
 * Compound form widget: `MultiLocalFilePicker` bound to RHF. In edit flows, string ids in the same
 * field (with optional `formExtras` + `existingListExtraKey`) render as existing server media above the picker.
 */
export default function FormMultiLocalFileField({
    name,
    resolveLanguageKey,
    loading = false,
    disabled = false,
    maxFiles = 10,
    accept = "*/*",
    showLabel = false,
    labelKey = "form.mediaLabel",
    addFileKey,
    filesSelectedKey,
    formExtras,
    existingListExtraKey,
    existingFilesLabelKey = "form.existingFiles",
    newFilesLabelKey,
}: FormMultiLocalFileFieldProps) {
    const form = useFormContext();
    const isDisabled = !!(loading || disabled);

    const rawList =
        existingListExtraKey !== undefined && existingListExtraKey !== "" && formExtras?.[existingListExtraKey] != null
            ? formExtras[existingListExtraKey]
            : undefined;
    const safeList = Array.isArray(rawList) ? (rawList as Media[]) : [];

    return (
        <div>
            <FormField
                control={form.control}
                name={name as never}
                render={({field}) => {
                    const {ids} = splitIdsAndFiles(field.value);
                    const pickerShowLabel = showLabel && ids.length === 0;

                    const resolveMedia = (mediaId: string): Media =>
                        (safeList.find((m: { _id?: string }) => String(m?._id ?? m) === String(mediaId)) as Media | undefined) ??
                        ({_id: mediaId} as Media);

                    return (
                        <FormItem className="w-full">
                            {showLabel && ids.length > 0 ? (
                                <FormLabel>{String(resolveLanguageKey(labelKey))}</FormLabel>
                            ) : null}
                            {ids.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        {String(resolveLanguageKey(existingFilesLabelKey))}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {ids.map((mediaId) => {
                                            const media = resolveMedia(mediaId);
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
                                                        const cur = splitIdsAndFiles(field.value);
                                                        const nextIds = cur.ids.filter((id) => id !== mediaId);
                                                        field.onChange(toCombinedValue(nextIds, cur.files));
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : null}

                            {ids.length > 0 && newFilesLabelKey ? (
                                <p className="text-sm text-muted-foreground pt-1">
                                    {String(resolveLanguageKey(newFilesLabelKey))}
                                </p>
                            ) : null}

                            <FormControl>
                                <MultiLocalFilePicker
                                    files={toFileList(field.value)}
                                    onFilesChange={(next) => {
                                        const cur = splitIdsAndFiles(field.value);
                                        field.onChange(toCombinedValue(cur.ids, next));
                                    }}
                                    resolveLanguageKey={resolveLanguageKey}
                                    disabled={isDisabled}
                                    maxFiles={maxFiles}
                                    accept={accept}
                                    showLabel={pickerShowLabel}
                                    labelKey={labelKey}
                                    addFileKey={addFileKey}
                                    filesSelectedKey={filesSelectedKey}
                                    aggregateReservedCount={ids.length}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    );
                }}
            />
        </div>
    );
}
