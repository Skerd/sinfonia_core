import type {ComponentType, ReactNode} from "react";
import type {FieldBinding} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {omitProps} from "../../engine/widgetProps.ts";
import {getCompoundFormWidgetRenderer} from "../../widgetRegistry.ts";
import type {CompoundFormWidgetArgs, CompoundFormWidgetRenderer, FormWidgetExtra} from "../types.ts";

const labelOf = (binding: FieldBinding, t: ResolveLanguageKey) => (binding.label ? String(t(binding.label)) : undefined);
const placeholderOf = (binding: FieldBinding, t: ResolveLanguageKey) =>
    binding.placeholder ? String(t(binding.placeholder)) : undefined;

/** Props every repeater / address widget shares. */
function formState({binding, resolveLanguageKey, extra}: CompoundFormWidgetArgs) {
    return {
        resolveLanguageKey,
        loading: extra?.loading ?? false,
        disabled: binding.disabled,
        editMode: extra?.editMode ?? false,
    };
}

/** Repeater rows: template, cascades and title composition. */
function rowProps(wp: Record<string, any>) {
    return {
        defaultItem: wp.defaultItem ?? {},
        rowTemplate: wp.rowTemplate ?? [],
        rowCascades: wp.rowCascades,
        rowTitleFields: wp.rowTitleFields,
        rowTitleSeparator: wp.rowTitleSeparator,
        rowTitleSeparators: wp.rowTitleSeparators,
        rowTitlePlaceholder: wp.rowTitlePlaceholder,
        addLabel: wp.addLabel,
        removeLabel: wp.removeLabel,
    };
}

/** Country / state / city selects plus the map. */
function addressProps(wp: Record<string, any>) {
    return {
        writeAccessKey: wp.writeAccessKey,
        countryApiUrl: wp.countryApiUrl,
        stateApiUrl: wp.stateApiUrl,
        cityApiUrl: wp.cityApiUrl,
        apiMethod: wp.apiMethod ?? "POST",
        mapDefaultLat: wp.mapDefaultLat,
        mapDefaultLng: wp.mapDefaultLng,
        selectPageSizeCreate: wp.selectPageSizeCreate,
        selectPageSizeEdit: wp.selectPageSizeEdit,
        labels: wp.labels,
    };
}

/**
 * Anything without its own mapping: the resolved label / placeholder and form state,
 * then every widget prop (which wins).
 */
export const defaultCompoundRenderer: CompoundFormWidgetRenderer = (args) => {
    const {Widget, binding, resolveLanguageKey, extra} = args;
    return (
        <Widget
            name={binding.name}
            label={labelOf(binding, resolveLanguageKey)}
            placeholder={placeholderOf(binding, resolveLanguageKey)}
            {...formState(args)}
            formExtras={extra?.formExtras}
            {...binding.widgetProps}
        />
    );
};

/** Core compound widgets. Modules add theirs through `WidgetContribution.compoundFormWidgetRenderers`. */
export const coreCompoundFormWidgetRenderers: Record<string, CompoundFormWidgetRenderer> = {
    /* The HOC-wrapped media field resolves its own copy; it only needs the resolved label. */
    "#MediaField": ({Widget, binding, resolveLanguageKey, extra}) => (
        <Widget
            {...binding.widgetProps}
            name={binding.name}
            label={labelOf(binding, resolveLanguageKey) ?? binding.name}
            loading={extra?.loading ?? false}
            editMode={extra?.editMode ?? false}
            required={binding.required}
            placeholder={placeholderOf(binding, resolveLanguageKey)}
        />
    ),

    /* These two take language keys and translate themselves. */
    "#StringArrayInput": ({Widget, binding, resolveLanguageKey, extra}) => {
        const wp = binding.widgetProps ?? {};
        return (
            <Widget
                name={binding.name}
                labelKey={binding.label ?? binding.name}
                placeholderKey={binding.placeholder ?? binding.name}
                removeTooltipKey={wp.removeTooltipKey ?? "remove"}
                /* No default: an unset key would render as `---add---`, so the label names the button instead. */
                addTooltipKey={typeof wp.addTooltipKey === "string" ? wp.addTooltipKey : undefined}
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
                maxItems={wp.maxItems}
                maxLength={typeof wp.maxLength === "number" ? wp.maxLength : undefined}
            />
        );
    },
    "#ListingFaqsField": ({Widget, binding, resolveLanguageKey, extra}) => {
        const wp = binding.widgetProps ?? {};
        return (
            <Widget
                name={binding.name}
                labelKey={binding.label ?? undefined}
                questionPlaceholderKey={wp.questionPlaceholderKey ?? "form.faqQuestionPlaceholder"}
                answerPlaceholderKey={wp.answerPlaceholderKey ?? "form.faqAnswerPlaceholder"}
                addRowLabelKey={wp.addRowLabelKey ?? "form.faqAddRow"}
                removeRowTooltipKey={wp.removeRowTooltipKey ?? "form.faqRemoveRow"}
                maxRows={wp.maxRows}
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
            />
        );
    },

    "#FormRepeater": (args) => {
        const {Widget, binding, extra} = args;
        const wp = binding.widgetProps ?? {};
        return (
            <Widget
                {...formState(args)}
                writeAccess={extra?.writeAccess}
                formExtras={extra?.formExtras}
                fieldPrefix={wp.fieldPrefix ?? binding.name}
                arrayField={wp.arrayField ?? binding.name}
                deleteField={wp.deleteField}
                title={wp.title}
                {...rowProps(wp)}
            />
        );
    },
    "#FormTabbedRepeater": (args) => {
        const {Widget, binding, extra} = args;
        const wp = binding.widgetProps ?? {};
        return (
            <Widget
                {...formState(args)}
                writeAccess={extra?.writeAccess}
                formExtras={extra?.formExtras}
                fieldPrefix={wp.fieldPrefix ?? binding.name}
                tabs={wp.tabs ?? []}
                {...rowProps(wp)}
            />
        );
    },

    "#FormAddressRow": (args) => {
        const {Widget, binding, extra} = args;
        const wp = binding.widgetProps ?? {};
        return (
            <Widget
                {...formState(args)}
                writeAccess={extra?.writeAccess}
                fieldPrefix={wp.fieldPrefix ?? binding.name}
                {...addressProps(wp)}
            />
        );
    },
    "#FormAddressWithMap": (args) => {
        const {Widget, binding, extra} = args;
        const wp = binding.widgetProps ?? {};
        return (
            <Widget
                {...formState(args)}
                writeAccess={extra?.writeAccess}
                fieldPrefix={wp.fieldPrefix ?? binding.name}
                arrayField={wp.arrayField}
                deleteField={wp.deleteField}
                addLabel={wp.addLabel}
                removeLabel={wp.removeLabel}
                {...addressProps(wp)}
            />
        );
    },
    "#FormMapPinPicker": ({Widget, binding, extra}) => {
        const wp = binding.widgetProps ?? {};
        return (
            <Widget
                fieldPrefix={wp.fieldPrefix ?? binding.name}
                latField={wp.latField}
                lngField={wp.lngField}
                defaultLat={wp.defaultLat}
                defaultLng={wp.defaultLng}
                loading={extra?.loading ?? false}
            />
        );
    },

    "#ObjectIdChipsInput": (args) => {
        const {Widget, binding, extra, resolveLanguageKey} = args;
        const wp = binding.widgetProps ?? {};
        return (
            <Widget
                {...formState(args)}
                name={binding.name}
                apiUrl={wp.apiUrl}
                method={wp.method ?? "POST"}
                placeholderKey={wp.placeholderKey}
                removeTooltipKey={wp.removeTooltipKey}
                selectPageSizeCreate={wp.selectPageSizeCreate}
                selectPageSizeEdit={wp.selectPageSizeEdit}
                labelRefFormExtraKey={wp.labelRefFormExtraKey}
                formExtras={extra?.formExtras}
                label={labelOf(binding, resolveLanguageKey)}
            />
        );
    },

    /* Inside a repeater `name` is already prefixed (`findings.0.media`); only prefix a relative one. */
    "#FormMultiLocalFileField": ({Widget, binding, resolveLanguageKey, extra}) => {
        const wp = binding.widgetProps ?? {};
        const prefix = wp.fieldPrefix;
        const name = prefix && !String(binding.name).startsWith(`${prefix}.`) ? `${prefix}.${binding.name}` : binding.name;
        return (
            <Widget
                {...omitProps(wp, "fieldPrefix")}
                name={name}
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
                disabled={binding.disabled}
                formExtras={extra?.formExtras}
            />
        );
    },

    "#FormEditMediaField": ({Widget, binding, resolveLanguageKey, extra}) => (
        <Widget
            resolveLanguageKey={resolveLanguageKey}
            loading={extra?.loading ?? false}
            disabled={binding.disabled}
            formExtras={extra?.formExtras}
            {...binding.widgetProps}
        />
    ),
};

/** Core compound tokens that take the default props. */
export const CORE_DEFAULT_COMPOUND_FORM_WIDGETS = ["#MainImageField", "#ImageGalleryField", "#VideoGalleryField"];

/**
 * Renders a compound form widget — one that manages its own FormField internally —
 * through its registered mapping, or {@link defaultCompoundRenderer}.
 */
export function renderCompoundWidget(
    Widget: ComponentType<any>,
    binding: FieldBinding,
    resolveLanguageKey: ResolveLanguageKey,
    extra?: FormWidgetExtra,
): ReactNode {
    const render = getCompoundFormWidgetRenderer(binding.widget) ?? defaultCompoundRenderer;
    return render({Widget, binding, resolveLanguageKey, extra});
}
