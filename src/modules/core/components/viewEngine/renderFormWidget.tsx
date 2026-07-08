import type { ReactNode } from "react";
import type { FieldBinding } from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type { Unit as UnitDto } from "armonia/src/modules/propertyManagement/api/realEstate/private/unit/unit/unit.dto.ts";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";

export type FormWidgetExtra = {
    loading?: boolean;
    editMode?: boolean;
    writeAccess?: Record<string, any>;
    formExtras?: Record<string, unknown>;
};

/**
 * Widget tokens for compound fields that manage their own FormField/FormItem
 * internally via useFormContext(). These must NOT be wrapped in FormField again.
 */
const COMPOUND_WIDGETS = new Set([
    "#MediaField",
    "#MainImageField",
    "#ImageGalleryField",
    "#VideoGalleryField",
    "#StringArrayField",
    "#ListingFaqsField",
    "#FormAddressWithMap",
    "#FormAddressRow",
    "#FormRepeater",
    "#FormTabbedRepeater",
    "#FormMapPinPicker",
    "#FormObjectIdChips",
    "#FormFloorPolygon",
    "#FormEdificePolygon",
    "#FormUnitPolygon",
    "#FormExpenditureItemsField",
    "#FormMultiLocalFileField",
    "#FormEditMediaField",
    "#PaymentPlanInstallmentsField",
    "#UnitCard",
]);

export function isCompoundFormWidget(widgetToken: string): boolean {
    return COMPOUND_WIDGETS.has(widgetToken);
}

/**
 * Renders a compound form widget — one that manages its own FormField internally.
 * The HOC-wrapped #MediaField gets its own resolveLanguageKey from withLanguage,
 * so we only pass the pre-resolved `label` and the contextual props.
 */
export function renderCompoundWidget(
    Widget: React.ComponentType<any>,
    binding: FieldBinding,
    resolveLanguageKey: ResolveLanguageKey,
    extra?: FormWidgetExtra
): ReactNode {
    const wp = binding.widgetProps ?? {};

    if (binding.widget === "#MediaField") {
        return (
            <Widget
                {...wp}
                name={binding.name}
                label={binding.label ? String(resolveLanguageKey(binding.label)) : binding.name}
                loading={extra?.loading ?? false}
                editMode={extra?.editMode ?? false}
                required={binding.required}
                placeholder={binding.placeholder ? String(resolveLanguageKey(binding.placeholder)) : undefined}
            />
        );
    }

    if (binding.widget === "#StringArrayField") {
        return (
            <Widget
                name={binding.name}
                labelKey={binding.label ?? binding.name}
                placeholderKey={binding.placeholder ?? binding.name}
                removeTooltipKey={wp.removeTooltipKey ?? "remove"}
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
                maxItems={wp.maxItems}
            />
        );
    }

    if (binding.widget === "#ListingFaqsField") {
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
    }

    if (binding.widget === "#FormRepeater") {
        return (
            <Widget
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
                disabled={binding.disabled}
                editMode={extra?.editMode ?? false}
                writeAccess={extra?.writeAccess}
                formExtras={extra?.formExtras}
                fieldPrefix={wp.fieldPrefix ?? binding.name}
                arrayField={wp.arrayField ?? binding.name}
                deleteField={wp.deleteField}
                defaultItem={wp.defaultItem ?? {}}
                rowTemplate={wp.rowTemplate ?? []}
                rowCascades={wp.rowCascades}
                title={wp.title}
                rowTitleFields={wp.rowTitleFields}
                rowTitleSeparator={wp.rowTitleSeparator}
                rowTitlePlaceholder={wp.rowTitlePlaceholder}
                addLabel={wp.addLabel}
                removeLabel={wp.removeLabel}
            />
        );
    }

    if (binding.widget === "#FormAddressRow") {
        return (
            <Widget
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
                disabled={binding.disabled}
                editMode={extra?.editMode ?? false}
                writeAccess={extra?.writeAccess}
                fieldPrefix={wp.fieldPrefix ?? binding.name}
                writeAccessKey={wp.writeAccessKey}
                countryApiUrl={wp.countryApiUrl}
                stateApiUrl={wp.stateApiUrl}
                cityApiUrl={wp.cityApiUrl}
                apiMethod={wp.apiMethod ?? "POST"}
                mapDefaultLat={wp.mapDefaultLat}
                mapDefaultLng={wp.mapDefaultLng}
                selectPageSizeCreate={wp.selectPageSizeCreate}
                selectPageSizeEdit={wp.selectPageSizeEdit}
                labels={wp.labels}
            />
        );
    }

    if (binding.widget === "#FormMapPinPicker") {
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
    }

    if (binding.widget === "#FormAddressWithMap") {
        return (
            <Widget
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
                disabled={binding.disabled}
                editMode={extra?.editMode ?? false}
                writeAccess={extra?.writeAccess}
                fieldPrefix={wp.fieldPrefix ?? binding.name}
                arrayField={wp.arrayField}
                deleteField={wp.deleteField}
                writeAccessKey={wp.writeAccessKey}
                countryApiUrl={wp.countryApiUrl}
                stateApiUrl={wp.stateApiUrl}
                cityApiUrl={wp.cityApiUrl}
                apiMethod={wp.apiMethod ?? "POST"}
                mapDefaultLat={wp.mapDefaultLat}
                mapDefaultLng={wp.mapDefaultLng}
                selectPageSizeCreate={wp.selectPageSizeCreate}
                selectPageSizeEdit={wp.selectPageSizeEdit}
                addLabel={wp.addLabel}
                removeLabel={wp.removeLabel}
                labels={wp.labels}
            />
        );
    }

    if (binding.widget === "#FormObjectIdChips") {
        return (
            <Widget
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
                disabled={binding.disabled}
                editMode={extra?.editMode ?? false}
                name={binding.name}
                apiUrl={wp.apiUrl}
                method={wp.method ?? "POST"}
                placeholderKey={wp.placeholderKey}
                removeTooltipKey={wp.removeTooltipKey}
                selectPageSizeCreate={wp.selectPageSizeCreate}
                selectPageSizeEdit={wp.selectPageSizeEdit}
                labelRefFormExtraKey={wp.labelRefFormExtraKey}
                formExtras={extra?.formExtras}
            />
        );
    }

    if (binding.widget === "#FormFloorPolygon") {
        return (
            <Widget
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
                formExtras={extra?.formExtras}
                polygonField={wp.polygonField}
                closedField={wp.closedField}
                projectField={wp.projectField}
                hintKey={wp.hintKey}
                errorLoadingKey={wp.errorLoadingKey}
                noImageKey={wp.noImageKey}
            />
        );
    }

    if (binding.widget === "#FormEdificePolygon") {
        return (
            <Widget
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
                formExtras={extra?.formExtras}
                polygonField={wp.polygonField}
                projectField={wp.projectField}
                hintKey={wp.hintKey}
                errorTitleKey={wp.errorTitleKey}
                errorLoadingKey={wp.errorLoadingKey}
                noImageKey={wp.noImageKey}
            />
        );
    }

    if (binding.widget === "#FormUnitPolygon") {
        return (
            <Widget
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
                formExtras={extra?.formExtras}
                floorField={wp.floorField}
                polygonField={wp.polygonField}
                closedField={wp.closedField}
                projectField={wp.projectField}
                edificeField={wp.edificeField}
                hintKey={wp.hintKey}
                errorLoadingKey={wp.errorLoadingKey}
                noImageKey={wp.noImageKey}
            />
        );
    }

    if (binding.widget === "#FormTabbedRepeater") {
        const wp = binding.widgetProps ?? {};
        return (
            <Widget
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
                disabled={binding.disabled}
                editMode={extra?.editMode ?? false}
                writeAccess={extra?.writeAccess}
                formExtras={extra?.formExtras}
                fieldPrefix={wp.fieldPrefix ?? binding.name}
                tabs={wp.tabs ?? []}
                defaultItem={wp.defaultItem ?? {}}
                rowTemplate={wp.rowTemplate ?? []}
                rowCascades={wp.rowCascades}
                rowTitleFields={wp.rowTitleFields}
                rowTitleSeparator={wp.rowTitleSeparator}
                rowTitlePlaceholder={wp.rowTitlePlaceholder}
                addLabel={wp.addLabel}
                removeLabel={wp.removeLabel}
            />
        );
    }

    if (binding.widget === "#FormExpenditureItemsField") {
        return (
            <Widget
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
                formExtras={extra?.formExtras}
                name={(wp.name as string | undefined) ?? binding.name}
                label={binding.label ? String(resolveLanguageKey(binding.label)) : undefined}
            />
        );
    }

    if (binding.widget === "#FormMultiLocalFileField") {
        const { fieldPrefix: _fp, ...restWp } = wp;
        const name = _fp ? `${_fp}.${binding.name}` : binding.name;
        return (
            <Widget
                {...restWp}
                name={name}
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
                disabled={binding.disabled}
                formExtras={extra?.formExtras}
            />
        );
    }

    if (binding.widget === "#PaymentPlanInstallmentsField") {
        return (
            <Widget
                name={binding.name}
                label={binding.label ? String(resolveLanguageKey(binding.label)) : undefined}
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
                {...wp}
            />
        );
    }

    if (binding.widget === "#UnitCard") {
        const extraKey = typeof wp.formExtraUnitKey === "string" && wp.formExtraUnitKey.length > 0 ? wp.formExtraUnitKey : "cashSaleUnitSnapshot";
        const fe = extra?.formExtras as Record<string, unknown> | undefined;
        const unit = fe?.[extraKey] as UnitDto | null | undefined;
        if (!unit?._id) {
            return null;
        }
        const wrapperClass =
            typeof wp.wrapperClassName === "string" && wp.wrapperClassName.length > 0
                ? wp.wrapperClassName
                : "md:sticky md:top-4 max-h-[min(85vh,900px)] overflow-y-auto rounded-lg";
        const hideActions = wp.hideActions !== false;
        return (
            <div className={wrapperClass}>
                <Widget
                    unit={unit}
                    projectId={unit.project?._id}
                    projectName={unit.project?.name}
                    edificeId={unit.edifice?._id}
                    edificeName={unit.edifice?.name}
                    floorId={unit.floor?._id}
                    floorName={unit.floor?.name}
                    hideActions={hideActions}
                    small={wp.small === true}
                />
            </div>
        );
    }

    if (binding.widget === "#FormEditMediaField") {
        return (
            <Widget
                resolveLanguageKey={resolveLanguageKey}
                loading={extra?.loading ?? false}
                disabled={binding.disabled}
                formExtras={extra?.formExtras}
                {...wp}
            />
        );
    }

    return (
        <Widget
            resolveLanguageKey={resolveLanguageKey}
            loading={extra?.loading ?? false}
            editMode={extra?.editMode ?? false}
            {...wp}
        />
    );
}

/**
 * Renders the appropriate form widget for a given field binding.
 * Shared between FormViewRenderer (create) and EditFormViewRenderer (edit)
 * so widget-to-prop mapping lives in exactly one place.
 */
export function renderFormWidget(
    Widget: React.ComponentType<any>,
    binding: FieldBinding,
    field: any,
    resolveLanguageKey: ResolveLanguageKey,
    extra?: FormWidgetExtra
): ReactNode {
    const widgetProps = binding.widgetProps ?? {};
    const placeholder = binding.placeholder ? String(resolveLanguageKey(binding.placeholder)) : undefined;

    if (binding.widget === "#ApiSelect") {
        const formExtras = extra?.formExtras as Record<string, unknown> | undefined;
        const mergeMap = widgetProps.postBodyFormExtrasMerge as Record<string, unknown> | undefined;
        const {
            postBodyFormExtrasMerge: _mergeMap,
            normalizeEmptyToUndefined,
            inlineCreateEntityLabel: inlineCreateEntityLabelKeyFromWp,
            // Consumed by FormRepeater's renderRowNode; strip before forwarding to ApiSelect.
            postBodyFromRowFields: _pbFromRow,
            disabledWhenRowFieldEmpty: _disableWhen,
            // Injected by FormRepeater to capture the human-readable label for row titles.
            __onValueChangeFull: onValueChangeFull,
            ...restWp
        } = widgetProps;
        const inlineCreateEntityLabel =
            typeof inlineCreateEntityLabelKeyFromWp === "string" && inlineCreateEntityLabelKeyFromWp !== ""
                ? String(resolveLanguageKey(inlineCreateEntityLabelKeyFromWp))
                : binding.label
                  ? String(resolveLanguageKey(binding.label))
                  : undefined;
        let mergedPost = { ...((widgetProps.postBody as Record<string, unknown> | undefined) ?? {}) };
        if (mergeMap) {
            for (const [postKey, extraKeyOrValue] of Object.entries(mergeMap)) {
                const v = typeof extraKeyOrValue === "string" ? formExtras?.[extraKeyOrValue] : extraKeyOrValue;
                if (v != null && v !== "") mergedPost = { ...mergedPost, [postKey]: v };
            }
        }
        const onValueChange = (value: string | string[], label?: string | string[]) => {
            let normalized: string | string[] | null | undefined = value;
            if (!Array.isArray(value) && (value === "" || value == null)) {
                if (extra?.editMode) normalized = null;
                else if (normalizeEmptyToUndefined) normalized = undefined;
            }
            field.onChange(normalized);
            (onValueChangeFull as any)?.(value, label);
        };
        const selectValue =
            normalizeEmptyToUndefined ?
                field.value == null || field.value === "" ?
                    ""
                :   String(field.value)
            :   field.value;
        return (
            <Widget
                apiUrl={widgetProps.apiUrl}
                value={selectValue}
                onValueChange={onValueChange}
                placeholder={placeholder}
                inlineCreateEntityLabel={inlineCreateEntityLabel}
                resolveLanguageKey={resolveLanguageKey}
                disabled={field.disabled || !!restWp.disabled}
                {...restWp}
                postBody={mergedPost}
                formFieldName={binding.name}
                formExtras={formExtras}
            />
        );
    }

    if (binding.widget === "#SimpleSelect") {
        const rawOpts = (widgetProps.options ?? []) as { value: string; label: string }[];
        const resolvedOptions = rawOpts.map((o) => ({
            ...o,
            label: o.label.includes(".") ? String(resolveLanguageKey(o.label)) : o.label,
        }));
        const emptyValue = extra?.editMode ? null : undefined;
        return (
            <Widget
                {...widgetProps}
                options={resolvedOptions}
                value={field.value}
                onValueChange={(v: string | string[]) =>
                    field.onChange(!Array.isArray(v) && (v === "" || v == null) ? emptyValue : v)
                }
                placeholder={placeholder}
                multiple={widgetProps.multiple}
                disabled={field.disabled || widgetProps.disabled}
            />
        );
    }

    if (binding.widget === "#DateInput") {
        const emptyValue = extra?.editMode ? null : undefined;
        return (
            <Widget
                value={field.value}
                onChange={(v: string | undefined | null) =>
                    field.onChange(v === "" || v == null ? emptyValue : v)
                }
                placeholder={placeholder}
                disabled={field.disabled || widgetProps.disabled}
                valueFormat={widgetProps.valueFormat}
                displayFormat={widgetProps.displayFormat}
                {...widgetProps}
            />
        );
    }

    if (binding.widget === "#IconPicker") {
        const emptyValue = extra?.editMode ? null : undefined;
        return (
            <Widget
                value={field.value}
                onValueChange={(v: string | undefined) =>
                    field.onChange(v === "" || v == null ? emptyValue : v)
                }
                disabled={field.disabled || widgetProps.disabled}
                placeholder={placeholder}
                {...widgetProps}
            />
        );
    }

    if (binding.widget === "#PhoneInput") {
        const emptyValue = extra?.editMode ? null : undefined;
        return (
            <Widget
                value={field.value}
                onChange={(v: string | undefined) =>
                    field.onChange(v === "" || v == null ? emptyValue : v)
                }
                placeholder={placeholder}
                disabled={field.disabled || widgetProps.disabled}
                defaultCountry={widgetProps.defaultCountry ?? "AL"}
                {...widgetProps}
            />
        );
    }

    if (binding.widget === "#Checkbox" || binding.widget === "#Switch") {
        return <Widget checked={field.value} onCheckedChange={field.onChange} {...widgetProps} />;
    }

    if (widgetProps.type === "number" || widgetProps.type === "decimal") {
        const { type: _inputType, step, ...numericRest } = widgetProps;
        const emptyValue = extra?.editMode ? null : undefined;
        return (
            <Widget
                placeholder={placeholder}
                {...field}
                {...numericRest}
                type="number"
                step={step !== undefined ? step : widgetProps.type === "decimal" ? "0.01" : undefined}
                value={field.value ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    field.onChange(e.target.value === "" ? emptyValue : parseFloat(e.target.value))
                }
            />
        );
    }

    if (binding.widget === "#Input" || binding.widget === "#Textarea") {
        const { type, ...restWp } = widgetProps;
        const emptyValue = extra?.editMode ? null : undefined;
        return (
            <Widget
                placeholder={placeholder}
                {...field}
                {...restWp}
                {...(binding.widget === "#Input" ? { type: type ?? "text" } : {})}
                value={field.value ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                    field.onChange(e.target.value === "" ? emptyValue : e.target.value)
                }
            />
        );
    }

    return (
        <Widget
            placeholder={placeholder}
            type={widgetProps.type ?? "text"}
            {...field}
            {...widgetProps}
        />
    );
}
