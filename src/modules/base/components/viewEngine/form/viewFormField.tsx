import type {ReactNode} from "react";
import type {Control, FieldValues, Path} from "react-hook-form";
import type {FieldBinding, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ResolveLanguageKey} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {isCompoundFormWidget, resolveWidget} from "../widgetRegistry.ts";
import type {FormWidgetExtra} from "./types.ts";
import {renderCompoundWidget} from "./widgets/compound.tsx";
import {renderFormWidget} from "./widgets/scalar.tsx";

type FieldRendererOptions<T extends FieldValues> = {
    control: Control<T>;
    resolveLanguageKey: ResolveLanguageKey;
    /** Form-level state for the widgets; `extra.loading` also disables plain fields. */
    extra: FormWidgetExtra;
    /** Return false to leave a field out (edit-form write gate). */
    canRender?: (binding: FieldBinding) => boolean;
};

/**
 * `ViewRendererContext.renderField` for a view form: compound widgets render as-is (they own
 * their `FormField`s); everything else gets a labelled `FormField` around its control.
 */
export function createFormFieldRenderer<T extends FieldValues>({
    control,
    resolveLanguageKey,
    extra,
    canRender,
}: FieldRendererOptions<T>) {
    return function renderField(_node: ViewNode, binding: FieldBinding, index: number): ReactNode {
        const Widget = resolveWidget(binding.widget);
        if (!Widget) return null;
        if (canRender && !canRender(binding)) return null;

        if (isCompoundFormWidget(binding.widget)) {
            return <div key={index}>{renderCompoundWidget(Widget, binding, resolveLanguageKey, extra)}</div>;
        }

        return (
            <div key={index}>
                <FormField
                    control={control}
                    name={binding.name as Path<T>}
                    disabled={extra.loading || binding.disabled}
                    render={({field}) => (
                        <FormItem>
                            {binding.label && (
                                <FormLabel>
                                    {/* Single flex child so `Label`'s gap-2 doesn't detach the marker. */}
                                    <span>
                                        {resolveLanguageKey(binding.label)}
                                        {binding.required && (
                                            <span aria-hidden="true" className="ml-0.5 text-destructive">*</span>
                                        )}
                                    </span>
                                </FormLabel>
                            )}
                            <FormControl aria-required={binding.required || undefined}>
                                {renderFormWidget(Widget, binding, field, resolveLanguageKey, extra)}
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        );
    };
}
