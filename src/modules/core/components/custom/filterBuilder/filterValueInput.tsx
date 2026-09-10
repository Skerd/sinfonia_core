import { useCallback, useMemo } from "react";
import { format, isValid, parse } from "date-fns";
import { Input } from "@coreModule/components/ui/input.tsx";
import { DateInput } from "@coreModule/components/custom/dateInput.tsx";
import { SimpleSelect } from "@coreModule/components/custom/simpleSelect";
import { ApiSelect } from "@coreModule/components/custom/apiSelect";
import { cn } from "@coreModule/components/lib/utils.ts";
import type { FilterFieldConfig, FilterOperator, FilterValue } from "armonia/src/modules/core/database/filter";
import { COLUMN_TYPE, isDateColumnType, isNumberColumnType } from "armonia/src/modules/core/database/filter/typeOperators";
import { compose } from "redux";
import withLanguage, { TranslationValue, WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";
import { findFromLanguage } from "@coreModule/helpers/general";
import { useFilterBuilder } from "./filterBuilderContext.tsx";

export function enumLabel(fields: TranslationValue | undefined, path: string, value: string): string {
    const key = `!enums.${path}.${value}`;
    const label = findFromLanguage(fields ?? {}, key);
    return typeof label === "string" && label !== key ? label : value;
}

const DATE_VALUE_FORMAT = "yyyy-MM-dd";
const DATETIME_VALUE_FORMAT = "yyyy-MM-dd'T'HH:mm";

function valueFormatForColumn(type: COLUMN_TYPE) {
    return type === COLUMN_TYPE.DATETIME ? DATETIME_VALUE_FORMAT : DATE_VALUE_FORMAT;
}

function normalizeDateFilterValue(value: string, valueFormat: string) {
    if (!value) return "";
    const parsed = parse(value, valueFormat, new Date());
    if (isValid(parsed)) return value;
    const iso = new Date(value);
    return isValid(iso) ? format(iso, valueFormat) : "";
}

function DateFilterInput({
    type,
    value,
    onChange,
    placeholder,
}: {
    type: COLUMN_TYPE;
    value: string;
    onChange: (next: string) => void;
    placeholder?: string;
}) {
    const withTime = type === COLUMN_TYPE.DATETIME;
    const valueFormat = valueFormatForColumn(type);
    return (
        <DateInput
            valueFormat={valueFormat}
            displayFormat={withTime ? "PPp" : undefined}
            value={normalizeDateFilterValue(value, valueFormat)}
            onChange={onChange}
            placeholder={placeholder}
        />
    );
}

type FilterValueInputProps = WithLanguageType & {
    fieldConfig: FilterFieldConfig | undefined;
    operator: FilterOperator;
    value: FilterValue;
    onChange: (value: FilterValue) => void;
    fieldsLanguage?: TranslationValue;
};

const inputBase = "w-full";
// const inputBase = "h-6 text-2xs";

type ObjectIdFilterValueInputProps = {
    fieldConfig: FilterFieldConfig;
    operator: FilterOperator;
    value: FilterValue;
    onVal: (value: FilterValue) => void;
    mergeRefLabels: (fieldPath: string, updates: Record<string, string>) => void;
    refLabelsByFieldPath: Record<string, Record<string, string>>;
    extraParams?: Record<string, unknown>;
    resolveLanguageKey: WithLanguageType["resolveLanguageKey"];
};

function ObjectIdFilterValueInput({
    fieldConfig,
    operator,
    value,
    onVal,
    mergeRefLabels,
    refLabelsByFieldPath,
    extraParams = {},
    resolveLanguageKey,
}: ObjectIdFilterValueInputProps) {
    const postBody = useMemo(
        () => Object.fromEntries((fieldConfig.postBodyKeys ?? []).map((k: string) => [k, extraParams[k]])),
        [fieldConfig.postBodyKeys, extraParams],
    );
    const isMulti = operator === "in" || operator === "notIn";
    const apiValue = isMulti
        ? (Array.isArray(value) ? value : value != null ? [value] : [])
        : (typeof value === "string" ? value : Array.isArray(value) && value[0] ? value[0] : undefined);

    const cachedForField = fieldConfig.path ? refLabelsByFieldPath[fieldConfig.path] : undefined;
    const defaultOptions = useMemo(() => {
        if (!cachedForField) return [];
        const ids = isMulti
            ? (Array.isArray(apiValue) ? apiValue.filter((v): v is string => typeof v === "string" && !!v) : [])
            : (typeof apiValue === "string" && apiValue ? [apiValue] : []);
        return ids
            .filter((id) => cachedForField[id])
            .map((id) => ({value: id, label: cachedForField[id]}));
    }, [cachedForField, apiValue, isMulti]);

    return (
        <ApiSelect
            apiUrl={fieldConfig.apiUrl!}
            postBody={postBody}
            value={apiValue as string | string[] | undefined}
            defaultOptions={defaultOptions}
            onValueChange={(v: string | string[] | undefined, labels?: string | string[]) => {
                if (fieldConfig.path && labels != null) {
                    if (Array.isArray(v) && Array.isArray(labels)) {
                        const updates: Record<string, string> = {};
                        v.forEach((id, i) => {
                            const lab = labels[i];
                            if (typeof id === "string" && id && typeof lab === "string" && lab) updates[id] = lab;
                        });
                        if (Object.keys(updates).length > 0) mergeRefLabels(fieldConfig.path, updates);
                    } else if (typeof v === "string" && v && typeof labels === "string" && labels) {
                        mergeRefLabels(fieldConfig.path, { [v]: labels });
                    }
                }
                if (isMulti) {
                    onVal(Array.isArray(v) ? v : v != null ? [v] : []);
                } else {
                    onVal((typeof v === "string" ? v : Array.isArray(v) && v[0] ? v[0] : null) as FilterValue);
                }
            }}
            multiple={isMulti}
            placeholder={isMulti ? resolveLanguageKey("selectValues") : resolveLanguageKey("selectValue")}
            className={cn(inputBase)}
            resolveLanguageKey={resolveLanguageKey}
            pageSize={50}
        />
    );
}

export function FilterValueInput({
    fieldConfig,
    operator,
    value,
    onChange,
    resolveLanguageKey,
    fieldsLanguage,
}: FilterValueInputProps) {
    const filterBuilderCtx = useFilterBuilder();
    const { mergeRefLabels, refLabelsByFieldPath } = filterBuilderCtx;
    const onVal = useCallback((v: FilterValue) => onChange(v), [onChange]);

    if (!fieldConfig) return null;

    const enumOptions = (fieldConfig.enumValues ?? []).map((value) => ({
        value,
        label: enumLabel(fieldsLanguage, fieldConfig.path, value),
    }));

    const boolOptions = [
        { value: "true", label: String(resolveLanguageKey("yes")) },
        { value: "false", label: String(resolveLanguageKey("no")) },
    ];

    if (operator === "exists") {
        const bool = value === true;
        return (
            <SimpleSelect
                options={boolOptions}
                value={bool ? "true" : "false"}
                onValueChange={(v: string | string[] | undefined) => onVal(v === "true")}
                placeholder={resolveLanguageKey("selectValue")}
                className={cn(inputBase)}
            />
        );
    }

    if (operator === "between") {
        const tuple = Array.isArray(value) && value.length === 2 ? value : ["", ""];
        const toTuple = (a: string, b: string): [string, string] | [number, number] =>
            isNumberColumnType(fieldConfig.type) ? [Number(a) || 0, Number(b) || 0] : [a, b];

        if (isDateColumnType(fieldConfig.type)) {
            const minStr = String(tuple[0] ?? "");
            const maxStr = String(tuple[1] ?? "");
            return (
                <div className="flex items-center gap-1 min-w-0 w-full">
                    <div className="flex grow max-w-1/2">
                        <DateFilterInput
                            type={fieldConfig.type}
                            value={minStr}
                            onChange={(next) => onVal(toTuple(next, maxStr))}
                            placeholder={resolveLanguageKey("min")}
                        />
                    </div>
                    <div className="flex grow max-w-1/2">
                        <DateFilterInput
                            type={fieldConfig.type}
                            value={maxStr}
                            onChange={(next) => onVal(toTuple(minStr, next))}
                            placeholder={resolveLanguageKey("max")}
                        />
                    </div>
                </div>
            );
        }

        const inputType = isNumberColumnType(fieldConfig.type) ? "number" : "text";
        return (
            <div className="flex items-center gap-1 min-w-0 w-full">
                <Input
                    type={inputType}
                    value={String(tuple[0] ?? "")}
                    onChange={(e) => onVal(toTuple(e.target.value, String(tuple[1] ?? "")))}
                    placeholder={resolveLanguageKey("min")}
                />
                <Input
                    type={inputType}
                    value={String(tuple[1] ?? "")}
                    onChange={(e) => onVal(toTuple(String(tuple[0] ?? ""), e.target.value))}
                    placeholder={resolveLanguageKey("max")}
                />
            </div>
        );
    }

    //TODO fix this
    if (fieldConfig.type === "objectId" && fieldConfig.apiUrl) {
        return (
            <ObjectIdFilterValueInput
                fieldConfig={fieldConfig}
                operator={operator}
                value={value}
                onVal={onVal}
                mergeRefLabels={mergeRefLabels}
                refLabelsByFieldPath={refLabelsByFieldPath}
                extraParams={filterBuilderCtx.extraParams}
                resolveLanguageKey={resolveLanguageKey}
            />
        );
    }

    if (operator === "in" || operator === "notIn") {
        const arr = Array.isArray(value) ? (value as string[]) : [];
        if (enumOptions.length > 0) {
            return (
                <SimpleSelect
                    options={enumOptions}
                    value={arr}
                    onValueChange={(v: string | string[] | undefined) =>
                        onVal(Array.isArray(v) ? v : v ? [v] : [])
                    }
                    multiple
                    placeholder={resolveLanguageKey("selectValues")}
                    className={cn(inputBase)}
                />
            );
        }
        return (
            <Input
                type="text"
                value={arr.join(", ")}
                onChange={(e) =>
                    onVal(
                        e.target.value
                            ? e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                            : []
                    )
                }
                placeholder={resolveLanguageKey("inValuesPlaceholder")}
                className={cn(inputBase)}
            />
        );
    }

    if (fieldConfig.type === "enum") {
        return (
            <SimpleSelect
                options={enumOptions}
                value={typeof value === "string" ? value : ""}
                onValueChange={(v: string | string[] | undefined) => onVal((v ?? null) as FilterValue)}
                placeholder={resolveLanguageKey("selectValue")}
                className={cn(inputBase)}
            />
        );
    }

    if (fieldConfig.type === "boolean") {
        const bool = value === true;
        return (
            <SimpleSelect
                options={boolOptions}
                value={bool ? "true" : "false"}
                onValueChange={(v: string | string[] | undefined) => onVal(v === "true")}
                placeholder={resolveLanguageKey("selectValue")}
                className={cn(inputBase)}
            />
        );
    }

    if (isNumberColumnType(fieldConfig.type)) {
        const numVal = typeof value === "number" ? value : "";
        return (
            <Input
                type="number"
                value={numVal}
                onChange={(e) => {
                    const v = e.target.value;
                    onVal(v === "" ? null : Number(v));
                }}
                placeholder={resolveLanguageKey("enterValue")}
                className={cn(inputBase)}
            />
        );
    }

    if (isDateColumnType(fieldConfig.type)) {
        const str = typeof value === "string" ? value : "";
        return (
            <DateFilterInput
                type={fieldConfig.type}
                value={str}
                onChange={(next) => onVal(next || null)}
                placeholder={resolveLanguageKey("selectValue")}
            />
        );
    }

    const strVal = typeof value === "string" ? value : "";
    return (
        <Input
            type="text"
            value={strVal}
            onChange={(e) => onVal(e.target.value || null)}
            placeholder={resolveLanguageKey("enterValue")}
            className={cn(inputBase)}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/filterBuilder/filterValueInput.tsx")
)(FilterValueInput);