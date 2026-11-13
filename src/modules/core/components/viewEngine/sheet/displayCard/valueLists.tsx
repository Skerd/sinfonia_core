import type {ReactNode} from "react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import {DEFAULT_DECIMAL_PLACES, roundToCurrency} from "armonia/src/modules/core/helpers/money.ts";
import {formatAmountWithCurrency} from "../../engine/format.ts";
import type {WidgetProps} from "../../engine/types.ts";

const BADGE_ROW = "flex flex-wrap gap-y-1 gap-x-1 mt-0.5";

function EmptyList() {
    return (
        <div className="mt-0.5">
            <ValueNotSet />
        </div>
    );
}

/**
 * Enum token under `languageKeyCategory`, else the stored string.
 * Missing keys stay the token, same as `formatEnum`.
 */
function badgeText(item: unknown, category: string | undefined, resolveLanguageKey: ResolveLanguageKey | undefined): string {
    const token = String(item ?? "").trim();
    if (!token || !category || !resolveLanguageKey) return token;
    const exact = resolveLanguageKey(`${category}.${token}`, true);
    if (typeof exact === "string" && exact.length > 0) return exact;
    const lower = token.toLowerCase();
    if (lower !== token) {
        const lowered = resolveLanguageKey(`${category}.${lower}`, true);
        if (typeof lowered === "string" && lowered.length > 0) return lowered;
    }
    return token;
}

/** `valueType: "stringBadgeList"` — one badge per string, `+N` past `maxItems`. */
export function stringBadgeList(
    list: unknown,
    maxItems: unknown,
    languageKeyCategory?: string,
    resolveLanguageKey?: ResolveLanguageKey,
): ReactNode {
    if (!Array.isArray(list) || list.length === 0) return <EmptyList />;
    const limit = typeof maxItems === "number" && maxItems > 0 ? maxItems : list.length;
    const visible = list.slice(0, limit);
    const remaining = list.length - visible.length;
    return (
        <div className={BADGE_ROW}>
            {visible.map((item, i) => (
                <Badge key={i} variant="outline">
                    {badgeText(item, languageKeyCategory, resolveLanguageKey)}
                </Badge>
            ))}
            {remaining > 0 && <Badge variant="secondary">+{remaining}</Badge>}
        </div>
    );
}

type CurrencyAmount = {value?: number; currency?: {abbreviation?: string; symbol?: string; name?: string; decimalPlaces?: number}};

/** One amount at its currency's decimals, rounded once by the money helper (GLB-08, TD-F75): "€ 1,376,503.90". */
export function currencyListItemText(item: CurrencyAmount): string {
    const currency = item.currency;
    const decimals = typeof currency?.decimalPlaces === "number" ? currency.decimalPlaces : DEFAULT_DECIMAL_PLACES;
    const amount = formatAmountWithCurrency(roundToCurrency(item.value ?? 0, decimals), currency);
    // A currency known only by name still names it.
    return currency?.symbol?.trim() || currency?.abbreviation?.trim() || !currency?.name ? amount : `${currency.name} ${amount}`;
}

/**
 * `valueType: "currencyList"` — `[{value, currency}]` (or one such object) as
 * "€ 10.00 and $ 5.00"; `widgetProps.andKey` overrides the joiner key.
 */
export function currencyList(raw: unknown, wp: WidgetProps, resolveLanguageKey: ResolveLanguageKey): ReactNode {
    const list: CurrencyAmount[] = Array.isArray(raw)
        ? raw
        : raw != null && typeof raw === "object" && "value" in raw
          ? [raw as CurrencyAmount]
          : [];
    if (list.length === 0) {
        return (
            <div className="flex items-center gap-x-0.5">
                <p>{resolveLanguageKey("none")}</p>
            </div>
        );
    }

    const andKey = wp.andKey ?? "and";
    return (
        <div className="text-success flex flex-wrap gap-x-1">
            {list.map((item, i) => {
                const isLastOfMany = list.length > 1 && i === list.length - 1;
                return (
                    <div className="flex items-center gap-x-0.5" key={i}>
                        {isLastOfMany && <span> {resolveLanguageKey(andKey)} </span>}
                        <p>{currencyListItemText(item)}</p>
                    </div>
                );
            })}
        </div>
    );
}
