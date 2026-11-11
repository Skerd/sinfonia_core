import {describe, expect, it, vi} from "vitest";
import {render} from "@testing-library/react";

vi.mock("@coreModule/components/viewEngine/widgets/display/displayCard.tsx", async () => ({
    default: (await import("./harness.tsx")).makeProbe("#DisplayCard"),
}));

const {ReferenceStubCompactRow} = await import("../sheet/widgets/references/referenceStubCompactRow.tsx");
const {lastProps} = await import("./harness.tsx");
const {formatCurrency} = await import("@coreModule/helpers/general/numbers.ts");
const {DATE_FORMATS, formatDate} = await import("@coreModule/helpers/general/dateTime.ts");

const t = ((key: string) => ({"status.sent": "Sent", "wanted.crown": "Crown", "wanted.veneer": "Veneer", rows: "Rows"} as Record<string, string>)[key] ?? key) as never;
const row = (stub: Record<string, unknown>, config: Record<string, unknown>) => render(
    <ReferenceStubCompactRow stub={{_id: "1", ...stub}} config={{label: "rows", valuePath: [], linkedSheetModel: "m", linkedSheetWidget: "#None", linkedSheetEntityProp: "x", ...config}} unitId="" unitName="" resolveLanguageKey={t} show />,
);

describe("a compact reference row", () => {
    it("titles the row from the record and formats money, dates and translated lists", () => {
        row(
            {sentAt: "2026-11-10T10:00:00.000Z", total: 1800, currency: {abbreviation: "EUR"}, status: "sent", wanted: ["crown", "veneer"]},
            {
                labelPath: "sentAt",
                labelFormat: "date",
                valuePath: ["wanted", "total", "status"],
                valueFormats: [null, {money: "currency"}, null],
                valueLanguageKeyCategories: ["wanted", null, "status"],
                joinSeparator: " · ",
            },
        );
        expect(lastProps("#DisplayCard").title).toBe(formatDate("2026-11-10T10:00:00.000Z", {format: DATE_FORMATS.mediumDate}));
        expect(lastProps("#DisplayCard").value).toBe(`Crown, Veneer · ${formatCurrency(1800, "EUR")} · Sent`);
    });

    it("titles a range from two values, arrival → departure", () => {
        row({from: "2026-12-01T13:30:00.000Z", to: "2026-12-06T09:15:00.000Z"}, {labelPath: ["from", "to"], labelFormat: "date", valuePath: []});
        const day = (iso: string) => formatDate(iso, {format: DATE_FORMATS.mediumDate});
        expect(lastProps("#DisplayCard").title).toBe(`${day("2026-12-01T13:30:00.000Z")} → ${day("2026-12-06T09:15:00.000Z")}`);
    });

    it("keeps the fixed label when the record has no title value", () => {
        row({}, {labelPath: "missing", valuePath: ["status"]});
        expect(lastProps("#DisplayCard").title).toBe("Rows");
    });
});
