import {CirclePlus, X} from "lucide-react";
import {useFieldArray, useFormContext} from "react-hook-form";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";

function resolve(key: string, resolveLanguageKey?: (key: string) => string): string {
    return resolveLanguageKey ? String(resolveLanguageKey(key)) : key;
}

export type ListingFaqsFieldProps = {
    name: string;
    labelKey?: string;
    questionPlaceholderKey: string;
    answerPlaceholderKey: string;
    addRowLabelKey: string;
    removeRowTooltipKey: string;
    resolveLanguageKey?: (key: string) => string;
    loading?: boolean;
    maxRows?: number;
};

/** RHF `useFieldArray` for `{ question: string; answer: string }[]` listing FAQs. */
export function ListingFaqsField({
    name,
    labelKey,
    questionPlaceholderKey,
    answerPlaceholderKey,
    addRowLabelKey,
    removeRowTooltipKey,
    resolveLanguageKey,
    loading = false,
    maxRows = 40,
}: ListingFaqsFieldProps) {
    const form = useFormContext();
    const {fields, append, remove} = useFieldArray({control: form.control, name: name as never});

    const atMax = fields.length >= maxRows;

    return (
        <FormField
            control={form.control}
            name={name as never}
            render={() => (
                <FormItem className="space-y-4">
                    {labelKey ? <FormLabel>{resolve(labelKey, resolveLanguageKey)}</FormLabel> : null}
                    <div className="flex flex-col gap-4">
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-start md:gap-4"
                            >
                                <FormField
                                    control={form.control}
                                    name={`${name}.${index}.question` as never}
                                    render={({field: qf}) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    {...qf}
                                                    placeholder={resolve(questionPlaceholderKey, resolveLanguageKey)}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`${name}.${index}.answer` as never}
                                    render={({field: af}) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    {...af}
                                                    placeholder={resolve(answerPlaceholderKey, resolveLanguageKey)}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0 self-end"
                                    disabled={loading}
                                    title={resolve(removeRowTooltipKey, resolveLanguageKey)}
                                    onClick={() => remove(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={loading || atMax}
                        className="w-fit gap-2"
                        onClick={() => append({question: "", answer: ""} as never)}
                    >
                        <CirclePlus className="h-4 w-4" />
                        {resolve(addRowLabelKey, resolveLanguageKey)}
                    </Button>
                </FormItem>
            )}
        />
    );
}
