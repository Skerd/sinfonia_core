import {format, isValid} from "date-fns";
import {formatNumber} from "@baseModule/helpers/general/numbers.ts";
import {resolvePath} from "./refs.ts";

/** `PP` / `PPp` for dates and ISO strings; an unparseable value comes back as text, empty as `null`. */
export function formatTemporal(value: unknown, mode: "date" | "dateTime"): string | null {
    if (value == null || value === "") return null;
    const d =
        value instanceof Date
            ? value
            : typeof value === "string" || typeof value === "number"
              ? new Date(value)
              : null;
    if (!d || !isValid(d)) return String(value);
    return format(d, mode === "dateTime" ? "PPp" : "PP");
}

export type CurrencyStub = {amount: number; currency?: {symbol?: string; abbreviation?: string}};

function toAmount(part: unknown): number | null {
    if (typeof part === "number") return Number.isFinite(part) ? part : null;
    if (typeof part === "string") return part.trim() !== "" && Number.isFinite(Number(part)) ? Number(part) : null;
    if (part != null && typeof part === "object") {
        // Decimal128 and friends stringify to their number.
        const asString = String(part);
        return asString !== "[object Object]" && Number.isFinite(Number(asString)) ? Number(asString) : null;
    }
    return null;
}

/**
 * Build the structured stub `DisplayValue` `type="currency"` expects from a
 * `valuePath` like `["priceCurrency.symbol", "price"]`. Joining into a string
 * ("€ 123") fails currency formatting and shows ValueNotSet ("!").
 */
export function currencyStubFromValuePath(parent: Record<string, unknown>, valuePath: string[]): CurrencyStub | null {
    let amount: number | null = null;
    let symbol: string | undefined;
    let abbreviation: string | undefined;

    for (const path of valuePath) {
        const part = resolvePath(parent, path);
        const leaf = path.slice(path.lastIndexOf(".") + 1);
        const text = part != null ? String(part).trim() : "";
        if (leaf === "symbol" && text !== "") {
            symbol = text;
        } else if (leaf === "abbreviation" && text !== "") {
            abbreviation = text;
        } else {
            amount = toAmount(part) ?? amount;
        }
    }

    if (amount == null) return null;
    return symbol || abbreviation ? {amount, currency: {symbol, abbreviation}} : {amount};
}

/** `"€ 12.50"` from a currency stub (symbol, else abbreviation), or `null` without an amount. */
export function currencyStubText(stub: unknown): string | null {
    if (stub == null || typeof stub !== "object" || Array.isArray(stub)) return null;
    const s = stub as {
        amount?: unknown;
        currency?: {symbol?: string; abbreviation?: string};
        symbol?: string;
        abbreviation?: string;
    };
    if (typeof s.amount !== "number" || !Number.isFinite(s.amount)) return null;
    const label =
        s.currency?.symbol?.trim() ||
        s.currency?.abbreviation?.trim() ||
        s.symbol?.trim() ||
        s.abbreviation?.trim() ||
        "";
    const amount = formatNumber(s.amount, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    return label ? `${label} ${amount}` : amount;
}

/** Adds `prefix` / `suffix` unless the text already contains them. */
export function affix(text: string, prefix?: unknown, suffix?: unknown): string {
    const pre = asAffix(prefix);
    const post = asAffix(suffix);
    let out = text;
    if (pre && !out.includes(pre)) out = pre + out;
    if (post && !out.includes(post)) out = out + post;
    return out;
}

function asAffix(v: unknown): string {
    return typeof v === "string" || (typeof v === "number" && v !== 0) ? String(v) : "";
}
