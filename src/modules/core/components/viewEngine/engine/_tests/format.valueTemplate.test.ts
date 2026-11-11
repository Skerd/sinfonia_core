import {describe, expect, it} from "vitest";
import {applyValueTemplate} from "../format.ts";

const keys: Record<string, string> = {
    "deliveryDaysValue.one": "{value} day",
    "deliveryDaysValue.other": "{value} days",
    "seatsValue": "{value} seats",
};
const t = (key: string) => keys[key];

describe("display card value template (TD-F62)", () => {
    it("reads a number with its unit in the language's plural form", () => {
        expect(applyValueTemplate(t, "deliveryDaysValue", 1, "en-US")).toBe("1 day");
        expect(applyValueTemplate(t, "deliveryDaysValue", 5, "en-US")).toBe("5 days");
        expect(applyValueTemplate(t, "deliveryDaysValue", "5", "en-US")).toBe("5 days");
    });

    it("uses the plain key when there are no plural forms, and the value alone when there is no template", () => {
        expect(applyValueTemplate(t, "seatsValue", 4, "en-US")).toBe("4 seats");
        expect(applyValueTemplate(t, "missingValue", 4, "en-US")).toBe("4");
    });
});
