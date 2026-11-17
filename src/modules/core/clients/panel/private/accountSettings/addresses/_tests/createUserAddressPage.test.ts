import {describe, expect, it, vi} from "vitest";

// The page hands its config to the core create-page factory; capture it.
const page = vi.hoisted(() => ({config: {} as {successPath?: string | number}}));
vi.mock("@coreModule/components/entityPage/pages/createGenericCreatePage.tsx", () => ({
    createGenericCreatePage: (config: {successPath?: string | number}) => {
        page.config = config;
        return () => null;
    },
}));

await import("../createUserAddress.tsx");

// TD-F129: after a save the page went back in history, so a create page opened by link landed on whatever came before.
describe("create address page", () => {
    it("returns to the address book after saving", () => {
        expect(page.config.successPath).toBe("/account/addresses");
    });
});
