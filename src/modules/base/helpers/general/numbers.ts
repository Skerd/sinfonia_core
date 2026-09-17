/**
 * Cached per option set: constructing an `Intl.NumberFormat` costs roughly as
 * much as formatting a few hundred values, and these run inside chart tick
 * formatters and table cell renderers, which are called on every frame of a
 * resize and on every row of a page.
 */
const numberFormatterCache = new Map<string, Intl.NumberFormat>();

function getNumberFormatter(options: Intl.NumberFormatOptions): Intl.NumberFormat {
    const key = JSON.stringify(options);
    let formatter = numberFormatterCache.get(key);
    if (!formatter) {
        formatter = new Intl.NumberFormat(undefined, options);
        numberFormatterCache.set(key, formatter);
    }
    return formatter;
}

export interface FormatNumberOptions {
    /** Shortens to 1.6K / 1.6M. Use on chart axes and dense cells, not on totals. */
    compact?: boolean;
    /** ISO 4217 code. When present the result carries the currency symbol. */
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    /**
     * `"min2"` groups only from five digits up, so a year stays `2026` instead of
     * `2,026`. Use it wherever a numeric column mixes counts, years and amounts.
     */
    useGrouping?: Intl.NumberFormatOptions["useGrouping"];
}

/**
 * Locale-aware number formatting, the numeric counterpart to `formatDate`.
 *
 * Before this existed each call site did its own thing, which is why a chart
 * axis read `$1600000` and a card read `1.6M €` on the same screen.
 *
 * @returns `""` for null/undefined/NaN so callers can render an empty cell
 * rather than the string "NaN".
 */
export function formatNumber(value: number | null | undefined, options: FormatNumberOptions = {}): string {
    if (value == null || Number.isNaN(value)) return "";

    const {compact, currency, minimumFractionDigits, useGrouping} = options;
    // Compact notation defaults to 0 fraction digits, which turns 1.6M into 2M.
    const maximumFractionDigits = options.maximumFractionDigits ?? (compact ? 1 : undefined);

    const intlOptions: Intl.NumberFormatOptions = {
        notation: compact ? "compact" : "standard",
        ...(compact && {compactDisplay: "short" as const}),
        ...(currency && {style: "currency" as const, currency}),
        ...(useGrouping != null && {useGrouping}),
        ...(minimumFractionDigits != null && {minimumFractionDigits}),
        ...(maximumFractionDigits != null && {
            // Intl throws when the maximum is below the minimum.
            maximumFractionDigits: Math.max(maximumFractionDigits, minimumFractionDigits ?? 0),
        }),
    };

    return getNumberFormatter(intlOptions).format(value);
}

/**
 * Money. Defaults to whole units because the panel shows portfolio-scale
 * figures where cents are noise; pass `maximumFractionDigits: 2` for ledgers.
 */
export function formatCurrency(
    value: number | null | undefined,
    currency = "EUR",
    options: Omit<FormatNumberOptions, "currency"> = {},
): string {
    return formatNumber(value, {
        currency,
        maximumFractionDigits: options.compact ? undefined : 0,
        ...options,
    });
}
