import {describe, expect, it} from "vitest";
import {safeNextPath} from "../safeNextPath.ts";

describe("safeNextPath", () => {
    it("returns a same-site path", () => {
        expect(safeNextPath("?next=%2Faccount%2Forders", "/home")).toBe("/account/orders");
    });

    it.each(["", "?next=", "?next=https%3A%2F%2Fevil.example", "?next=%2F%2Fevil.example", "?next=%2F%5Cevil.example", "?next=account"])(
        "falls back for %j",
        (search) => {
            expect(safeNextPath(search, "/home")).toBe("/home");
        },
    );
});
