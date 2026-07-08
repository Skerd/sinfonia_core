import { ChangeEvent, KeyboardEvent, useCallback, useState } from "react";
import { useFormContext, type FieldPath, type FieldValues, type PathValue } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@coreModule/components/ui/form.tsx";
import { Input } from "@coreModule/components/ui/input.tsx";
import { Button } from "@coreModule/components/ui/button.tsx";
import { Badge } from "@coreModule/components/ui/badge.tsx";
import { X, CirclePlus } from "lucide-react";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";

export type ArrayOfStringsFieldProps<TFieldValues extends FieldValues = FieldValues> = WithLanguageType & {
    /** Form field name for the string[] value (type-safe: must be a key of TFieldValues whose value is string[]). */
    name: FieldPath<TFieldValues>;
    /** Label text */
    label: string;
    /** Placeholder text*/
    placeholder: string;
    loading?: boolean;
    /** Optional: max number of items (no limit if omitted). */
    maxItems?: number;
};

export function ArrayOfStringsField<TFieldValues extends FieldValues = FieldValues>({
    name,
    label,
    placeholder,
    resolveLanguageKey,
    loading = false,
    maxItems,
}: ArrayOfStringsFieldProps<TFieldValues>) {
    const form = useFormContext<TFieldValues>();
    const [draft, setDraft] = useState("");

    const add = useCallback(() => {
        const trimmed = draft.trim();
        if (!trimmed) return;
        const current = (form.getValues(name) as string[] | undefined) || [];
        if (maxItems != null && current.length >= maxItems) return;
        if (current.includes(trimmed)) return;
        form.setValue(name, [...current, trimmed] as PathValue<TFieldValues, FieldPath<TFieldValues>>, {
            shouldValidate: true,
            shouldDirty: true
        });
        setDraft("");
    }, [draft, form, name, maxItems]);

    const removeItem = useCallback((item: string) => {
        const current = (form.getValues(name) as string[] | undefined) || [];
        form.setValue(
            name,
            current.filter((f) => f !== item) as PathValue<TFieldValues, FieldPath<TFieldValues>>,
            { shouldValidate: true, shouldDirty: true }
        );
    }, [form, name]);

    const items = (form.watch(name) as string[] | undefined) || [];
    const atMax = maxItems != null && items.length >= maxItems;

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            add();
        }
    }, [add]);

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value), []);

    return (
        <FormField
            control={form.control}
            name={name}
            render={() => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <div className="flex gap-2 mt-2">
                        <FormControl>
                            <Input
                                value={draft}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                disabled={loading || atMax}
                                aria-invalid={!!form.formState.errors[name]}
                            />
                        </FormControl>
                        <TooltipDisplayer tooltip={resolveLanguageKey("addButtonLabel")}>
                            <Button
                                type="button"
                                onClick={add}
                                disabled={loading || atMax}
                                aria-label={resolveLanguageKey("addButtonLabel")}
                            >
                                <CirclePlus className="h-4 w-4" />
                            </Button>
                        </TooltipDisplayer>
                    </div>
                    {
                        atMax &&
                        <p className="text-muted-foreground text-sm mt-1">
                            {resolveLanguageKey("maxItemsReached")}
                        </p>
                    }
                    <FormMessage />
                    {
                        items.length > 0 &&
                        <ul className="flex flex-wrap gap-2 mt-2 list-none p-0 m-0" role="list" aria-label={label}>
                            {
                                items.map((item, index) => (
                                    <li key={`${index}-${item}`} role="listitem">
                                        <Badge variant="secondary" className="gap-1">
                                            <span>{item}</span>
                                            <TooltipDisplayer tooltip={resolveLanguageKey("removeTooltip")}>
                                                <Button
                                                    type="button"
                                                    size={"icon-sm"}
                                                    onClick={() => removeItem(item)}
                                                    className="inline-flex rounded p-0.5 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                                                    aria-label={`${resolveLanguageKey("removeTooltip")}: ${item}`}
                                                >
                                                    <X className="size-3 hover:text-destructive" aria-hidden />
                                                </Button>
                                            </TooltipDisplayer>
                                        </Badge>
                                    </li>
                                ))
                            }
                        </ul>
                    }
                </FormItem>
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/arrayOfStringsField.tsx")
)(ArrayOfStringsField);