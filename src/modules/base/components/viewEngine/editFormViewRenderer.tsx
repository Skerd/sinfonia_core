import {type ReactNode, type RefObject, useEffect, useImperativeHandle, useRef} from "react";
import {useForm, type FieldValues, type Resolver, type UseFormReturn} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useNavigate} from "react-router-dom";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ResolveLanguageKey} from "@baseModule/helpers/hocs/withLanguage.tsx";
import type {WithAxiosLifecycleRef} from "@baseModule/helpers/hocs/withAxios.tsx";
import Loader from "@baseModule/components/custom/loader/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import ViewRenderer, {type ViewRendererContext} from "./ViewRenderer.tsx";
import {hasAccessPath} from "./engine/access.ts";
import {createFormFieldRenderer} from "./form/viewFormField.tsx";
import {ViewFormShell} from "./form/viewFormShell.tsx";
import {rendersOnEditForm} from "./form/writeGate.ts";

export type EditFormViewRendererProps<T extends FieldValues = FieldValues> = {
    config: ViewConfig;
    resolveLanguageKey: ResolveLanguageKey;
    formSchema: Parameters<typeof zodResolver>[0];
    initialValues: T | null | Partial<T>;
    loading: boolean;
    loadingData?: boolean;
    loadingDataError?: boolean;
    onForceReload?: () => void;
    loadingDataErrorTitle: string;
    loadingDataErrorDescription: string;
    loadingDataErrorTooltip?: string;
    innerRef: RefObject<WithAxiosLifecycleRef<any> | null>;
    onSubmit: (data: T) => void;
    onCancel: () => void;
    submitIcon?: ReactNode;
    /** Breadcrumb segments after `formHeader.title` (same as {@link FormViewRenderer}). */
    extraTitles?: (string | undefined)[];
    /**
     * What the account may write. Fields it cannot write are left out (see `form/writeGate.ts`);
     * without a map nothing is gated.
     */
    writeAccess?: Record<string, any>;
    /** Static extra content rendered after config-driven fields. */
    children?: ReactNode;
    /**
     * Optional bag for compound widgets (e.g. `#FormObjectIdChips` label refs on edit).
     * `renderChildrenFirst: true` moves {@link renderChildren} above the config-driven fields.
     */
    formExtras?: Record<string, unknown>;
    /**
     * Render prop for interactive children that need form access
     * (cascading selects, map pins, polygon selectors, etc.).
     * Rendered after config-driven fields and before static children.
     */
    renderChildren?: (form: UseFormReturn<T>) => ReactNode;
    /** Override the default useImperativeHandle success behavior (default: navigate(-1)). */
    onSuccess?: () => void;
    /** Extra disable reason for the primary submit control (e.g. client-side business rules). */
    submitDisabled?: boolean;
    /** When set, hides page shell (header / heavy padding) for embedding in dialogs/sheets. */
    hideChrome?: boolean;
    /** When set, omits cancel/submit. */
    hideActions?: boolean;
    /** When set, used instead of the default `zodResolver(formSchema)`. */
    resolver?: Resolver<T>;
};

/** Edit form for a server-driven view config: loads the entity once, then gates fields on write access. */
export default function EditFormViewRenderer<T extends FieldValues = FieldValues>({
    config,
    resolveLanguageKey,
    formSchema,
    initialValues,
    loading,
    innerRef,
    onSubmit,
    onCancel,
    submitIcon,
    extraTitles,
    writeAccess,
    children,
    formExtras,
    renderChildren,
    onSuccess,
    submitDisabled,
    loadingData = false,
    loadingDataError,
    onForceReload,
    loadingDataErrorTitle,
    loadingDataErrorDescription,
    loadingDataErrorTooltip,
    hideChrome,
    hideActions,
    resolver,
}: EditFormViewRendererProps<T>) {
    const navigate = useNavigate();
    const form = useForm<T>({
        resolver: resolver ?? (zodResolver(formSchema) as Resolver<T>),
    });

    // Reset once per entity: later `initialValues` for the same `_id` must not wipe edits.
    const resetEntityKeyRef = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (!initialValues) return;
        const entityKey = String((initialValues as {_id?: string})._id ?? "");
        if (!entityKey || resetEntityKeyRef.current === entityKey) return;
        resetEntityKeyRef.current = entityKey;
        form.reset(initialValues as T);
    }, [initialValues, form]);

    useImperativeHandle(innerRef, () => ({
        success: () => {
            if (onSuccess) onSuccess();
            else navigate(-1);
        },
    }));

    const busy = loading || loadingData;
    const ctx: ViewRendererContext = {
        resolveLanguageKey,
        mode: "form",
        renderField: createFormFieldRenderer({
            control: form.control,
            resolveLanguageKey,
            extra: {loading: busy, editMode: true, writeAccess, formExtras},
            canRender: writeAccess
                ? (binding) => rendersOnEditForm(binding, (key) => hasAccessPath(writeAccess, key))
                : undefined,
        }),
        writeAccess,
        formLoading: loading,
        formLoadingData: loadingData,
        formExtras,
    };

    const replaceForm = loadingData ? (
        <Loader />
    ) : loadingDataError ? (
        <SimpleError
            title={resolveLanguageKey(loadingDataErrorTitle)}
            description={resolveLanguageKey(loadingDataErrorDescription)}
            tooltipDescription={resolveLanguageKey(loadingDataErrorTooltip || loadingDataErrorDescription)}
            onClick={() => onForceReload?.()}
        />
    ) : undefined;

    const childrenFirst = !!formExtras?.renderChildrenFirst;
    return (
        <ViewFormShell
            form={form}
            resolveLanguageKey={resolveLanguageKey}
            onSubmit={onSubmit}
            onCancel={onCancel}
            busy={busy}
            submitting={loading}
            submitDisabled={submitDisabled}
            submitIcon={submitIcon}
            extraTitles={extraTitles}
            hideChrome={hideChrome}
            hideActions={hideActions}
            replaceForm={replaceForm}
        >
            {childrenFirst && renderChildren?.(form)}
            <ViewRenderer nodes={config.nodes} ctx={ctx} />
            {!childrenFirst && renderChildren?.(form)}
            {children}
        </ViewFormShell>
    );
}
