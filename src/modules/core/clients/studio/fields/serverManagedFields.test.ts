import {describe, expect, it} from "vitest";
import {
    isServerManaged,
    LIFECYCLE_FIELDS,
    OWNERSHIP_FIELDS,
    SOFT_DELETE_FIELDS,
    withoutServerManaged,
} from "./serverManagedFields.ts";

describe("isServerManaged", () => {
    it("covers every field the three plugins add", () => {
        for (const path of [...LIFECYCLE_FIELDS, ...SOFT_DELETE_FIELDS, ...OWNERSHIP_FIELDS]) {
            expect(isServerManaged(path)).toBe(true);
        }
    });

    it("takes the subtree with the root", () => {
        expect(isServerManaged("createdBy.name")).toBe(true);
        expect(isServerManaged("company.address.city")).toBe(true);
    });

    it("leaves a model's own fields alone", () => {
        expect(isServerManaged("name")).toBe(false);
        expect(isServerManaged("createdAtSomething")).toBe(false);
        expect(isServerManaged("order.createdAt")).toBe(false);
    });
});

describe("withoutServerManaged", () => {
    it("keeps order and drops only the managed paths", () => {
        expect(
            withoutServerManaged(["name", "createdAt", "address.city", "createdBy", "price"]),
        ).toEqual(["name", "address.city", "price"]);
    });
});
