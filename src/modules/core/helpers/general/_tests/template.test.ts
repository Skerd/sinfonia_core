import {describe, expect, it} from "vitest";
import {fillTemplate} from "@coreModule/helpers/general/template.ts";

describe("fillTemplate", () => {
    it("fills every placeholder that has a value, numbers included", () => {
        expect(fillTemplate("Unit {unit}: {percent}% ({unit})", {unit: "A-1", percent: 40})).toBe("Unit A-1: 40% (A-1)");
    });

    it("keeps a placeholder without a value as written", () => {
        expect(fillTemplate("Hello {name}", {})).toBe("Hello {name}");
    });
});
