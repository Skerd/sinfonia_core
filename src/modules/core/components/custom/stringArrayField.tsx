import { useState } from "react";
import { useFormContext, type FieldPath, type FieldValues } from "react-hook-form";
import { X, CirclePlus } from "lucide-react";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";

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
};

export function StringArrayField<TFieldValues extends FieldValues = FieldValues>({
    name,
    labelKey,
    placeholderKey,
    removeTooltipKey,
    resolveLanguageKey,
    loading = false,
    maxItems
}: StringArrayFieldProps<TFieldValues>) {
    const form = useFormContext<TFieldValues>();
    const [draft, setDraft] = useState("");

    const add = () => {
        const trimmed = draft.trim();
        if (trimmed) {
            const current = (form.getValues(name) as string[] | undefined) || [];
            if (maxItems != null && current.length >= maxItems) return;
            if (!current.includes(trimmed)) {
                form.setValue(name, [...current, trimmed] as any, { shouldValidate: true, shouldDirty: true });
                setDraft("");
            }
        }
    };

    const items = (form.watch(name) as string[] | undefined) || [];
    const atMax = maxItems != null && items.length >= maxItems;

    return (
        <div>
            <FormField
                control={form.control}
                name={name}
                render={() => (
                    <FormItem>
                    <FormLabel>{resolve(labelKey, resolveLanguageKey)}</FormLabel>
                    <div className="flex gap-2 mt-2">
                        <FormControl>
                            <Input
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        add();
                                    }
                                }}
                                placeholder={resolve(placeholderKey, resolveLanguageKey)}
                                disabled={loading || atMax}
                            />
                        </FormControl>
                        <Button type="button" onClick={add} disabled={loading || atMax}>
                            <CirclePlus className="h-4 w-4" />
                        </Button>
                    </div>
                    <FormMessage />
                    {items.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {items.map((item, index) => (
                                <Badge key={index} variant="secondary" className="gap-1">
                                    <div className="flex items-center">
                                        <p>{item}</p>
                                        <TooltipDisplayer tooltip={resolve(removeTooltipKey, resolveLanguageKey)}>
                                            <X
                                                className="size-3 hover:cursor-pointer hover:text-red-500"
                                                onClick={() => {
                                                    const current = (form.getValues(name) as string[] | undefined) || [];
                                                    form.setValue(name, current.filter((f) => f !== item) as any, { shouldValidate: true, shouldDirty: true });
                                                }}
                                            />
                                        </TooltipDisplayer>
                                    </div>
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
