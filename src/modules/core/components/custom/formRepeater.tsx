import { type ReactNode, createElement, useEffect, useRef } from "react";
import { useFieldArray, useFormContext, type FieldValues } from "react-hook-form";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import { Button } from "@coreModule/components/ui/button.tsx";
import { CirclePlus, Trash2 } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@coreModule/components/ui/form.tsx";
import TitleWithCollapse from "@coreModule/components/custom/titleWithCollapse.tsx";
import type { ViewNode, FieldBinding } from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import { resolveWidget } from "../viewEngine/widgetRegistry.ts";
import {
    type FormWidgetExtra,
    isCompoundFormWidget,
    renderCompoundWidget,
    renderFormWidget,
} from "../viewEngine/renderFormWidget.tsx";

export type RowCascade = {
    /** Relative field name within the row that triggers a clear when its value changes. */
    watch: string;
    /** Relative field names to clear when the trigger changes. */
    clear: string[];
};

export type FormRepeaterProps = {
    resolveLanguageKey: ResolveLanguageKey;
    loading?: boolean;
    disabled?: boolean;
    editMode?: boolean;
    writeAccess?: Record<string, any>;
    formExtras?: Record<string, unknown>;
    fieldPrefix?: string;
    arrayField: string;
    deleteField?: string;
    defaultItem: Record<string, unknown>;
    rowTemplate: ViewNode[];
    /**
     * Declarative cascade rules evaluated per row.
     * When the watched field value changes, the listed fields are cleared.
     * Example: `[{ watch: "country", clear: ["state", "city"] }]`
     */
    rowCascades?: RowCascade[];
    /**
     * Language key for the section title. When provided, the repeater renders
     * inside a `TitleWithCollapse` with the add-row button in the `inBetween` slot.
     * Omit when the parent view already supplies a `#TitleWithCollapse` wrapper.
     */
    title?: string;
    /**
     * Relative dot-paths within each row used to build a summary label shown
     * in the row header next to the remove button.
     * Supports nested paths for populated refs (e.g. `"city.name"`).
     * Empty / null / object values are skipped; remaining strings are joined with `rowTitleSeparator`.
     */
    rowTitleFields?: string[];
    /** Separator between summary parts. Defaults to `", "`. */
    rowTitleSeparator?: string;
    /** Language key shown as `"<resolved> N"` when the row has no filled title fields yet. */
    rowTitlePlaceholder?: string;
    addLabel?: string;
    removeLabel?: string;
};

// ---------------------------------------------------------------------------
// Cascade side-effect component
// ---------------------------------------------------------------------------

/**
 * Renders nothing. Sets up a post-render effect that clears dependent fields
 * whenever a trigger field's value changes within a row.
 */
function RowCascadeEffects({
    cascades,
    arrayField,
    index,
    editMode,
}: {
    cascades: RowCascade[];
    arrayField: string;
    index: number;
    editMode: boolean;
}) {
    const form = useFormContext<FieldValues>();
    const prevRef = useRef<Record<string, unknown>>({});

    // Reset tracked values when mode or row identity changes so we don't
    // mistakenly clear fields on a fresh edit-mode load.
    useEffect(() => {
        prevRef.current = {};
    }, [editMode, arrayField, index]);

    const watchPaths = cascades.map((c) => `${arrayField}.${index}.${c.watch}`);
    const watched = form.watch(watchPaths as any[]);
    const values: unknown[] = Array.isArray(watched) ? watched : [watched];

    useEffect(() => {
        cascades.forEach((cascade, i) => {
            const currentVal = values[i];
            const prevVal = prevRef.current[cascade.watch];
            if (prevVal !== undefined && prevVal !== currentVal) {
                cascade.clear.forEach((clearField) => {
                    form.setValue(
                        `${arrayField}.${index}.${clearField}` as any,
                        undefined,
                        { shouldDirty: true },
                    );
                });
            }
            prevRef.current[cascade.watch] = currentVal;
        });
    });

    return null;
}

// ---------------------------------------------------------------------------
// Row summary title
// ---------------------------------------------------------------------------

/**
 * Watches a set of relative field paths within a row and renders a joined summary string.
 *
 * Resolution order for each field:
 * 1. `${field}__label` shadow (set by `renderRowNode` when an `#ApiSelect` fires)
 * 2. Object with `.name` (populated ref loaded from the server in edit mode)
 * 3. Plain non-ObjectId string (e.g. street, postalCode)
 */
function RowTitle({
    titleFields,
    arrayField,
    index,
    separator,
    fallback,
}: {
    titleFields: string[];
    arrayField: string;
    index: number;
    separator: string;
    fallback: string;
}) {
    const form = useFormContext<FieldValues>();
    const fieldPaths = titleFields.map((f) => `${arrayField}.${index}.${f}` as any);
    const labelPaths = titleFields.map((f) => `${arrayField}.${index}.${f}__label` as any);
    const fieldValues = form.watch(fieldPaths);
    const labelValues = form.watch(labelPaths);
    const vals = Array.isArray(fieldValues) ? fieldValues : [fieldValues];
    const labs = Array.isArray(labelValues) ? labelValues : [labelValues];

    const label = titleFields
        .map((_, i) => {
            const lab = labs[i] as string | undefined;
            if (lab && typeof lab === "string" && lab.trim()) return lab.trim();
            const val = vals[i];
            if (val == null || val === "") return null;
            if (typeof val === "object" && val !== null) {
                const name = (val as Record<string, unknown>).name;
                return typeof name === "string" && name.trim() ? name.trim() : null;
            }
            if (typeof val === "string") {
                if (/^[0-9a-f]{24}$/i.test(val)) return null;
                return val.trim() || null;
            }
            return null;
        })
        .filter(Boolean)
        .join(separator);

    return <>{label || fallback}</>;
}

// ---------------------------------------------------------------------------
// Row node renderer
// ---------------------------------------------------------------------------

/**
 * Renders one ViewNode within a repeater row.
 *
 * Field name rules:
 * - Basic fields: `field.name` is relative; prefixed to `${arrayField}.${index}.${name}`.
 * - Compound fields: `fieldPrefix` (`${arrayField}.${index}`) is injected via widgetProps.
 *
 * Per-field widgetProps handled here (stripped before passing to the widget):
 * - `postBodyFromRowFields: Record<string, string>` — maps postBody keys to relative
 *   sibling field names; their current values are merged into postBody at render time.
 * - `disabledWhenRowFieldEmpty: string` — disables this field when the named sibling is empty.
 */
function renderRowNode(
    node: ViewNode,
    arrayField: string,
    index: number,
    resolveLanguageKey: ResolveLanguageKey,
    extra: FormWidgetExtra,
    form: ReturnType<typeof useFormContext<FieldValues>>,
    nodeIndex: number,
): ReactNode {
    if (!node) return null;

    if (node.field) {
        const binding = node.field;
        const WidgetComponent = resolveWidget(binding.widget);
        if (!WidgetComponent) return null;

        if (isCompoundFormWidget(binding.widget)) {
            const prefixedBinding: FieldBinding = {
                ...binding,
                widgetProps: {
                    ...binding.widgetProps,
                    fieldPrefix: `${arrayField}.${index}`,
                },
            };
            return (
                <div key={`compound-${nodeIndex}`}>
                    {renderCompoundWidget(WidgetComponent, prefixedBinding, resolveLanguageKey, extra)}
                </div>
            );
        }

        const wp = binding.widgetProps ?? {};

        // Resolve postBodyFromRowFields: merge watched sibling values into postBody.
        const fromRowFields = wp.postBodyFromRowFields as Record<string, string> | undefined;
        let resolvedWidgetProps = wp;
        if (fromRowFields && Object.keys(fromRowFields).length > 0) {
            const base = (wp.postBody as Record<string, unknown> | undefined) ?? {};
            const merged: Record<string, unknown> = { ...base };
            for (const [postKey, relField] of Object.entries(fromRowFields)) {
                const val = form.watch(`${arrayField}.${index}.${relField}` as any);
                if (val != null && val !== "") merged[postKey] = val;
            }
            resolvedWidgetProps = { ...wp, postBody: merged };
        }

        // Resolve disabledWhenRowFieldEmpty: gate disabled on a sibling field.
        const disableWhen = wp.disabledWhenRowFieldEmpty as string | undefined;
        let fieldDisabled = (extra.loading ?? false) || !!binding.disabled;
        if (disableWhen) {
            const siblingVal = form.watch(`${arrayField}.${index}.${disableWhen}` as any);
            if (!siblingVal) fieldDisabled = true;
        }

        // Inject label-capture callback for ApiSelect so RowTitle can display human-readable values.
        if (binding.widget === "#ApiSelect") {
            const labelPath = `${arrayField}.${index}.${binding.name}__label` as any;
            resolvedWidgetProps = {
                ...resolvedWidgetProps,
                __onValueChangeFull: (_value: string | string[], label?: string | string[]) => {
                    const l = Array.isArray(label) ? (label[0] ?? "") : (label ?? "");
                    form.setValue(labelPath, l || undefined, { shouldDirty: false });
                },
            };
        }

        // Prefix cascadeClearFormFields / postBodyFromFormFields / enableWhenFormFieldsNonEmpty
        // so ApiSelectFormDependencyBridge receives absolute form paths (e.g. "addresses.0.country").
        const rowPath = `${arrayField}.${index}`;
        const cascadeClear = resolvedWidgetProps.cascadeClearFormFields as string[] | undefined;
        if (cascadeClear?.length) {
            resolvedWidgetProps = { ...resolvedWidgetProps, cascadeClearFormFields: cascadeClear.map(f => `${rowPath}.${f}`) };
        }
        const pbFromFF = resolvedWidgetProps.postBodyFromFormFields as {field: string; paramName: string}[] | undefined;
        if (pbFromFF?.length) {
            resolvedWidgetProps = { ...resolvedWidgetProps, postBodyFromFormFields: pbFromFF.map(d => ({...d, field: `${rowPath}.${d.field}`})) };
        }
        const enableWhen = resolvedWidgetProps.enableWhenFormFieldsNonEmpty as string[] | undefined;
        if (enableWhen?.length) {
            resolvedWidgetProps = { ...resolvedWidgetProps, enableWhenFormFieldsNonEmpty: enableWhen.map(f => `${rowPath}.${f}`) };
        }

        const prefixedName = `${arrayField}.${index}.${binding.name}`;
        const prefixedBinding: FieldBinding = {
            ...binding,
            name: prefixedName,
            widgetProps: resolvedWidgetProps,
        };

        return (
            <div key={`field-${nodeIndex}-${binding.name}`}>
                <FormField
                    control={form.control}
                    name={prefixedName as any}
                    disabled={fieldDisabled}
                    render={({ field }) => (
                        <FormItem>
                            {binding.label && (
                                <FormLabel>{resolveLanguageKey(binding.label)}</FormLabel>
                            )}
                            <FormControl>
                                {renderFormWidget(
                                    WidgetComponent,
                                    prefixedBinding,
                                    field,
                                    resolveLanguageKey,
                                    extra,
                                )}
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        );
    }

    const token = node.render;

    if (token.startsWith("#")) {
        const Component = resolveWidget(token);
        if (!Component) return null;

        if (isCompoundFormWidget(token)) {
            const syntheticBinding: FieldBinding = {
                name: `${arrayField}.${index}`,
                widget: token,
                widgetProps: { ...node.props, fieldPrefix: `${arrayField}.${index}` },
            };
            return (
                <div key={nodeIndex}>
                    {renderCompoundWidget(Component, syntheticBinding, resolveLanguageKey, extra)}
                </div>
            );
        }

        const children = node.children
            ? node.children.map((child, i) =>
                  renderRowNode(child, arrayField, index, resolveLanguageKey, extra, form, i),
              )
            : undefined;
        return createElement(Component, { key: nodeIndex, ...node.props }, children);
    }

    const children = node.children
        ? node.children.map((child, i) =>
              renderRowNode(child, arrayField, index, resolveLanguageKey, extra, form, i),
          )
        : undefined;
    return createElement(token, { key: nodeIndex, ...node.props }, children);
}

// ---------------------------------------------------------------------------
// FormRepeater
// ---------------------------------------------------------------------------

function FormRepeater({
    resolveLanguageKey,
    loading = false,
    disabled,
    editMode = false,
    writeAccess,
    formExtras,
    fieldPrefix: _fieldPrefix,
    arrayField = "items",
    deleteField,
    defaultItem = {},
    rowTemplate = [],
    rowCascades,
    title,
    rowTitleFields,
    rowTitleSeparator = ", ",
    rowTitlePlaceholder,
    addLabel = "add",
    removeLabel = "remove",
}: FormRepeaterProps) {
    const form = useFormContext<FieldValues>();
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: arrayField as any,
    });

    const isDisabled = !!loading || !!disabled;
    const extra: FormWidgetExtra = { loading, editMode, writeAccess, formExtras };

    const handleRemove = (index: number) => {
        if (editMode && deleteField) {
            const current = form.getValues(`${arrayField}.${index}` as any) as
                | { _id?: string }
                | undefined;
            if (current?._id) {
                const existing =
                    (form.getValues(deleteField as any) as string[] | undefined) ?? [];
                form.setValue(deleteField as any, [...existing, current._id], {
                    shouldDirty: true,
                    shouldValidate: true,
                });
            }
        }
        remove(index);
    };

    const addButton = (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDisabled}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                append(defaultItem);
            }}
        >
            <CirclePlus className="h-4 w-4" />
            <span>{resolveLanguageKey(addLabel)}</span>
        </Button>
    );

    const rowList = (
        <div className="grid grid-cols-1 gap-4">
            {fields.map((field, index) => (
                <div
                    key={field.id}
                    className="rounded-lg border border-border/60 p-3"
                >
                    {rowCascades && rowCascades.length > 0 && (
                        <RowCascadeEffects
                            cascades={rowCascades}
                            arrayField={arrayField}
                            index={index}
                            editMode={editMode}
                        />
                    )}
                    <TitleWithCollapse
                        title={
                            rowTitleFields && rowTitleFields.length > 0 ? (
                                <RowTitle
                                    titleFields={rowTitleFields}
                                    arrayField={arrayField}
                                    index={index}
                                    separator={rowTitleSeparator}
                                    fallback={
                                        rowTitlePlaceholder
                                            ? `${resolveLanguageKey(rowTitlePlaceholder)} ${index + 1}`
                                            : String(index + 1)
                                    }
                                />
                            ) : (
                                rowTitlePlaceholder
                                    ? `${resolveLanguageKey(rowTitlePlaceholder)} ${index + 1}`
                                    : String(index + 1)
                            )
                        }
                        inBetween={
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isDisabled}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemove(index);
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>{resolveLanguageKey(removeLabel)}</span>
                            </Button>
                        }
                    >
                        <div className="space-y-4">
                            {rowTemplate.map((node, nodeIndex) =>
                                renderRowNode(
                                    node,
                                    arrayField,
                                    index,
                                    resolveLanguageKey,
                                    extra,
                                    form,
                                    nodeIndex,
                                ),
                            )}
                        </div>
                    </TitleWithCollapse>
                </div>
            ))}
        </div>
    );

    if (title) {
        return (
            <TitleWithCollapse
                title={resolveLanguageKey(title)}
                inBetween={addButton}
            >
                {rowList}
            </TitleWithCollapse>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-end">{addButton}</div>
            {rowList}
        </div>
    );
}

/** Use {@link ResolveLanguageKey} from the parent form page — do not wrap with `withLanguage` here or nested keys like `form.countryLabel` resolve against the wrong dictionary. */
export default FormRepeater;
