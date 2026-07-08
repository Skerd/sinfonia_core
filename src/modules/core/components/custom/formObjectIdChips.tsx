import { useRef } from "react";
import type { MutableRefObject } from "react";
import { useFormContext, type FieldValues } from "react-hook-form";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import { Badge } from "@coreModule/components/ui/badge.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@coreModule/components/ui/tooltip.tsx";
import { ApiSelect } from "@coreModule/components/custom/apiSelect";
import { X } from "lucide-react";

/** `formExtras` key for optional `Record<fieldName, MutableRefObject<Record<id, label>>>`. */
export const FORM_EXTRAS_OBJECT_ID_CHIP_LABEL_REFS = "objectIdChipLabelRefs";

export type FormObjectIdChipsProps = {
    resolveLanguageKey: ResolveLanguageKey;
    loading?: boolean;
    disabled?: boolean;
    editMode?: boolean;
    /** RHF field name (array of string ids). */
    name: string;
    apiUrl: string;
    method?: string;
    placeholderKey: string;
    removeTooltipKey: string;
    selectPageSizeCreate?: number;
    selectPageSizeEdit?: number;
    /**
     * When set, merges with `formExtras[FORM_EXTRAS_OBJECT_ID_CHIP_LABEL_REFS][labelRefKey]` for display labels (e.g. edit preload).
     */
    labelRefFormExtraKey?: string;
    formExtras?: Record<string, unknown>;
};

/**
 * ApiSelect that appends ObjectIds to an array field and renders removable badge chips.
 * Config-driven via maestro `widgetProps`.
 */
export default function FormObjectIdChips({
    resolveLanguageKey,
    loading = false,
    disabled: disabledProp,
    editMode = false,
    name,
    apiUrl,
    method = "POST",
    placeholderKey,
    removeTooltipKey,
    selectPageSizeCreate = 50,
    selectPageSizeEdit = 200,
    labelRefFormExtraKey,
    formExtras,
}: FormObjectIdChipsProps) {
    const form = useFormContext<FieldValues>();
    const isDisabled = !!loading || !!disabledProp;
    const pageSize = editMode ? selectPageSizeEdit : selectPageSizeCreate;

    const internalRef = useRef<Record<string, string>>({});
    const extrasMap = formExtras?.[FORM_EXTRAS_OBJECT_ID_CHIP_LABEL_REFS] as
        | Record<string, MutableRefObject<Record<string, string>>>
        | undefined;
    const labelsRef: MutableRefObject<Record<string, string>> = labelRefFormExtraKey
        ? extrasMap?.[labelRefFormExtraKey] ?? internalRef
        : internalRef;

    const ids = (form.watch(name as any) as string[] | undefined) ?? [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
            <div className="flex flex-col gap-2 col-span-2">
                <ApiSelect
                    apiUrl={apiUrl}
                    method={method}
                    onValueChange={(value: string, label: string) => {
                        if (value && label) {
                            const current = (form.getValues(name as any) as string[] | undefined) ?? [];
                            if (!current.includes(value)) {
                                form.setValue(name as any, [...current, value], {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                });
                                labelsRef.current[value] = label;
                            }
                        }
                    }}
                    placeholder={resolveLanguageKey(placeholderKey)}
                    disabled={isDisabled}
                    pageSize={pageSize}
                />
                {ids.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {ids.map((id) => (
                            <Badge key={id} variant="secondary" className="gap-1">
                                <div className="flex items-center">
                                    <p>{labelsRef.current[id] || id}</p>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <X
                                                    className="size-3 hover:cursor-pointer hover:text-red-500"
                                                    onClick={() => {
                                                        const current =
                                                            (form.getValues(name as any) as string[] | undefined) ??
                                                            [];
                                                        form.setValue(
                                                            name as any,
                                                            current.filter((x) => x !== id),
                                                            { shouldValidate: true, shouldDirty: true },
                                                        );
                                                        delete labelsRef.current[id];
                                                    }}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{resolveLanguageKey(removeTooltipKey)}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
