import {formatDate, DATE_FORMATS} from "@coreModule/helpers/general/dateTime.ts";
import {formatNumber} from "@coreModule/helpers/general/numbers.ts";
import {resolvePath} from "./refs.ts";

/** View-engine display dates. Calendar days use UTC; instants use the runtime timezone here. */
export function formatTemporal(value: unknown, mode: "date" | "dateTime"): string | null {
    if (value == null || value === "") return null;
    const formatted = formatDate(value instanceof Date || typeof value === "string" || typeof value === "number" ? value : null, {
        timeZone: mode === "date" ? "UTC" : undefined,
        format: mode === "dateTime" ? DATE_FORMATS.mediumDateTime : DATE_FORMATS.mediumDate,
    });
    if (formatted) return formatted;
    return value == null ? null : String(value);
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

/**
 * "€ 12.50": the amount at its currency's decimals (default 2), with the symbol (else the code) in front, the way
 * sheet cards show money (UX-07). Shared by sheet item lists and money table columns (D149). A value that isn't a
 * number is shown as it is.
 */
export function formatAmountWithCurrency(raw: unknown, currency: unknown): string {
    const text = String(raw ?? "").trim();
    if (!text) return "";
    const amount = typeof raw === "number" ? raw : Number(text);
    if (!Number.isFinite(amount)) return text;
    const c = currency && typeof currency === "object" ? (currency as {symbol?: unknown; abbreviation?: unknown; decimalPlaces?: unknown}) : {};
    const decimals = typeof c.decimalPlaces === "number" ? c.decimalPlaces : 2;
    const formatted = formatNumber(amount, {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
    const label = (typeof c.symbol === "string" && c.symbol.trim()) || (typeof c.abbreviation === "string" && c.abbreviation.trim()) || "";
    return label ? `${label} ${formatted}` : formatted;
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

/**
 * A display value through a translated template (`valueTemplateKey`, e.g. "{value} days"), so a unit reads naturally
 * in every language (TD-F62, UX-08). Numbers pick the language's plural form: `<key>.one` / `<key>.other` (any
 * `Intl.PluralRules` category), else the plain `<key>`. Without a template the value is shown as it is.
 */
export function applyValueTemplate(
    resolveLanguageKey: (key: string, returnUndefinedIfNeeded?: boolean) => unknown,
    key: string,
    value: string | number,
    locale?: string,
): string {
    const amount = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, ""));
    const form = Number.isFinite(amount) ? new Intl.PluralRules(locale).select(amount) : "other";
    const pick = (candidate: string) => {
        const text = resolveLanguageKey(candidate, true);
        return typeof text === "string" && text.includes("{value}") ? text : undefined;
    };
    const template = pick(`${key}.${form}`) ?? pick(`${key}.other`) ?? pick(key);
    return template ? template.replace("{value}", String(value)) : String(value);
}
