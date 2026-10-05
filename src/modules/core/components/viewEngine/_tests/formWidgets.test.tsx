import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ReactNode} from "react";
import {render} from "@testing-library/react";
import {FormProvider, useForm} from "react-hook-form";
import type {FieldBinding} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";

vi.mock("@coreModule/helpers/moduleContributions/loadWidgetContributions.ts", async () => {
    const pm = await import("@propertyManagementModule/clients/panel/formWidgetRenderers.tsx");
    return {
        getSortedWidgetContributions: () => [
            {id: "test", compoundFormWidgets: ["#ModuleCompound"]},
            {id: "propertyManagement", compoundFormWidgetRenderers: pm.propertyManagementFormWidgetRenderers},
        ],
    };
});
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    default: (await import("./harness.tsx")).fakeWithLanguage,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({default: () => (c: unknown) => c}));
vi.mock("react-redux", () => ({
    useSelector: (selector: (state: {authentication: {user?: {timezone?: string}}}) => unknown) =>
        selector({authentication: {user: {timezone: "Europe/Berlin"}}}),
}));

const {renderFormWidget, renderCompoundWidget, isCompoundFormWidget} = await import("../renderFormWidget.tsx");
const {lastProps, makeProbe, resetCalls, t} = await import("./harness.tsx");

const W = makeProbe("W");

function FormHost({values = {}, children}: {values?: Record<string, unknown>; children: ReactNode}) {
    const form = useForm({defaultValues: values});
    return <FormProvider {...form}>{children}</FormProvider>;
}

function makeField(value: unknown = undefined) {
    return {name: "f", value, onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn(), disabled: false};
}

const bind = (widget: string, widgetProps: Record<string, any> = {}, extra: Partial<FieldBinding> = {}): FieldBinding =>
    ({name: "f", widget, widgetProps, ...extra}) as FieldBinding;

function mountScalar(binding: FieldBinding, field = makeField(), extra: Record<string, any> = {}, values = {}) {
    render(<FormHost values={values}>{renderFormWidget(W, binding, field, t, extra)}</FormHost>);
    return {field, props: lastProps("W")};
}

function mountCompound(binding: FieldBinding, extra: Record<string, any> = {}) {
    render(<FormHost>{renderCompoundWidget(W, binding, t, extra)}</FormHost>);
    return lastProps("W");
}

beforeEach(() => {
    resetCalls();
});

describe("isCompoundFormWidget", () => {
    it("knows core compound tokens and module-contributed ones", () => {
        expect(isCompoundFormWidget("#FormRepeater")).toBe(true);
        expect(isCompoundFormWidget("#FormFloorPolygon")).toBe(true);
        expect(isCompoundFormWidget("#ModuleCompound")).toBe(true);
        expect(isCompoundFormWidget("#Input")).toBe(false);
    });
});

describe("renderFormWidget: #ApiSelect", () => {
    it("merges post body from form extras, strips row-only props and resolves labels", () => {
        const {props} = mountScalar(
            bind("#ApiSelect", {
                apiUrl: "/api/x/select",
                postBody: {a: 1},
                postBodyFormExtrasMerge: {project: "projectId", fixed: 7, empty: "missing"},
                postBodyFromRowFields: ["x"],
                disabledWhenRowFieldEmpty: "y",
                inlineCreateEntityLabel: "entity.label",
                multiple: true,
            }, {placeholder: "ph", label: "lbl"}),
            makeField({_id: "o1"}),
            {formExtras: {projectId: "p1"}},
        );
        expect(props).toMatchObject({
            apiUrl: "/api/x/select",
            value: "o1",
            placeholder: "t:ph",
            inlineCreateEntityLabel: "t:entity.label",
            postBody: {a: 1, project: "p1", fixed: 7},
            formFieldName: "f",
            formExtras: {projectId: "p1"},
            multiple: true,
            resolveLanguageKey: t,
            disabled: false,
        });
        for (const k of ["postBodyFormExtrasMerge", "postBodyFromRowFields", "disabledWhenRowFieldEmpty", "__onValueChangeFull", "normalizeEmptyToUndefined"]) {
            expect(k in props).toBe(false);
        }
    });

    it("falls back to the field label for inline create, and to extras for default options", () => {
        const {props} = mountScalar(
            bind("#ApiSelect", {defaultOptionsFormExtraKey: "opts", defaultOptions: [{value: "static"}]}, {label: "lbl"}),
            makeField("v"),
            {formExtras: {opts: [{value: "dyn"}]}},
        );
        expect(props).toMatchObject({inlineCreateEntityLabel: "t:lbl", defaultOptions: [{value: "dyn"}], value: "v"});
    });

    it("normalizes cleared values: null in edit, undefined when asked, else as-is; forwards the label", () => {
        const full = vi.fn();
        const edit = mountScalar(bind("#ApiSelect", {__onValueChangeFull: full}), makeField("a"), {editMode: true});
        edit.props.onValueChange("", "");
        expect(edit.field.onChange).toHaveBeenCalledWith(null);
        expect(full).toHaveBeenCalledWith("", "");

        const create = mountScalar(bind("#ApiSelect", {normalizeEmptyToUndefined: true}), makeField(null));
        expect(create.props.value).toBe("");
        create.props.onValueChange("");
        expect(create.field.onChange).toHaveBeenCalledWith(undefined);

        const plain = mountScalar(bind("#ApiSelect"), makeField());
        plain.props.onValueChange("");
        expect(plain.field.onChange).toHaveBeenCalledWith("");
        plain.props.onValueChange(["a"], ["A"]);
        expect(plain.field.onChange).toHaveBeenCalledWith(["a"]);
    });
});

describe("renderFormWidget: selects", () => {
    it("translates dotted option labels and stringifies values", () => {
        const {props} = mountScalar(
            bind("#SimpleSelect", {options: [{value: 1, label: "opt.one"}, {value: "b", label: "Plain"}], multiple: false, className: "c"}),
            makeField(1),
        );
        expect(props.options).toEqual([{value: "1", label: "t:opt.one"}, {value: "b", label: "Plain"}]);
        expect(props).toMatchObject({value: "1", className: "c", multiple: false});
    });

    it("passes a multiple value through as a string array so each option can toggle", () => {
        const {props, field} = mountScalar(
            bind("#Select", {
                multiple: true,
                options: [
                    {value: "desktop", label: "form.visibilityDevice.desktop"},
                    {value: "mobile", label: "form.visibilityDevice.mobile"},
                    {value: "tablet", label: "form.visibilityDevice.tablet"},
                ],
            }),
            makeField(["desktop", "mobile"]),
        );
        expect(props.value).toEqual(["desktop", "mobile"]);
        expect(props.multiple).toBe(true);
        props.onValueChange(["desktop", "mobile", "tablet"]);
        expect(field.onChange).toHaveBeenCalledWith(["desktop", "mobile", "tablet"]);
    });

    it("#Select is an alias; clearing is null in edit mode; labels reach __onValueChangeFull", () => {
        const full = vi.fn();
        const {props, field} = mountScalar(
            bind("#Select", {options: [{value: "a", label: "A"}, {value: "b", label: "B"}], __onValueChangeFull: full}),
            makeField(""),
            {editMode: true},
        );
        expect(props.value).toBeUndefined();
        props.onValueChange("");
        expect(field.onChange).toHaveBeenCalledWith(null);
        props.onValueChange("b");
        expect(full).toHaveBeenLastCalledWith("b", "B");
        props.onValueChange(["a", "z"]);
        expect(full).toHaveBeenLastCalledWith(["a", "z"], ["A", "z"]);
    });
});

describe("renderFormWidget: #DateInput", () => {
    it("binds min/max from sibling fields and strips its own props", () => {
        const {props, field} = mountScalar(
            bind("#DateInput", {minDateField: "from", maxDate: "2030-01-31T00:00:00Z", maxDateExclusive: true, size: "sm"}),
            makeField("2026-01-01"),
            {},
            {from: "2025-05-05T10:00:00Z"},
        );
        expect(props).toMatchObject({minDate: "2025-05-05", maxDate: "2030-01-31", minDateExclusive: false, maxDateExclusive: true, size: "sm", value: "2026-01-01"});
        expect("minDateField" in props).toBe(false);
        props.onChange("");
        expect(field.onChange).toHaveBeenCalledWith(undefined);
    });

    it("has no bounds by default and clears to null in edit mode", () => {
        const {props, field} = mountScalar(bind("#DateInput"), makeField(), {editMode: true}, {startDate: "2020-01-01"});
        expect(props.minDate).toBeUndefined();
        expect(props.maxDate).toBeUndefined();
        props.onChange(null);
        expect(field.onChange).toHaveBeenCalledWith(null);
    });
});

describe("renderFormWidget: other scalar widgets", () => {
    it("#IconPickerInput and #PhoneInput normalize empties; phone defaults to AL", () => {
        const icon = mountScalar(bind("#IconPickerInput"), makeField("mdi-a"), {editMode: true});
        icon.props.onValueChange("");
        expect(icon.field.onChange).toHaveBeenCalledWith(null);

        const phone = mountScalar(bind("#PhoneInput"), makeField());
        expect(phone.props.defaultCountry).toBe("AL");
        phone.props.onChange("");
        expect(phone.field.onChange).toHaveBeenCalledWith(undefined);
        expect(mountScalar(bind("#PhoneInput", {defaultCountry: "IT"})).props.defaultCountry).toBe("IT");
    });

    it("#Checkbox / #Switch bind checked", () => {
        const field = makeField(true);
        const {props} = mountScalar(bind("#Switch", {size: "sm"}), field);
        expect(props).toMatchObject({checked: true, onCheckedChange: field.onChange, size: "sm"});
    });

    it("number / decimal inputs parse floats and clear to the empty value", () => {
        const num = mountScalar(bind("#Input", {type: "number", step: 5}), makeField(null));
        expect(num.props).toMatchObject({type: "number", inputMode: "numeric", step: 5, value: ""});
        num.props.onChange({target: {value: "4.5"}});
        expect(num.field.onChange).toHaveBeenCalledWith(4.5);

        const dec = mountScalar(bind("#Input", {type: "decimal", step: 5}), makeField(2), {editMode: true});
        expect(dec.props).toMatchObject({type: "number", inputMode: "decimal", step: "any", value: 2});
        dec.props.onChange({target: {value: ""}});
        expect(dec.field.onChange).toHaveBeenCalledWith(null);
    });

    it("#Input infers native attributes from the field name", () => {
        const email = mountScalar(bind("#Input", {}, {name: "contactEmail"}));
        expect(email.props).toMatchObject({type: "email", inputMode: "email", autoComplete: "email", value: ""});
        const phone = mountScalar(bind("#Input", {autoComplete: "off"}, {name: "mobile"}));
        expect(phone.props).toMatchObject({type: "tel", autoComplete: "off"});
        const text = mountScalar(bind("#Input", {}, {name: "title"}));
        expect(text.props.type).toBe("text");
    });

    it("#Textarea gets no input attributes and a max-length wrapper when capped", () => {
        const {props, field} = mountScalar(bind("#Textarea", {maxLength: 10, rows: 3}), makeField("abc"), {editMode: true});
        expect(props).toMatchObject({maxLength: 10, rows: 3, value: "abc"});
        expect("type" in props).toBe(false);
        props.onChange({target: {value: ""}});
        expect(field.onChange).toHaveBeenCalledWith(null);
        const probe = document.querySelector('[data-probe="W"]');
        expect(probe?.parentElement?.className).toContain("w-full");

        resetCalls();
        document.body.innerHTML = "";
        mountScalar(bind("#Textarea"), makeField("abc"));
        expect(document.querySelector('[data-probe="W"]')?.parentElement?.className ?? "").not.toContain("w-full");
    });

    it("anything else spreads the field and widget props", () => {
        const field = makeField("v");
        const {props} = mountScalar(bind("#Custom", {x: 1}, {placeholder: "ph"}), field);
        expect(props).toMatchObject({placeholder: "t:ph", type: "text", value: "v", x: 1, name: "f"});
    });
});

describe("renderCompoundWidget", () => {
    it("#MediaField gets resolved label and placeholder", () => {
        const p = mountCompound(bind("#MediaField", {multiple: true}, {label: "photos", placeholder: "pick", required: true}), {loading: true, editMode: true});
        expect(p).toMatchObject({multiple: true, name: "f", label: "t:photos", placeholder: "t:pick", required: true, loading: true, editMode: true});
    });

    it("#StringArrayInput and #ListingFaqsField get language keys, not resolved text", () => {
        expect(mountCompound(bind("#StringArrayInput", {maxItems: 3, maxLength: 20}, {label: "tags"}))).toMatchObject({
            labelKey: "tags", placeholderKey: "f", removeTooltipKey: "remove", maxItems: 3, maxLength: 20, loading: false,
        });
        expect(mountCompound(bind("#ListingFaqsField", {maxRows: 4}))).toMatchObject({
            questionPlaceholderKey: "form.faqQuestionPlaceholder", addRowLabelKey: "form.faqAddRow", maxRows: 4,
        });
    });

    it("#FormRepeater / #FormTabbedRepeater default their prefix and templates", () => {
        const extra = {editMode: true, writeAccess: {items: true}, formExtras: {k: 1}};
        expect(mountCompound(bind("#FormRepeater", {title: "T"}, {name: "items", disabled: true}), extra)).toMatchObject({
            fieldPrefix: "items", arrayField: "items", defaultItem: {}, rowTemplate: [], title: "T", disabled: true, editMode: true,
            writeAccess: {items: true}, formExtras: {k: 1},
        });
        expect(mountCompound(bind("#FormTabbedRepeater", {tabs: [{key: "a"}]}, {name: "rows"}))).toMatchObject({
            fieldPrefix: "rows", tabs: [{key: "a"}], defaultItem: {}, rowTemplate: [], editMode: false,
        });
    });

    it("address widgets default their method to POST", () => {
        expect(mountCompound(bind("#FormAddressRow", {countryApiUrl: "/c"}, {name: "address"}))).toMatchObject({fieldPrefix: "address", apiMethod: "POST", countryApiUrl: "/c"});
        expect(mountCompound(bind("#FormAddressWithMap", {arrayField: "addresses", apiMethod: "GET"}))).toMatchObject({fieldPrefix: "f", arrayField: "addresses", apiMethod: "GET"});
        expect(mountCompound(bind("#FormMapPinPicker", {latField: "lat"}))).toMatchObject({fieldPrefix: "f", latField: "lat", loading: false});
    });

    it("#ObjectIdChipsInput defaults its method", () => {
        expect(mountCompound(bind("#ObjectIdChipsInput", {apiUrl: "/x"}))).toMatchObject({name: "f", apiUrl: "/x", method: "POST"});
    });

    it("propertyManagement polygon and item widgets (contributed) get their keys", () => {
        expect(mountCompound(bind("#FormFloorPolygon", {polygonField: "p", closedField: "c"}))).toMatchObject({polygonField: "p", closedField: "c", resolveLanguageKey: t});
        expect(mountCompound(bind("#FormEdificePolygon", {errorTitleKey: "e"}))).toMatchObject({errorTitleKey: "e"});
        expect(mountCompound(bind("#FormUnitPolygon", {edificeField: "ed"}))).toMatchObject({edificeField: "ed"});
        expect(mountCompound(bind("#FormExpenditureItemsField", {}, {label: "items"}))).toMatchObject({name: "f", label: "t:items"});
        expect(mountCompound(bind("#FormExpenditureItemsField", {name: "other"}))).toMatchObject({name: "other", label: undefined});
        expect(mountCompound(bind("#PaymentPlanInstallmentsField", {name: "wp-wins"}, {label: "plan"}))).toMatchObject({name: "wp-wins", label: "t:plan"});
    });

    it("#FormMultiLocalFileField prefixes a relative name only once", () => {
        expect(mountCompound(bind("#FormMultiLocalFileField", {fieldPrefix: "findings.0", accept: "image/*"}, {name: "media"}))).toMatchObject({
            name: "findings.0.media", accept: "image/*",
        });
        const p = mountCompound(bind("#FormMultiLocalFileField", {fieldPrefix: "findings.0"}, {name: "findings.0.media"}));
        expect(p.name).toBe("findings.0.media");
        expect("fieldPrefix" in p).toBe(false);
    });

    it("#UnitCard renders the unit snapshot from form extras, or nothing", () => {
        const unit = {_id: "u1", project: {_id: "p", name: "P"}, edifice: {_id: "e", name: "E"}, floor: {_id: "f", name: "F"}};
        const {container} = render(<>{renderCompoundWidget(W, bind("#UnitCard", {small: true}), t, {formExtras: {cashSaleUnitSnapshot: unit}})}</>);
        expect(lastProps("W")).toMatchObject({unit, projectId: "p", edificeName: "E", floorId: "f", hideActions: true, small: true});
        expect(container.firstElementChild?.className).toContain("md:sticky");

        resetCalls();
        expect(renderCompoundWidget(W, bind("#UnitCard", {formExtraUnitKey: "other"}), t, {formExtras: {cashSaleUnitSnapshot: unit}})).toBeNull();
    });

    it("#FormEditMediaField and the fallback spread widget props last", () => {
        expect(mountCompound(bind("#FormEditMediaField", {loading: "wp"}), {loading: true})).toMatchObject({loading: "wp"});
        expect(mountCompound(bind("#ModuleCompound", {extra: 1}, {label: "l", placeholder: "p"}), {editMode: true})).toMatchObject({
            name: "f", label: "t:l", placeholder: "t:p", editMode: true, extra: 1,
        });
    });
});
