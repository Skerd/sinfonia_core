import { type ReactNode, useImperativeHandle } from "react";
import { useForm, type Resolver, type FieldValues, type UseFormReturn, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ViewConfig, ViewNode, FieldBinding } from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import type { WithAxiosLifecycleRef } from "@coreModule/helpers/hocs/withAxios.tsx";
import type { RefObject } from "react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@coreModule/components/ui/form.tsx";
import { Button } from "@coreModule/components/ui/button.tsx";
import { LoaderCircle, Save } from "lucide-react";
import Header from "@coreModule/components/custom/header.tsx";
import ViewRenderer, { type ViewRendererContext } from "./ViewRenderer.tsx";
import { resolveWidget } from "./widgetRegistry.ts";
import { renderFormWidget, isCompoundFormWidget, renderCompoundWidget } from "./renderFormWidget.tsx";
import {buildTitleBreadcrumb} from "@coreModule/helpers/general";

export type FormViewRendererProps<T extends FieldValues = FieldValues> = {
    config: ViewConfig;
    resolveLanguageKey: ResolveLanguageKey;
    formSchema: Parameters<typeof zodResolver>[0];
    defaultValues: T | Partial<T>;
    loading: boolean;
    innerRef: RefObject<WithAxiosLifecycleRef<any> | null>;
    onSubmit: (data: T) => void;
    onCancel: () => void;
    submitIcon?: ReactNode;
    /** Static extra content rendered after config-driven fields. */
    children?: ReactNode;
    /** Optional bag for compound widgets (e.g. `#FormObjectIdChips` label refs). */
    formExtras?: Record<string, unknown>;
    /**
     * Render prop for interactive children that need form access
     * (cascading selects, map pins, polygon selectors, etc.).
     * Rendered after config-driven fields and before static children.
     */
    renderChildren?: (form: UseFormReturn<T>) => ReactNode;

    /** Override the default useImperativeHandle success behavior. */
    onSuccess?: () => void;
    extraTitles?: (string | undefined)[];
    /** Disables the submit control (e.g. client-side pricing gates) without affecting cancel. */
    submitDisabled?: boolean;
    /** When set, hides page shell (header / heavy padding) for embedding in dialogs/sheets. */
    hideChrome?: boolean;
    /** When set, used instead of the default `zodResolver(formSchema)`. */
    resolver?: Resolver<T>;
};

export default function FormViewRenderer<T extends FieldValues = FieldValues>({
    config,
    resolveLanguageKey,
    formSchema,
    defaultValues,
    loading,
    innerRef,
    onSubmit,
    onCancel,
    submitIcon,
    children,
    formExtras,
    renderChildren,
    onSuccess,
    extraTitles = [],
    submitDisabled = false,
    hideChrome = false,
    resolver: resolverProp,
}: FormViewRendererProps<T>) {

    const form = useForm<T>({
        resolver: (resolverProp ?? (zodResolver(formSchema) as Resolver<T>)) as Resolver<T>,
        defaultValues: defaultValues as DefaultValues<T>,
    });

    useImperativeHandle(innerRef, () => ({
        success: () => {
            if (onSuccess) onSuccess();
            else form.reset();
        },
    }));

    const renderField = (_node: ViewNode, binding: FieldBinding, index: number): ReactNode => {
        const WidgetComponent = resolveWidget(binding.widget);
        if (!WidgetComponent) return null;

        if (isCompoundFormWidget(binding.widget)) {
            return (
                <div key={index}>
                    {renderCompoundWidget(WidgetComponent, binding, resolveLanguageKey, {
                        loading,
                        formExtras,
                    })}
                </div>
            );
        }

        return (
            <div key={index}>
                <FormField
                    control={form.control}
                    name={binding.name as any}
                    disabled={loading || binding.disabled}
                    render={({ field }) => (
                        <FormItem>
                            {
                                binding.label &&
                                <FormLabel>{resolveLanguageKey(binding.label)}</FormLabel>
                            }
                            <FormControl>
                                {
                                    renderFormWidget(
                                        WidgetComponent,
                                        binding,
                                        field,
                                        resolveLanguageKey,
                                        {
                                            loading,
                                            formExtras,
                                        }
                                    )
                                }
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        );
    };

    const ctx: ViewRendererContext = {
        resolveLanguageKey,
        mode: "form",
        renderField,
        formLoading: loading,
        formExtras,
    };

    return (
        // Avoid nested `.flex-full` (each sets overflow-y: auto) — panel content is the sole scroll root.
        <div className="flex flex-col gap-4">
            {!hideChrome && (
                <Header
                    title={buildTitleBreadcrumb(resolveLanguageKey("formHeader.title"), extraTitles?.filter(Boolean))}
                    description={resolveLanguageKey("formHeader.description")}
                />
            )}
            <div className={`space-y-4 ${hideChrome ? "px-0 pb-2" : "px-2 pb-[100px]"}`}>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit as any)} className="grid gap-4">

                        {formExtras?.renderChildrenFirst ? renderChildren?.(form) : null}

                        <ViewRenderer nodes={config.nodes} ctx={ctx} />

                        {!formExtras?.renderChildrenFirst ? renderChildren?.(form) : null}

                        {children}

                        <div className="flex grow items-center justify-end gap-2">
                            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                                {resolveLanguageKey("formButtons.cancel")}
                            </Button>
                            <Button type="submit" disabled={loading || submitDisabled}>
                                {loading ? <LoaderCircle className="animate-spin h-4 w-4" /> : (submitIcon ?? <Save />)}
                                {resolveLanguageKey("formButtons.submit")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}

