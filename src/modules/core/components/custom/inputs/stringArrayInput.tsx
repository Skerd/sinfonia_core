import { useCallback, useEffect, useRef, useState } from "react";
import { useFormContext, type FieldPath, type FieldValues, type PathValue } from "react-hook-form";
import { X, CirclePlus } from "lucide-react";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import FormMaxLengthControl from "@coreModule/components/viewEngine/widgets/inputs/formMaxLengthControl.tsx";
import TruncatedValue from "@coreModule/components/viewEngine/widgets/display/truncatedValue.tsx";

/** Resolve label/placeholder/tooltip: use translator if provided, otherwise the key as literal text. */
function resolve(key: string, resolveLanguageKey?: (key: string) => string): string {
    return resolveLanguageKey ? resolveLanguageKey(key) : key;
}

/**
 * Stored values reach forms straight from the API, where an array field can arrive as `null`, as a
 * bare string, or with non-string entries; anything else would blow up in the badge list below.
 */
function toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is string => typeof entry === "string");
}

/** How long the existing chip stays highlighted after its value is typed again. */
const DUPLICATE_FLASH_MS = 1400;

export type StringArrayInputProps<TFieldValues extends FieldValues = FieldValues> = {
    /** Form field name for the string[] value (type-safe: must be a key of TFieldValues whose value is string[]). */
    name: FieldPath<TFieldValues>;
    /** Label text or translation key. Omit when a parent section already shows the title. */
    labelKey?: string;
    /** Placeholder text or translation key. */
    placeholderKey: string;
    /** Remove-button tooltip text or translation key. */
    removeTooltipKey: string;
    /** Add-button tooltip text or translation key. Falls back to the label when omitted. */
    addTooltipKey?: string;
    /** Optional: pass to use translation keys; omit to use labelKey/placeholderKey/removeTooltipKey as literal text. */
    resolveLanguageKey?: (key: string) => string;
    loading?: boolean;
    /** Optional: max number of items (no limit if omitted). */
    maxItems?: number;
    /** Optional: max characters per item. */
    maxLength?: number;
};

export function StringArrayInput<TFieldValues extends FieldValues = FieldValues>({
    name,
    labelKey,
    placeholderKey,
    removeTooltipKey,
    addTooltipKey,
    resolveLanguageKey,
    loading = false,
    maxItems,
    maxLength,
}: StringArrayInputProps<TFieldValues>) {
    const form = useFormContext<TFieldValues>();
    const [draft, setDraft] = useState("");
    /** The entry a repeated value already occupies, highlighted so the no-op is visible. */
    const [duplicateOf, setDuplicateOf] = useState<string | null>(null);
    const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    }, []);

    const capped = useCallback(
        (text: string) => (maxLength != null && maxLength > 0 ? text.slice(0, maxLength) : text),
        [maxLength],
    );

    const writeItems = useCallback(
        (next: string[]) => {
            form.setValue(name, next as PathValue<TFieldValues, FieldPath<TFieldValues>>, {
                shouldValidate: true,
                shouldDirty: true,
            });
        },
        [form, name],
    );

    const flashDuplicate = useCallback((value: string) => {
        setDuplicateOf(value);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setDuplicateOf(null), DUPLICATE_FLASH_MS);
    }, []);

    const add = () => {
        const trimmed = capped(draft.trim());
        if (!trimmed) return;
        const current = toStringArray(form.getValues(name));
        if (maxItems != null && current.length >= maxItems) return;
        if (current.includes(trimmed)) {
            // Dropping the draft on the floor with no sign of why read as a dead button.
            setDraft("");
            flashDuplicate(trimmed);
            return;
        }
        writeItems([...current, trimmed]);
        setDraft("");
    };

    const removeAt = (index: number) => {
        const current = toStringArray(form.getValues(name));
        // By index, not by value: data that arrived with repeats loses one entry per click.
        writeItems(current.filter((_, at) => at !== index));
    };

    const items = toStringArray(form.watch(name));
    const atMaxItems = maxItems != null && items.length >= maxItems;
    const canAdd = !loading && !atMaxItems && draft.trim().length > 0;

    const label = labelKey ? resolve(labelKey, resolveLanguageKey) : undefined;
    const placeholder = resolve(placeholderKey, resolveLanguageKey);
    const removeTooltip = resolve(removeTooltipKey, resolveLanguageKey);
    const addTooltip = addTooltipKey
        ? resolve(addTooltipKey, resolveLanguageKey)
        : (label ?? placeholder);

    const draftInput = (
        <Input
            value={draft}
            onChange={(e) => setDraft(capped(e.target.value))}
            onKeyDown={(e) => {
                // `isComposing` guards IME input, where Enter commits the candidate word.
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    add();
                }
            }}
            placeholder={placeholder}
            disabled={loading || atMaxItems}
            maxLength={maxLength != null && maxLength > 0 ? maxLength : undefined}
            className="min-w-0"
        />
    );

    return (
        <div className="min-w-0">
            <FormField
                control={form.control}
                name={name}
                render={() => (
                    <FormItem className="min-w-0">
                    {label ? <FormLabel>{label}</FormLabel> : null}
                    <div className={cn("flex min-w-0 gap-2", label && "mt-2")}>
                        <FormControl className="min-w-0 flex-1">
                            {maxLength != null && maxLength > 0 ? (
                                <FormMaxLengthControl maxLength={maxLength} value={draft}>
                                    {draftInput}
                                </FormMaxLengthControl>
                            ) : (
                                draftInput
                            )}
                        </FormControl>
                        {/* No tooltip unless the caller named one; the label stands in for the aria name. */}
                        <TooltipDisplayer tooltip={addTooltipKey ? addTooltip : undefined}>
                            <Button
                                type="button"
                                onClick={add}
                                // The icon leaves the button unnamed for screen readers.
                                aria-label={addTooltip}
                                disabled={!canAdd}
                                className="shrink-0"
                            >
                                <CirclePlus className="h-4 w-4" />
                            </Button>
                        </TooltipDisplayer>
                    </div>
                    <FormMessage />
                    {items.length > 0 && (
                        <div role="list" aria-label={label ?? placeholder} className="mt-2 flex min-w-0 flex-wrap gap-2">
                            {items.map((item, index) => (
                                <Badge
                                    key={index}
                                    role="listitem"
                                    variant="secondary"
                                    className={cn(
                                        "inline-flex h-auto w-auto max-w-[16rem] min-w-0 shrink gap-1 py-0.5 pl-2 pr-1.5 whitespace-nowrap",
                                        duplicateOf === item && "ring-2 ring-ring",
                                    )}
                                >
                                    <TruncatedValue
                                        text={item}
                                        className="min-w-0 flex-1 truncate text-xs leading-snug"
                                    >
                                        {item}
                                    </TruncatedValue>
                                    <TooltipDisplayer tooltip={removeTooltip}>
                                        <button
                                            type="button"
                                            aria-label={`${removeTooltip}: ${item}`}
                                            disabled={loading}
                                            className="inline-flex shrink-0 cursor-pointer rounded-sm text-secondary-foreground/70 transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                            onClick={() => removeAt(index)}
                                        >
                                            <X className="size-3 pointer-events-none" />
                                        </button>
                                    </TooltipDisplayer>
                                </Badge>
                            ))}
                        </div>
                    )}
                    </FormItem>
                )}
            />
        </div>
    );
}
