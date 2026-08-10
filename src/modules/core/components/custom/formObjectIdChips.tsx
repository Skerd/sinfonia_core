import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { useFormContext, type FieldValues } from "react-hook-form";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import { Badge } from "@coreModule/components/ui/badge.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@coreModule/components/ui/tooltip.tsx";
import { ApiSelect } from "@coreModule/components/custom/apiSelect";
import { X } from "lucide-react";

/** `formExtras` key for optional `Record<fieldName, MutableRefObject<Record<id, label>>>`. */
export const FORM_EXTRAS_OBJECT_ID_CHIP_LABEL_REFS = "objectIdChipLabelRefs";

type ChipLabelOption = {value?: string; label?: string; _id?: string; name?: string};

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
     * Also accepts `formExtras[labelRefKey]` as `{value,label}[]` / `{_id,name}[]`.
     */
    labelRefFormExtraKey?: string;
    formExtras?: Record<string, unknown>;
};

function seedLabelsFromOptions(
    labels: Record<string, string>,
    options: unknown,
): boolean {
    if (!Array.isArray(options)) return false;
    let changed = false;
    for (const opt of options as ChipLabelOption[]) {
        const id = opt?.value ?? opt?._id;
        const label = opt?.label ?? opt?.name;
        if (!id || !label) continue;
        const key = String(id);
        const next = String(label);
        if (labels[key] !== next) {
            labels[key] = next;
            changed = true;
        }
    }
    return changed;
}

/**
 * ApiSelect that appends ObjectIds to an array field and renders removable badge chips.
 * Config-driven via maestro `widgetProps`.
 *
 * Keeps a single empty picker (add-another). Already-selected ids are marked with a tick via
 * `markedValues` — not bound as multi-select `value` (that would pile selections into the trigger).
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

    const [, setLabelTick] = useState(0);

    useEffect(() => {
        if (!labelRefFormExtraKey) return;
        const changed = seedLabelsFromOptions(
            labelsRef.current,
            formExtras?.[labelRefFormExtraKey],
        );
        if (changed) setLabelTick((n) => n + 1);
    }, [formExtras, labelRefFormExtraKey, labelsRef]);

    const ids = (form.watch(name as any) as string[] | undefined) ?? [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
            <div className="flex flex-col gap-2 col-span-2">
                <ApiSelect
                    apiUrl={apiUrl}
                    method={method}
                    markedValues={ids}
                    onValueChange={(value: string | string[], label?: string | string[]) => {
                        const id = Array.isArray(value) ? value[0] : value;
                        const lbl = Array.isArray(label) ? label[0] : label;
                        if (!id || !lbl) return;
                        const current = (form.getValues(name as any) as string[] | undefined) ?? [];
                        if (current.includes(id)) return;
                        form.setValue(name as any, [...current, id], {
                            shouldValidate: true,
                            shouldDirty: true,
                        });
                        labelsRef.current[id] = String(lbl);
                        setLabelTick((n) => n + 1);
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
                                                    className="size-3 hover:cursor-pointer hover:text-destructive"
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
                                                        setLabelTick((n) => n + 1);
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
