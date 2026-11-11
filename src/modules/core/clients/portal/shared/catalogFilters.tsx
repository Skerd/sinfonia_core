import {useCallback, useId, type ReactNode} from "react";
import {useSearchParams} from "react-router-dom";
import {Field, FieldLabel} from "@coreModule/components/ui/field.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {DateInput} from "@coreModule/components/custom/inputs/dateInput.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@coreModule/components/ui/select.tsx";

/*
 * The home catalog keeps its state in the URL (`q`, `city`, `kind`, `priceMin`, `priceMax`,
 * `sort`, `page`); each kind's own filters live under `f.<name>`. A section's `Filters`
 * component reads and writes those with `useCatalogFilter`.
 */

export const CATALOG_FILTER_PREFIX = "f.";

/** One filter option per slug: sellers on the apex can share a category name, and an ambiguous slug matches nothing. */
export function uniqueBySlug<Category extends {slug: string}>(categories: readonly Category[]): Category[] {
    return [...new Map(categories.map((category) => [category.slug, category])).values()];
}

/** One of the kind's filters: its value in the URL, and a setter that starts the results over at page one. */
export function useCatalogFilter(name: string): [string, (value: string) => void] {
    const [params, setParams] = useSearchParams();
    const key = `${CATALOG_FILTER_PREFIX}${name}`;
    const setValue = useCallback((value: string) => {
        setParams((current) => {
            const next = new URLSearchParams(current);
            if (value) next.set(key, value); else next.delete(key);
            next.delete("page");
            return next;
        }, {replace: true});
    }, [key, setParams]);
    return [params.get(key) ?? "", setValue];
}

/** A filter control with its label. */
export function CatalogFilterField({label, children}: {label: string; children: (id: string) => ReactNode}) {
    const id = useId();
    return (
        <Field className="min-w-40 flex-1 gap-1.5">
            <FieldLabel htmlFor={id} className="text-xs text-muted-foreground">{label}</FieldLabel>
            {children(id)}
        </Field>
    );
}

/** Radix selects cannot hold an empty value, so "any" travels as this and clears the filter. */
const ANY = "any";

type CatalogFilterSelectProps = {
    name: string;
    label: string;
    anyLabel: string;
    options: readonly {value: string; label: string}[];
};

/** A kind's filter with a fixed set of values, plus "any". */
export function CatalogFilterSelect({name, label, anyLabel, options}: CatalogFilterSelectProps) {
    const [value, setValue] = useCatalogFilter(name);
    return (
        <CatalogFilterField label={label}>
            {(id) => (
                <Select value={value || ANY} onValueChange={(next) => setValue(next === ANY ? "" : next)}>
                    <SelectTrigger id={id} className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ANY}>{anyLabel}</SelectItem>
                        {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            )}
        </CatalogFilterField>
    );
}

/** A number field that applies its value once the visitor leaves it (or presses Enter), not on every key. */
export function CatalogNumberInput({id, value, onCommit}: {id: string; value: string; onCommit: (value: string) => void}) {
    return (
        <Input
            id={id}
            key={value}
            type="number"
            min={0}
            inputMode="decimal"
            defaultValue={value}
            onBlur={(event) => onCommit(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") onCommit(event.currentTarget.value); }}
        />
    );
}

type CatalogFilterInputProps = {
    name: string;
    label: string;
    type: "date" | "time" | "number";
};

/**
 * A kind's filter typed in: a minimum, or a day or time picked on the shared date picker (UX-08, not the browser's
 * own); days travel as `YYYY-MM-DD` and times as `HH:mm`, as before.
 */
export function CatalogFilterInput({name, label, type}: CatalogFilterInputProps) {
    const [value, setValue] = useCatalogFilter(name);
    return (
        <CatalogFilterField label={label}>
            {(id) => {
                if (type === "number") return <CatalogNumberInput id={id} value={value} onCommit={setValue} />;
                return type === "time"
                    ? <DateInput id={id} timeOnly valueFormat="HH:mm" value={value} onChange={setValue} />
                    : <DateInput id={id} valueFormat="YYYY-MM-DD" value={value} onChange={setValue} />;
            }}
        </CatalogFilterField>
    );
}
