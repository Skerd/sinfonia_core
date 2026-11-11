import {formatCurrency, formatNumber} from "@coreModule/helpers/general/numbers.ts";
import type {PortalCurrency} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";

export type PortalMoneyCurrency = Pick<PortalCurrency, "symbol" | "abbreviation" | "decimalPlaces">;

/**
 * An amount in the record's own currency, locale-aware through the ISO code ("1.234,50 €" / "€1,234.50"), at the
 * currency's own decimals (D90); the bare symbol only when there is no code. Never borrows a site currency: an
 * amount without one is a plain number.
 */
export function formatRecordMoney(amount: number | undefined | null, currency?: PortalMoneyCurrency | null): string {
    if (amount == null || Number.isNaN(amount)) return "";
    const decimals = currency?.decimalPlaces ?? 2;
    const digits = {minimumFractionDigits: decimals, maximumFractionDigits: decimals};
    if (currency?.abbreviation) return formatCurrency(amount, currency.abbreviation, digits);
    if (currency?.symbol) return `${currency.symbol}${amount.toFixed(decimals)}`;
    return formatNumber(amount, digits);
}
