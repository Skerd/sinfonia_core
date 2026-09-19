import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { useFormContext, type FieldPath, type FieldValues, type PathValue } from "react-hook-form";
import type { ResolveLanguageKey } from "@baseModule/helpers/hocs/withLanguage.tsx";
import { Badge } from "@coreModule/components/ui/badge.tsx";
import { FormField, FormItem, FormMessage } from "@coreModule/components/ui/form.tsx";
import TooltipDisplayer from "@baseModule/components/custom/tooltipDisplayer.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import { ApiSelect } from "@coreModule/components/custom/apiSelect";
import { X } from "lucide-react";

/** `formExtras` key for optional `Record<fieldName, MutableRefObject<Record<id, label>>>`. */
export const FORM_EXTRAS_OBJECT_ID_CHIP_LABEL_REFS = "objectIdChipLabelRefs";

type ChipLabelOption = {value?: string; label?: string; _id?: string; name?: string};

export type ObjectIdChipsInputProps = {
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
 * The stored value comes back from the API, where the field may be missing, hold a bare string, or
 * carry populated objects. Only usable ids survive, and a repeat would collide on the chip key.
 */
function toObjectIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const ids: string[] = [];
    for (const entry of value) {
        const id = typeof entry === "string" ? entry : (entry as {_id?: string})?._id;
        if (typeof id === "string" && id !== "" && !ids.includes(id)) ids.push(id);
    }
    return ids;
}

/**
 * ApiSelect that appends ObjectIds to an array field and renders removable badge chips.
 * Config-driven via maestro `widgetProps`.
 *
 * Keeps a single empty picker (add-another). Already-selected ids are marked with a tick via
 * `markedValues` — not bound as multi-select `value` (that would pile selections into the trigger).
 */
export function ObjectIdChipsInput({
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
}: ObjectIdChipsInputProps) {
    const form = useFormContext<FieldValues>();
    const fieldName = name as FieldPath<FieldValues>;
    const isDisabled = !!loading || !!disabledProp;
    const pageSize = editMode ? selectPageSizeEdit : selectPageSizeCreate;

    const internalRef = useRef<Record<string, string>>({});
    const extrasMap = formExtras?.[FORM_EXTRAS_OBJECT_ID_CHIP_LABEL_REFS] as
        | Record<string, MutableRefObject<Record<string, string>>>
        | undefined;
    /**
     * Labels live in a ref rather than state because edit screens share the same ref to preload
     * names for ids the picker has never returned. Mutating it cannot trigger a render, so every
     * write is followed by this counter.
     */
    const labelsRef: MutableRefObject<Record<string, string>> = labelRefFormExtraKey
        ? extrasMap?.[labelRefFormExtraKey] ?? internalRef
        : internalRef;
    const [, repaintLabels] = useState(0);
    const bumpLabels = useCallback(() => repaintLabels((n) => n + 1), []);

    useEffect(() => {
        if (!labelRefFormExtraKey) return;
        const changed = seedLabelsFromOptions(
            labelsRef.current,
            formExtras?.[labelRefFormExtraKey],
        );
        if (changed) bumpLabels();
    }, [formExtras, labelRefFormExtraKey, labelsRef, bumpLabels]);

    const writeIds = useCallback(
        (next: string[]) => {
            form.setValue(fieldName, next as PathValue<FieldValues, FieldPath<FieldValues>>, {
                shouldValidate: true,
                shouldDirty: true,
            });
        },
        [form, fieldName],
    );

    const addId = useCallback(
        (value: string | string[], label?: string | string[]) => {
            const id = Array.isArray(value) ? value[0] : value;
            if (!id) return;
            const chipLabel = Array.isArray(label) ? label[0] : label;
            const current = toObjectIds(form.getValues(fieldName));
            if (current.includes(id)) return;
            // A label-less option is still a valid pick; the chip falls back to the id.
            if (chipLabel) labelsRef.current[id] = String(chipLabel);
            writeIds([...current, id]);
            bumpLabels();
        },
        [form, fieldName, labelsRef, writeIds, bumpLabels],
    );

    const removeId = useCallback(
        (id: string) => {
            writeIds(toObjectIds(form.getValues(fieldName)).filter((x) => x !== id));
            delete labelsRef.current[id];
            bumpLabels();
        },
        [form, fieldName, labelsRef, writeIds, bumpLabels],
    );

    const ids = toObjectIds(form.watch(fieldName));
    const placeholder = String(resolveLanguageKey(placeholderKey));
    const removeTooltip = String(resolveLanguageKey(removeTooltipKey));

    return (
        <FormField
            control={form.control}
            name={fieldName}
            render={() => (
                <FormItem className="min-w-0">
                    <ApiSelect
                        apiUrl={apiUrl}
                        method={method}
                        markedValues={ids}
                        onValueChange={addId}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        pageSize={pageSize}
                    />
                    <FormMessage />
                    {ids.length > 0 && (
                        <div role="list" className="flex min-w-0 flex-wrap gap-2">
                            {ids.map((id) => {
                                const label = labelsRef.current[id] || id;
                                return (
                                    <Badge
                                        key={id}
                                        role="listitem"
                                        variant="secondary"
                                        className="inline-flex h-auto w-auto max-w-[16rem] min-w-0 shrink gap-1 py-0.5 pl-2 pr-1.5 whitespace-nowrap"
                                    >
                                        <span className="min-w-0 flex-1 truncate">{label}</span>
                                        <TooltipDisplayer tooltip={removeTooltip}>
                                            <button
                                                type="button"
                                                // Icon-only, and one per chip: the name has to say which.
                                                aria-label={`${removeTooltip}: ${label}`}
                                                disabled={isDisabled}
                                                className={cn(
                                                    "inline-flex shrink-0 cursor-pointer rounded-sm text-secondary-foreground/70 transition-colors",
                                                    "hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                    "disabled:pointer-events-none disabled:opacity-50",
                                                )}
                                                onClick={() => removeId(id)}
                                            >
                                                <X className="size-3 pointer-events-none" />
                                            </button>
                                        </TooltipDisplayer>
                                    </Badge>
                                );
                            })}
                        </div>
                    )}
                </FormItem>
            )}
        />
    );
}

export default ObjectIdChipsInput;
