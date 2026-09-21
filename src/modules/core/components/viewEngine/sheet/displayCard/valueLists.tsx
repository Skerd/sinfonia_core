import type {ReactNode} from "react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import {formatNumber} from "@coreModule/helpers/general/numbers.ts";
import type {WidgetProps} from "../../engine/types.ts";

const BADGE_ROW = "flex flex-wrap gap-y-1 gap-x-1 mt-0.5";

function EmptyList() {
    return (
        <div className="mt-0.5">
            <ValueNotSet />
        </div>
    );
}

/** `valueType: "stringBadgeList"` — one badge per string, `+N` past `maxItems`. */
export function stringBadgeList(list: unknown, maxItems: unknown): ReactNode {
    if (!Array.isArray(list) || list.length === 0) return <EmptyList />;
    const limit = typeof maxItems === "number" && maxItems > 0 ? maxItems : list.length;
    const visible = list.slice(0, limit);
    const remaining = list.length - visible.length;
    return (
        <div className={BADGE_ROW}>
            {visible.map((item, i) => (
                <Badge key={i} variant="outline">
                    {String(item)}
                </Badge>
            ))}
            {remaining > 0 && <Badge variant="secondary">+{remaining}</Badge>}
        </div>
    );
}

type CurrencyAmount = {value?: number; currency?: {abbreviation?: string; symbol?: string; name?: string}};

/**
 * `valueType: "currencyList"` — `[{value, currency}]` (or one such object) as
 * "EUR 10 and $ 5"; `widgetProps.andKey` overrides the joiner key.
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
                const currency = item.currency;
                const currencyName = currency?.abbreviation ?? currency?.symbol ?? currency?.name ?? "";
                const isLastOfMany = list.length > 1 && i === list.length - 1;
                return (
                    <div className="flex items-center gap-x-0.5" key={i}>
                        {isLastOfMany && <span> {resolveLanguageKey(andKey)} </span>}
                        <p>{String(currencyName)}</p>
                        <p>{formatNumber(item.value ?? 0)}</p>
                    </div>
                );
            })}
        </div>
    );
}
