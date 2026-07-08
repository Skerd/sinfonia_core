import { useCallback } from "react";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Input } from "@coreModule/components/ui/input.tsx";
import { Button } from "@coreModule/components/ui/button.tsx";
import { Calendar } from "@coreModule/components/ui/calendar.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@coreModule/components/ui/popover.tsx";
import { SimpleSelect } from "@coreModule/components/custom/simpleSelect";
import { ApiSelect } from "@coreModule/components/custom/apiSelect";
import { cn } from "@coreModule/components/lib/utils.ts";
import type { FilterFieldConfig, FilterOperator, FilterValue } from "armonia/src/modules/core/database/filter";
import { compose } from "redux";
import withLanguage, { WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";
import { useFilterBuilder } from "./filterBuilderContext.tsx";

type FilterValueInputProps = WithLanguageType & {
    fieldConfig: FilterFieldConfig | undefined;
    operator: FilterOperator;
    value: FilterValue;
    onChange: (value: FilterValue) => void;
};

const inputBase = "w-full";
// const inputBase = "h-6 text-[11px]";

export function FilterValueInput({
    fieldConfig,
    operator,
    value,
    onChange,
    resolveLanguageKey
}: FilterValueInputProps) {
    const filterBuilderCtx = useFilterBuilder();
    const { mergeRefLabels } = filterBuilderCtx;
    const onVal = useCallback((v: FilterValue) => onChange(v), [onChange]);

    if (!fieldConfig) return null;

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
            fieldConfig.type === "number" ? [Number(a) || 0, Number(b) || 0] : [a, b];

        if (fieldConfig.type === "date" ) {
            const dateFromStr = (s: string) => (!s ? undefined : parse(s, "yyyy-MM-dd", new Date()));
            const strFromDate = (d: Date | undefined) => (d ? format(d, "yyyy-MM-dd") : "");
            const minStr = String(tuple[0] ?? "");
            const maxStr = String(tuple[1] ?? "");
            return (
                <div className="flex items-center gap-1 min-w-0 w-full">
                    <div className="flex grow max-w-1/2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !minStr && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 size-4" />
                                    {minStr ? (() => { const d = dateFromStr(minStr); return d && isValid(d) ? format(d, "PPP") : minStr; })() : resolveLanguageKey("min")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dateFromStr(minStr)}
                                    onSelect={(d) => onVal(toTuple(strFromDate(d), maxStr))}
                                    captionLayout="dropdown"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex grow max-w-1/2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !maxStr && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 size-4" />
                                    {maxStr ? (() => { const d = dateFromStr(maxStr); return d && isValid(d) ? format(d, "PPP") : maxStr; })() : resolveLanguageKey("max")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dateFromStr(maxStr)}
                                    onSelect={(d) => onVal(toTuple(minStr, strFromDate(d)))}
                                    captionLayout="dropdown"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            );
        }

        const inputType = fieldConfig.type === "number" ? "number" : "text";
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
        const extraParams = filterBuilderCtx.extraParams ?? {};
        const postBody = Object.fromEntries((fieldConfig.postBodyKeys ?? []).map((k: string) => [k, extraParams[k]]))
        const isMulti = operator === "in" || operator === "notIn";
        const apiValue = isMulti
            ? (Array.isArray(value) ? value : value != null ? [value] : [])
            : (typeof value === "string" ? value : Array.isArray(value) && value[0] ? value[0] : undefined);

        return (
            <ApiSelect
                apiUrl={fieldConfig.apiUrl}
                postBody={postBody}
                value={apiValue}
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

    if (operator === "in" || operator === "notIn") {
        const arr = Array.isArray(value) ? (value as string[]) : [];
        const opts = fieldConfig.enumValues?.map((v: string) => ({ value: v, label: v })) ?? [];
        if (opts.length > 0) {
            return (
                <SimpleSelect
                    options={opts}
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
                options={(fieldConfig.enumValues ?? []).map((v: string) => ({ value: v, label: v }))}
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

    if (fieldConfig.type === "number") {
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

    if (fieldConfig.type === "date") {
        const str = typeof value === "string" ? value : value instanceof Date ? value.toISOString().slice(0, 10) : "";
        const dateFromStr = (s: string) => (!s ? undefined : parse(s, "yyyy-MM-dd", new Date()));
        const strFromDate = (d: Date | undefined) => (d ? format(d, "yyyy-MM-dd") : null);
        const selectedDate = str ? dateFromStr(str) : undefined;
        const displayText =
            str && selectedDate && isValid(selectedDate) ? format(selectedDate, "PPP") : null;

        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !displayText && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 size-4" />
                        {displayText ?? resolveLanguageKey("selectValue")}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => onVal(strFromDate(d))}
                        captionLayout="dropdown"
                    />
                </PopoverContent>
            </Popover>
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