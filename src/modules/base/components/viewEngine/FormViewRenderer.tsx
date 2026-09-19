import {type ReactNode, type RefObject, useImperativeHandle} from "react";
import {useForm, type DefaultValues, type FieldValues, type Resolver, type UseFormReturn} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ResolveLanguageKey} from "@baseModule/helpers/hocs/withLanguage.tsx";
import type {WithAxiosLifecycleRef} from "@baseModule/helpers/hocs/withAxios.tsx";
import ViewRenderer, {type ViewRendererContext} from "./ViewRenderer.tsx";
import {createFormFieldRenderer} from "./form/viewFormField.tsx";
import {ViewFormShell} from "./form/viewFormShell.tsx";

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
    /**
     * Optional bag for compound widgets (e.g. `#ObjectIdChipsInput` label refs).
     * `renderChildrenFirst: true` moves {@link renderChildren} above the config-driven fields.
     */
    formExtras?: Record<string, unknown>;
    /**
     * Render prop for interactive children that need form access
     * (cascading selects, map pins, polygon selectors, etc.).
     * Rendered after config-driven fields and before static children.
     */
    renderChildren?: (form: UseFormReturn<T>) => ReactNode;
    /** Override the default useImperativeHandle success behavior (default: reset the form). */
    onSuccess?: () => void;
    extraTitles?: (string | undefined)[];
    /** Disables the submit control (e.g. client-side pricing gates) without affecting cancel. */
    submitDisabled?: boolean;
    /** When set, hides page shell (header / heavy padding) for embedding in dialogs/sheets. */
    hideChrome?: boolean;
    /** When set, omits cancel/submit. Studio gallery and other layout-only mounts. */
    hideActions?: boolean;
    /** When set, used instead of the default `zodResolver(formSchema)`. */
    resolver?: Resolver<T>;
};

/** Create form for a server-driven view config. */
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
    extraTitles,
    submitDisabled,
    hideChrome,
    hideActions,
    resolver,
}: FormViewRendererProps<T>) {
    const form = useForm<T>({
        resolver: resolver ?? (zodResolver(formSchema) as Resolver<T>),
        defaultValues: defaultValues as DefaultValues<T>,
    });

    useImperativeHandle(innerRef, () => ({
        success: () => {
            if (onSuccess) onSuccess();
            else form.reset();
        },
    }));

    const ctx: ViewRendererContext = {
        resolveLanguageKey,
        mode: "form",
        renderField: createFormFieldRenderer({
            control: form.control,
            resolveLanguageKey,
            extra: {loading, formExtras},
        }),
        formLoading: loading,
        formExtras,
    };

    const childrenFirst = !!formExtras?.renderChildrenFirst;
    return (
        <ViewFormShell
            form={form}
            resolveLanguageKey={resolveLanguageKey}
            onSubmit={onSubmit}
            onCancel={onCancel}
            busy={loading}
            submitting={loading}
            submitDisabled={submitDisabled}
            submitIcon={submitIcon}
            extraTitles={extraTitles}
            hideChrome={hideChrome}
            hideActions={hideActions}
        >
            {childrenFirst && renderChildren?.(form)}
            <ViewRenderer nodes={config.nodes} ctx={ctx} />
            {!childrenFirst && renderChildren?.(form)}
            {children}
        </ViewFormShell>
    );
}
