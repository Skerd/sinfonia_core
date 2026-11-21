import {render, screen, act} from "@testing-library/react";
import {useEffect, type ReactNode} from "react";
import {FormProvider, useForm, type UseFormReturn} from "react-hook-form";
import {describe, expect, it, vi} from "vitest";
import {formatNumber} from "@coreModule/helpers/general/numbers.ts";

const requests: {url: string; body: unknown}[] = [];
const records: Record<string, Record<string, unknown>> = {
    "/api/finance/currency/single:chf": {_id: "chf", symbol: "CHF", decimalPlaces: 2},
    "/api/things/single:t1": {_id: "t1", currency: {_id: "jpy", symbol: "¥", decimalPlaces: 0}},
};
/** Answers each request from `records` once its count moves, as the real hook does. */
function useHttpRequestMock(request: {url: string}, body: {_id: string}, count: number, _inView: boolean, lifecycle: {success?: (r: unknown) => void}) {
    useEffect(() => {
        if (count === 0) return;
        requests.push({url: request.url, body});
        const record = records[`${request.url}:${body._id}`];
        if (record) lifecycle.success?.(record);
    }, [count]); // eslint-disable-line react-hooks/exhaustive-deps
    return {loading: false};
}
vi.mock("@coreModule/helpers/hooks/useHttpRequest.ts", () => ({default: useHttpRequestMock}));
vi.mock("@coreModule/helpers/hooks/useSelectedLanguage.ts", () => ({default: () => ({currentLanguage: {total: "Total"}}), warmComponentLanguage: () => undefined}));

const {formTotalValue} = await import("../totalValue.ts");
const {FormTotal} = await import("../total.tsx");

const money = (n: number, decimals: number) => formatNumber(n, {minimumFractionDigits: decimals, maximumFractionDigits: decimals});

describe("formTotalValue (TD-F74)", () => {
    const values = (v: Record<string, unknown>) => (field: string) => v[field];

    it("multiplies the amount by its factor at the currency's decimals, like the server's line totals", () => {
        expect(formTotalValue({multiply: ["unitPrice", "quantity"]}, values({unitPrice: 19.9, quantity: 3}))).toBe(59.7);
        // The price is taken at the currency's precision first (0.125 → 0.13), as `multiplyMoney` does on the server.
        expect(formTotalValue({multiply: ["unitPrice", "quantity"]}, values({unitPrice: "0.125", quantity: 3}), 2)).toBe(0.39);
        expect(formTotalValue({multiply: ["unitPrice", "quantity"]}, values({unitPrice: 10, quantity: 0.333}), 2)).toBe(3.33);
        expect(formTotalValue({multiply: ["unitPrice", "quantity"]}, values({unitPrice: 1234.5, quantity: 1}), 0)).toBe(1235);
    });

    it("adds amounts exactly", () => {
        expect(formTotalValue({add: ["net", "vat"]}, values({net: 0.1, vat: 0.2}))).toBe(0.3);
    });

    it("gives nothing until every operand is typed, as the server keeps a typed figure then", () => {
        expect(formTotalValue({multiply: ["unitPrice", "quantity"]}, values({unitPrice: 5}))).toBeUndefined();
        expect(formTotalValue({add: ["net", "vat"]}, values({net: 10, vat: ""}))).toBeUndefined();
        expect(formTotalValue({add: ["net", "vat"]}, values({net: "1e", vat: 2}))).toBeUndefined();
        expect(formTotalValue({}, values({}))).toBeUndefined();
    });
});

let form: UseFormReturn | undefined;
function Host({values, children}: {values: Record<string, unknown>; children: ReactNode}) {
    const methods = useForm({defaultValues: values});
    form = methods;
    return <FormProvider {...methods}>{children}</FormProvider>;
}

describe("#FormTotal", () => {
    it("shows net + VAT in the picked currency and follows typing", async () => {
        render(
            <Host values={{currency: "chf", netAmount: 100, vatAmount: 8.1}}>
                <FormTotal label="Gross" add={["netAmount", "vatAmount"]} currencyFrom={{field: "currency", url: "/api/finance/currency/single"}} />
            </Host>,
        );
        expect(await screen.findByText(`CHF ${money(108.1, 2)}`)).toBeInTheDocument();
        expect(screen.getByText("Gross")).toBeInTheDocument();

        await act(async () => form?.setValue("vatAmount", 20));
        expect(await screen.findByText(`CHF ${money(120, 2)}`)).toBeInTheDocument();

        await act(async () => form?.setValue("vatAmount", null));
        expect(screen.queryByText(/CHF/)).toBeNull();
    });

    it("reads the currency of a parent record and rounds at its decimals", async () => {
        render(
            <Host values={{thing: {_id: "t1", name: "Parent"}, unitPrice: 12.5, quantity: 3}}>
                <FormTotal multiply={["unitPrice", "quantity"]} currencyFrom={{field: "thing", url: "/api/things/single", path: "currency"}} />
            </Host>,
        );
        // The unit price is rounded to the currency first (12.5 → 13), then multiplied, as the server does.
        expect(await screen.findByText(`¥ ${money(39, 0)}`)).toBeInTheDocument();
        expect(screen.getByText("Total")).toBeInTheDocument();
        expect(requests.at(-1)).toEqual({url: "/api/things/single", body: {_id: "t1"}});
    });

    it("takes the currency of the first source that has a value", async () => {
        render(
            <Host values={{thing: "t1", currency: "chf", netAmount: 1000, vatAmount: 1}}>
                <FormTotal
                    add={["netAmount", "vatAmount"]}
                    currencyFrom={[{field: "thing", url: "/api/things/single", path: "currency"}, {field: "currency", url: "/api/finance/currency/single"}]}
                />
            </Host>,
        );
        expect(await screen.findByText(`¥ ${money(1001, 0)}`)).toBeInTheDocument();
        await act(async () => form?.setValue("thing", ""));
        expect(await screen.findByText(`CHF ${money(1001, 2)}`)).toBeInTheDocument();
    });

    it("shows nothing before the record with the currency is picked", () => {
        const {container} = render(
            <Host values={{unitPrice: 12.5, quantity: 3}}>
                <FormTotal multiply={["unitPrice", "quantity"]} currencyFrom={{field: "thing", url: "/api/things/single", path: "currency"}} />
            </Host>,
        );
        expect(container.textContent).toBe("");
    });
});
