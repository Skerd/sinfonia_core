import { useState } from "react";
import { useFormContext, type FieldPath, type FieldValues } from "react-hook-form";
import { X, CirclePlus } from "lucide-react";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import FormMaxLengthControl from "@coreModule/components/custom/formMaxLengthControl.tsx";
import TruncatedValue from "@coreModule/components/custom/displayValue/truncatedValue.tsx";

/** Resolve label/placeholder/tooltip: use translator if provided, otherwise the key as literal text. */
function resolve(key: string, resolveLanguageKey?: (key: string) => string): string {
    return resolveLanguageKey ? resolveLanguageKey(key) : key;
}

export type StringArrayFieldProps<TFieldValues extends FieldValues = FieldValues> = {
    /** Form field name for the string[] value (type-safe: must be a key of TFieldValues whose value is string[]). */
    name: FieldPath<TFieldValues>;
    /** Label text or translation key. */
    labelKey: string;
    /** Placeholder text or translation key. */
    placeholderKey: string;
    /** Remove-button tooltip text or translation key. */
    removeTooltipKey: string;
    /** Optional: pass to use translation keys; omit to use labelKey/placeholderKey/removeTooltipKey as literal text. */
    resolveLanguageKey?: (key: string) => string;
    loading?: boolean;
    /** Optional: max number of items (no limit if omitted). */
    maxItems?: number;
    /** Optional: max characters per item. */
    maxLength?: number;
};

export function StringArrayField<TFieldValues extends FieldValues = FieldValues>({
    name,
    labelKey,
    placeholderKey,
    removeTooltipKey,
    resolveLanguageKey,
    loading = false,
    maxItems,
    maxLength,
}: StringArrayFieldProps<TFieldValues>) {
    const form = useFormContext<TFieldValues>();
    const [draft, setDraft] = useState("");

    const add = () => {
        let trimmed = draft.trim();
        if (!trimmed) return;
        if (maxLength != null && trimmed.length > maxLength) {
            trimmed = trimmed.slice(0, maxLength);
        }
        const current = (form.getValues(name) as string[] | undefined) || [];
        if (maxItems != null && current.length >= maxItems) return;
        if (!current.includes(trimmed)) {
            form.setValue(name, [...current, trimmed] as any, { shouldValidate: true, shouldDirty: true });
            setDraft("");
        }
    };

    const items = (form.watch(name) as string[] | undefined) || [];
    const atMaxItems = maxItems != null && items.length >= maxItems;

    const draftInput = (
        <Input
            value={draft}
            onChange={(e) => {
                let next = e.target.value;
                if (maxLength != null && next.length > maxLength) {
                    next = next.slice(0, maxLength);
                }
                setDraft(next);
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    add();
                }
            }}
            placeholder={resolve(placeholderKey, resolveLanguageKey)}
            disabled={loading || atMaxItems}
            maxLength={typeof maxLength === "number" ? maxLength : undefined}
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
                    <FormLabel>{resolve(labelKey, resolveLanguageKey)}</FormLabel>
                    <div className="mt-2 flex min-w-0 gap-2">
                        <FormControl className="min-w-0 flex-1">
                            {typeof maxLength === "number" && maxLength > 0 ? (
                                <FormMaxLengthControl maxLength={maxLength} value={draft}>
                                    {draftInput}
                                </FormMaxLengthControl>
                            ) : (
                                draftInput
                            )}
                        </FormControl>
                        <Button type="button" onClick={add} disabled={loading || atMaxItems} className="shrink-0">
                            <CirclePlus className="h-4 w-4" />
                        </Button>
                    </div>
                    <FormMessage />
                    {items.length > 0 && (
                        <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                            {items.map((item, index) => (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    className="inline-flex h-auto w-auto max-w-[16rem] min-w-0 shrink gap-1 py-0.5 pl-2 pr-1.5 whitespace-nowrap"
                                >
                                    <TruncatedValue
                                        text={item}
                                        className="min-w-0 flex-1 truncate text-xs leading-snug"
                                    >
                                        {item}
                                    </TruncatedValue>
                                    <TooltipDisplayer tooltip={resolve(removeTooltipKey, resolveLanguageKey)}>
                                        <button
                                            type="button"
                                            aria-label={resolve(removeTooltipKey, resolveLanguageKey)}
                                            className="inline-flex shrink-0 cursor-pointer rounded-sm text-secondary-foreground/70 transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            onClick={() => {
                                                const current = (form.getValues(name) as string[] | undefined) || [];
                                                form.setValue(name, current.filter((f) => f !== item) as any, { shouldValidate: true, shouldDirty: true });
                                            }}
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
