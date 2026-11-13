import {DEFAULT_DECIMAL_PLACES, multiplyMoney, sumMoney} from "armonia/src/modules/core/helpers/money.ts";

/** How `#FormTotal` builds its total from other fields of the form. */
export type FormTotalRule = {
    /** `[amountField, factorField]`: amount × factor (unit price × quantity), rounded once like the server's line totals. */
    multiply?: readonly [string, string];
    /** Fields added up exactly (net + VAT). */
    add?: readonly string[];
};

/** A number typed in a field, or undefined while it is empty or half typed. */
function typedNumber(value: unknown): string | undefined {
    if (typeof value !== "number" && typeof value !== "string") return undefined;
    const text = String(value).trim();
    return text !== "" && Number.isFinite(Number(text)) ? text : undefined;
}

/**
 * The total a form will save, by the server's rule (D151): `undefined` until every operand is typed, as the server
 * then keeps a typed figure. Exact at the currency's `decimals` through the core money helper (GLB-08).
 */
export function formTotalValue(
    rule: FormTotalRule,
    valueOf: (field: string) => unknown,
    decimals: number = DEFAULT_DECIMAL_PLACES,
): number | undefined {
    if (rule.multiply) {
        const amount = typedNumber(valueOf(rule.multiply[0]));
        const factor = typedNumber(valueOf(rule.multiply[1]));
        return amount === undefined || factor === undefined ? undefined : multiplyMoney(amount, factor, decimals);
    }
    if (rule.add && rule.add.length > 0) {
        const parts = rule.add.map((field) => typedNumber(valueOf(field)));
        return parts.every((part): part is string => part !== undefined) ? sumMoney(parts, decimals) : undefined;
    }
    return undefined;
}
