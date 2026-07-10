import { type ReactNode, useEffect, useImperativeHandle, useRef } from "react";
import { useForm, type Resolver, type FieldValues, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ViewConfig, ViewNode, FieldBinding } from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type { WithAxiosLifecycleRef } from "@coreModule/helpers/hocs/withAxios.tsx";
import type { RefObject } from "react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@coreModule/components/ui/form.tsx";
import { Button } from "@coreModule/components/ui/button.tsx";
import { LoaderCircle, Save } from "lucide-react";
import Header from "@coreModule/components/custom/header.tsx";
import ViewRenderer, { type ViewRendererContext } from "./ViewRenderer.tsx";
import { resolveWidget } from "./widgetRegistry.ts";
import { renderFormWidget, isCompoundFormWidget, renderCompoundWidget } from "./renderFormWidget.tsx";
import { buildTitleBreadcrumb } from "@coreModule/helpers/general";
import { useNavigate } from "react-router-dom";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";

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
    writeAccess?: Record<string, any>;
    /** Static extra content rendered after config-driven fields. */
    children?: ReactNode;
    /** Optional bag for compound widgets (e.g. `#FormObjectIdChips` label refs on edit). */
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
};

function resolveWriteAccess(writeAccess: Record<string, any>, key: string): boolean {
    const parts = key.split(".");
    let current: any = writeAccess;
    for (let i = 0; i < parts.length; i++) {
        if (!current || typeof current !== "object") return false;
        current = current[parts[i]];
        if (!current) return false;
        if (i < parts.length - 1) current = current.keys;
    }
    return !!current;
}

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
    extraTitles = [],
    writeAccess,
    children,
    formExtras,
    renderChildren,
    onSuccess,
    submitDisabled = false,
    loadingData,
    loadingDataError,
    onForceReload,
    loadingDataErrorTitle,
    loadingDataErrorDescription,
    loadingDataErrorTooltip
}: EditFormViewRendererProps<T>) {

    const navigate = useNavigate();
    const form = useForm<T>({resolver: zodResolver(formSchema) as Resolver<T>});
    const resetEntityKeyRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!initialValues) return;
        const entityKey = String((initialValues as {_id?: string})._id ?? "");
        if (!entityKey || resetEntityKeyRef.current === entityKey) return;
        resetEntityKeyRef.current = entityKey;
        form.reset(initialValues as any);
    }, [initialValues, form]);

    useImperativeHandle(innerRef, () => ({
        success: () => {
            if (onSuccess) onSuccess();
            else navigate(-1);
        },
    }));

    const renderField = (_node: ViewNode, binding: FieldBinding, index: number): ReactNode => {
        const WidgetComponent = resolveWidget(binding.widget);
        if (!WidgetComponent) return null;

        if (isCompoundFormWidget(binding.widget)) {
            if (binding.widget === "#FormFloorPolygon") {
                if (writeAccess && !writeAccess.polygonCoordinates) {
                    return null;
                }
            } else if (binding.widget === "#FormEdificePolygon") {
                if (writeAccess && !writeAccess.polygonCoordinates) {
                    return null;
                }
            } else if (binding.widget === "#FormUnitPolygon") {
                if (writeAccess && !writeAccess.polygonCoordinates) {
                    return null;
                }
            } else if (binding.widget === "#FormTabbedRepeater") {
                const writeAccessKey = (binding.widgetProps?.writeAccessKey as string | undefined) ?? binding.name;
                if (writeAccess && !writeAccess[writeAccessKey]) {
                    return null;
                }
            } else if (binding.widget === "#FormExpenditureItemsField") {
                if (writeAccess && !writeAccess.expenditureItems) {
                    return null;
                }
            } else if (binding.widget === "#FormEditMediaField") {
                if (writeAccess && !writeAccess.media) {
                    return null;
                }
            }
            return (
                <div key={index}>
                    {renderCompoundWidget(WidgetComponent, binding, resolveLanguageKey, {
                        loading: loading || loadingData,
                        editMode: true,
                        writeAccess,
                        formExtras,
                    })}
                </div>
            );
        }

        if (writeAccess && binding.name !== "_id" && !binding.skipWriteAccessGate) {
            const anyKeys =
                binding.renderWhenWriteAny && binding.renderWhenWriteAny.length > 0
                    ? binding.renderWhenWriteAny
                    : [binding.name];
            if (!anyKeys.some((k) => resolveWriteAccess(writeAccess, k))) {
                return null;
            }
        }

        const isDisabled = loading || loadingData || binding.disabled;

        return (
            <div key={index}>
                <FormField
                    control={form.control}
                    name={binding.name as any}
                    disabled={isDisabled}
                    render={({ field }) => (
                        <FormItem>
                            {binding.label && (
                                <FormLabel>{resolveLanguageKey(binding.label)}</FormLabel>
                            )}
                            <FormControl>
                                {renderFormWidget(WidgetComponent, binding, field, resolveLanguageKey, {
                                    loading: loading || loadingData,
                                    editMode: true,
                                    formExtras,
                                })}
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
        writeAccess,
        formLoading: loading,
        formLoadingData: loadingData,
        formExtras,
    };

    return (
        // Avoid nested `.flex-full` (each sets overflow-y: auto) — panel content is the sole scroll root.
        <div className="flex flex-col gap-4">
            <Header
                title={buildTitleBreadcrumb(resolveLanguageKey("formHeader.title"), extraTitles?.filter(Boolean))}
                description={resolveLanguageKey("formHeader.description")}
            />
            <div className="px-2 pb-[100px] space-y-4">
                {
                    loadingData ?
                    <Loader />
                    :
                    <>
                        {
                            loadingDataError ?
                            <>
                                <SimpleError
                                    title={resolveLanguageKey(loadingDataErrorTitle)}
                                    description={resolveLanguageKey(loadingDataErrorDescription)}
                                    tooltipDescription={resolveLanguageKey(loadingDataErrorTooltip || loadingDataErrorDescription)}
                                    onClick={() => {onForceReload?.()}}
                                />
                            </>
                            :
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit as any)} className="grid gap-4">
                                    <ViewRenderer nodes={config.nodes} ctx={ctx} />
                                    {renderChildren?.(form)}
                                    {children}
                                    <div className="flex grow items-center justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={onCancel} disabled={loading || loadingData}>
                                            {resolveLanguageKey("formButtons.cancel")}
                                        </Button>
                                        <Button type="submit" disabled={loading || loadingData || submitDisabled}>
                                            {loading ? <LoaderCircle className="animate-spin h-4 w-4" /> : (submitIcon ?? <Save />)}
                                            {resolveLanguageKey("formButtons.submit")}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        }
                    </>
                }
            </div>
        </div>
    );
}
