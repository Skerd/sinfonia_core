import {forwardRef, type ChangeEvent, type ComponentType, type HTMLAttributes, type ReactNode} from "react";
import {useWatch} from "react-hook-form";
import type {FieldBinding} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ResolveLanguageKey} from "@baseModule/helpers/hocs/withLanguage.tsx";
import FormMaxLengthControl from "@coreModule/components/custom/formMaxLengthControl.tsx";
import {omitProps, wpText} from "../../engine/widgetProps.ts";
import type {FormWidgetExtra} from "../types.ts";
import {clearedValue, orCleared} from "./emptyValue.ts";

/** The react-hook-form `field` render prop. */
type RhfField = {
    value: any;
    onChange: (value: unknown) => void;
    disabled?: boolean;
    [key: string]: any;
};

type ScalarArgs = {
    Widget: ComponentType<any>;
    binding: FieldBinding;
    field: RhfField;
    resolveLanguageKey: ResolveLanguageKey;
    extra?: FormWidgetExtra;
    wp: Record<string, any>;
    placeholder: string | undefined;
};

type ScalarAdapter = (args: ScalarArgs) => ReactNode;

type OnValueChangeFull = (value: string | string[], label?: string | string[]) => void;

/** Id of a populated ref, or the value itself. */
const refId = (v: unknown) => (v != null && typeof v === "object" ? ((v as {_id?: string})._id ?? v) : v);

/**
 * `#ApiSelect`. `postBodyFormExtrasMerge` maps post-body keys to form-extras keys (or literal
 * values); `defaultOptionsFormExtraKey` reads preloaded options from form extras. Repeater-only
 * props are stripped; `__onValueChangeFull` (injected by the repeater) also receives the label.
 */
const apiSelect: ScalarAdapter = ({Widget, binding, field, resolveLanguageKey: t, extra, wp, placeholder}) => {
    const formExtras = extra?.formExtras;
    const {
        postBodyFormExtrasMerge: mergeMap,
        normalizeEmptyToUndefined,
        inlineCreateEntityLabel: inlineCreateKey,
        defaultOptionsFormExtraKey,
        postBodyFromRowFields: _rowFields,
        disabledWhenRowFieldEmpty: _rowDisable,
        __onValueChangeFull: onValueChangeFull,
        ...rest
    } = wp;

    const postBody: Record<string, unknown> = {...(wp.postBody ?? {})};
    for (const [key, source] of Object.entries((mergeMap ?? {}) as Record<string, unknown>)) {
        const v = typeof source === "string" ? formExtras?.[source] : source;
        if (v != null && v !== "") postBody[key] = v;
    }

    const extrasOptions = typeof defaultOptionsFormExtraKey === "string" ? formExtras?.[defaultOptionsFormExtraKey] : undefined;
    const labelKey = typeof inlineCreateKey === "string" && inlineCreateKey !== "" ? inlineCreateKey : binding.label;

    const onValueChange = (value: string | string[], label?: string | string[]) => {
        const isEmpty = !Array.isArray(value) && (value === "" || value == null);
        field.onChange(isEmpty && extra?.editMode ? null : isEmpty && normalizeEmptyToUndefined ? undefined : value);
        (onValueChangeFull as OnValueChangeFull | undefined)?.(value, label);
    };

    const value = normalizeEmptyToUndefined
        ? field.value == null || field.value === "" ? "" : String(refId(field.value))
        : refId(field.value);

    return (
        <Widget
            apiUrl={wp.apiUrl}
            value={value}
            onValueChange={onValueChange}
            placeholder={placeholder}
            inlineCreateEntityLabel={labelKey ? String(t(labelKey)) : undefined}
            resolveLanguageKey={t}
            disabled={field.disabled || !!rest.disabled}
            {...rest}
            defaultOptions={Array.isArray(extrasOptions) ? extrasOptions : rest.defaultOptions}
            postBody={postBody}
            formFieldName={binding.name}
            formExtras={formExtras}
        />
    );
};

/** `#SimpleSelect` / `#Select`. Option labels containing a dot are language keys. */
const simpleSelect: ScalarAdapter = ({Widget, field, resolveLanguageKey: t, extra, wp, placeholder}) => {
    const options = ((wp.options ?? []) as {value: unknown; label: unknown}[]).map((o) => {
        const raw = typeof o.label === "string" ? o.label : String(o.label ?? o.value ?? "");
        return {...o, value: String(o.value), label: raw.includes(".") ? String(t(raw)) : raw};
    });
    const labelFor = (v: string) => options.find((o) => o.value === v)?.label;
    const onValueChangeFull = wp.__onValueChangeFull as OnValueChangeFull | undefined;

    return (
        <Widget
            options={options}
            value={field.value == null || field.value === "" ? undefined : String(field.value)}
            onValueChange={(v: string | string[]) => {
                field.onChange(Array.isArray(v) ? v : orCleared(v, extra));
                if (!onValueChangeFull) return;
                if (Array.isArray(v)) onValueChangeFull(v, v.map((item) => labelFor(item) ?? item));
                else onValueChangeFull(v, labelFor(v));
            }}
            placeholder={placeholder}
            multiple={wp.multiple}
            disabled={field.disabled || wp.disabled}
            className={wp.className}
            forTable={wp.forTable}
            searchPlaceholder={wp.searchPlaceholder}
        />
    );
};

/** `YYYY-MM-DD` from an ISO string, or `""`. */
function isoDay(value: unknown): string {
    if (typeof value !== "string") return "";
    const day = value.trim().split("T")[0];
    return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
}

/** A static bound, else the watched sibling field's day, else none. */
function dateBound(staticValue: unknown, fieldPath: string | undefined, watched: unknown): string | undefined {
    if (typeof staticValue === "string" && staticValue) return isoDay(staticValue) || undefined;
    return fieldPath ? isoDay(watched) || undefined : undefined;
}

/** `#DateInput` with optional `minDateField` / `maxDateField` watching sibling form paths. */
const FormBoundDateInput = forwardRef<HTMLInputElement, Omit<ScalarArgs, "binding" | "resolveLanguageKey">>(
    function FormBoundDateInput({Widget, field, wp, placeholder, extra, ...slotProps}, ref) {
        const rest = omitProps(wp, "minDateField", "maxDateField", "minDateExclusive", "maxDateExclusive", "minDate", "maxDate");
        const minPath = wpText(wp, "minDateField");
        const maxPath = wpText(wp, "maxDateField");
        // Hooks cannot be conditional; unused watches fall back to harmless default paths.
        const watchedMin = useWatch({name: minPath ?? "startDate"});
        const watchedMax = useWatch({name: maxPath ?? "endDate"});
        return (
            <Widget
                {...rest}
                {...slotProps}
                ref={ref}
                value={field.value}
                onChange={(v: string | undefined | null) => field.onChange(orCleared(v, extra))}
                placeholder={placeholder}
                disabled={field.disabled || rest.disabled}
                minDate={dateBound(wp.minDate, minPath, watchedMin)}
                maxDate={dateBound(wp.maxDate, maxPath, watchedMax)}
                minDateExclusive={wp.minDateExclusive === true}
                maxDateExclusive={wp.maxDateExclusive === true}
            />
        );
    },
);

const dateInput: ScalarAdapter = ({Widget, field, wp, placeholder, extra}) => (
    <FormBoundDateInput Widget={Widget} field={field} wp={wp} placeholder={placeholder} extra={extra} />
);

const iconPicker: ScalarAdapter = ({Widget, field, wp, placeholder, extra}) => (
    <Widget
        value={field.value}
        onValueChange={(v: string | undefined) => field.onChange(orCleared(v, extra))}
        disabled={field.disabled || wp.disabled}
        placeholder={placeholder}
        {...wp}
    />
);

const phoneInput: ScalarAdapter = ({Widget, field, wp, placeholder, extra}) => (
    <Widget
        value={field.value}
        onChange={(v: string | undefined) => field.onChange(orCleared(v, extra))}
        placeholder={placeholder}
        disabled={field.disabled || wp.disabled}
        defaultCountry={wp.defaultCountry ?? "AL"}
        {...wp}
    />
);

const checkable: ScalarAdapter = ({Widget, field, wp}) => (
    <Widget checked={field.value} onCheckedChange={field.onChange} {...wp} />
);

/** `widgetProps.type: "number" | "decimal"` on any input. */
const numberInput: ScalarAdapter = ({Widget, field, wp, placeholder, extra}) => {
    const decimal = wp.type === "decimal";
    return (
        <Widget
            placeholder={placeholder}
            {...field}
            {...omitProps(wp, "type", "step")}
            type="number"
            inputMode={decimal ? "decimal" : "numeric"}
            step={decimal ? "any" : wp.step}
            value={field.value ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                field.onChange(e.target.value === "" ? clearedValue(extra) : parseFloat(e.target.value))
            }
        />
    );
};

/** Native input attributes inferred from the field type or name when the config omits them. */
function inputDefaults(type: string | undefined, name: string): {
    type?: string;
    inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
    autoComplete?: string;
} {
    const n = name.toLowerCase();
    const t = (type ?? "").toLowerCase();
    if (t === "email" || n.includes("email")) return {type: "email", inputMode: "email", autoComplete: "email"};
    if (t === "tel" || n.includes("phone") || n.includes("mobile") || n.includes("tel")) {
        return {type: "tel", inputMode: "tel", autoComplete: "tel"};
    }
    if (t === "url" || n.includes("website") || n.includes("url") || n.endsWith("uri")) {
        return {type: "url", inputMode: "url", autoComplete: "url"};
    }
    if (t === "password" || n.includes("password")) return {type: "password", autoComplete: "current-password"};
    if (t === "number" || t === "decimal") return {type: "number", inputMode: t === "decimal" ? "decimal" : "numeric"};
    if (n.includes("search")) return {type: "search", inputMode: "search", autoComplete: "off"};
    return {type: type ?? "text"};
}

/** `#Input` / `#Textarea`, with a character counter when `maxLength` is set. */
const textInput: ScalarAdapter = ({Widget, binding, field, wp, placeholder, extra}) => {
    const {type, autoComplete, inputMode, maxLength, ...rest} = wp;
    const defaults = inputDefaults(typeof type === "string" ? type : undefined, binding.name);
    const value = field.value ?? "";
    const cap = typeof maxLength === "number" ? maxLength : undefined;
    const control = (
        <Widget
            placeholder={placeholder}
            {...field}
            {...rest}
            maxLength={cap}
            {...(binding.widget === "#Input"
                ? {
                      type: defaults.type ?? "text",
                      inputMode: inputMode ?? defaults.inputMode,
                      autoComplete: autoComplete ?? defaults.autoComplete,
                  }
                : {})}
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                field.onChange(e.target.value === "" ? clearedValue(extra) : e.target.value)
            }
        />
    );
    return cap !== undefined && cap > 0 ? (
        <FormMaxLengthControl maxLength={cap} value={String(value)}>
            {control}
        </FormMaxLengthControl>
    ) : (
        control
    );
};

const fallback: ScalarAdapter = ({Widget, field, wp, placeholder}) => (
    <Widget placeholder={placeholder} type={wp.type ?? "text"} {...field} {...wp} />
);

const SCALAR_ADAPTERS: Record<string, ScalarAdapter> = {
    "#ApiSelect": apiSelect,
    "#SimpleSelect": simpleSelect,
    "#Select": simpleSelect,
    "#DateInput": dateInput,
    "#IconPicker": iconPicker,
    "#PhoneInput": phoneInput,
    "#Checkbox": checkable,
    "#Switch": checkable,
    "#Input": textInput,
    "#Textarea": textInput,
};

function scalarAdapter(binding: FieldBinding, wp: Record<string, any>): ScalarAdapter {
    const own = Object.hasOwn(SCALAR_ADAPTERS, binding.widget) ? SCALAR_ADAPTERS[binding.widget] : undefined;
    // A numeric `type` beats the plain text inputs (and the fallback), not the dedicated widgets.
    if (wp.type === "number" || wp.type === "decimal") {
        if (!own || own === textInput) return numberInput;
    }
    return own ?? fallback;
}

/**
 * Renders the control for a field binding inside a `FormField`. Shared by the create / edit
 * forms and the repeaters, so the widget → props mapping lives in one place.
 */
export function renderFormWidget(
    Widget: ComponentType<any>,
    binding: FieldBinding,
    field: RhfField,
    resolveLanguageKey: ResolveLanguageKey,
    extra?: FormWidgetExtra,
): ReactNode {
    const wp = binding.widgetProps ?? {};
    const placeholder = binding.placeholder ? String(resolveLanguageKey(binding.placeholder)) : undefined;
    return scalarAdapter(binding, wp)({Widget, binding, field, resolveLanguageKey, extra, wp, placeholder});
}
