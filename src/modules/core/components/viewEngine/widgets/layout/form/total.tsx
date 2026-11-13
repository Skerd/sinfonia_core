import {useEffect, useMemo, useState} from "react";
import {useWatch} from "react-hook-form";
import {cn} from "@coreModule/components/lib/utils.ts";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import useSelectedLanguage from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import {resolvePath} from "@coreModule/components/viewEngine/engine/refs.ts";
import {formatAmountWithCurrency} from "@coreModule/components/viewEngine/engine/format.ts";
import {formTotalValue, type FormTotalRule} from "./totalValue.ts";

type CurrencyStub = {symbol?: string; abbreviation?: string; decimalPlaces?: number};

/** Where the total's currency comes from: the record a form field points at, loaded with `POST url {_id}`. */
export type FormTotalCurrencySource = {
    /** Form field holding the currency, or a record that has one (the budget of a BOQ line). */
    field: string;
    /** That record's `single` route, e.g. `/api/finance/currency/single`. */
    url: string;
    /** Path of the currency on the loaded record; omitted when the record is the currency itself. */
    path?: string;
};

export type FormTotalProps = FormTotalRule & {
    /** Resolved label (the engine translates `label`); "Total" in the app language when omitted. */
    label?: string;
    /** One source, or several where the first with a value wins (a contract's currency, else the picked one). */
    currencyFrom: FormTotalCurrencySource | readonly FormTotalCurrencySource[];
    className?: string;
};

const TOTAL_LANGUAGE_PATH = "src/modules/core/components/viewEngine/widgets/layout/form/total.tsx";

/** Id of a populated ref, or the value itself. */
function idOf(value: unknown): string {
    if (typeof value === "string") return value;
    if (value != null && typeof value === "object" && "_id" in value) {
        const id = (value as {_id?: unknown})._id;
        return typeof id === "string" ? id : "";
    }
    return "";
}

function isCurrency(value: unknown): value is CurrencyStub {
    return value != null && typeof value === "object" && ("symbol" in value || "abbreviation" in value);
}

/**
 * The currency of the first source whose field has a value (a contract's currency before the invoice's own picker),
 * reloaded when that changes.
 */
function useSourceCurrency(from: FormTotalCurrencySource | readonly FormTotalCurrencySource[]): CurrencyStub | undefined {
    const sources: readonly FormTotalCurrencySource[] = "field" in from ? [from] : from;
    const watched: unknown = useWatch({name: sources.map((source) => source.field)});
    const ids = Array.isArray(watched) ? watched.map(idOf) : [];
    const index = ids.findIndex((value) => value !== "");
    const source = index >= 0 ? sources[index] : undefined;
    const id = index >= 0 ? ids[index] : "";
    const sourceKey = source ? `${source.url}|${source.path ?? ""}|${id}` : "";

    const [currency, setCurrency] = useState<CurrencyStub>();
    const [requestCount, setRequestCount] = useState(0);
    useEffect(() => {
        if (sourceKey) setRequestCount((count) => count + 1);
        else setCurrency(undefined);
    }, [sourceKey]);
    const url = source?.url ?? "";
    const path = source?.path;
    const request = useMemo<HttpRequest>(() => ({method: "post", url}), [url]);
    useHttpRequest<Record<string, unknown>>(request, {_id: id}, requestCount, true, {
        success: (record) => {
            const found = path ? resolvePath(record, path) : record;
            setCurrency(isCurrency(found) ? found : undefined);
        },
    });
    return currency;
}

/**
 * `#FormTotal` (VC-03, approved in D154 for TD-F74): the total a form builds, shown as the user types (UX-07) in the
 * currency of the record it belongs to. Display only: the server still computes and stores it on save (D151), with
 * the same rule (`multiply` = amount × factor, `add` = exact sum, nothing until every operand is typed).
 *
 * ```ts
 * {render: "#FormTotal", props: {label: "form.grossAmountLabel", add: ["netAmount", "vatAmount"],
 *     currencyFrom: {field: "currency", url: "/api/finance/currency/single"}}}
 * {render: "#FormTotal", props: {multiply: ["unitPrice", "quantity"],
 *     currencyFrom: {field: "bid", url: "/api/propertyDevelopment/bid/single", path: "currency"}}}
 * ```
 */
export function FormTotal({label, multiply, add, currencyFrom, className}: FormTotalProps) {
    const fields = [...(multiply ?? []), ...(add ?? [])];
    const watched: unknown = useWatch({name: fields});
    const values = Array.isArray(watched) ? watched : [];
    const currency = useSourceCurrency(currencyFrom);
    const {currentLanguage} = useSelectedLanguage(TOTAL_LANGUAGE_PATH);

    const total = currency
        ? formTotalValue({multiply, add}, (field) => values[fields.indexOf(field)], currency.decimalPlaces)
        : undefined;
    if (total === undefined || !currency) return null;

    const fallback = typeof currentLanguage?.total === "string" && currentLanguage.total !== "" ? currentLanguage.total : "Total";
    return (
        <div
            className={cn("flex items-center justify-between gap-3 self-end rounded-md border bg-muted/40 px-3 py-2 text-sm", className)}
            aria-live="polite"
        >
            <span className="text-muted-foreground">{label || fallback}</span>
            <span className="font-semibold tabular-nums">{formatAmountWithCurrency(total, currency)}</span>
        </div>
    );
}
