import {describe, expect, it, vi} from "vitest";

vi.mock("@coreModule/clients/panel/moduleContributions/loadSiteRoomContributions.ts", () => ({
    getContributedSystemSettingsRooms: () => ({taxRates: "taxRates_configurations", roles: "module_roles", broken: "not a room"}),
    getContributedPathRoomOverrides: () => ({"eCommerce/bookings": "bookingsRoom", "company/users": "moduleUsers", "sales/bad": "1bad"}),
}));

import {resolveSiteRoomFromPath, SITE_ROOM_ID_PATTERN} from "@baseModule/helpers/websocket/resolveSiteRoom.ts";

describe("resolveSiteRoomFromPath", () => {
    it.each(["/", "", "/home", "/home/anything"])("joins `home` for %j", (path) => {
        expect(resolveSiteRoomFromPath(path)).toBe("home");
    });

    it("uses core path overrides", () => {
        expect(resolveSiteRoomFromPath("/company/info")).toBe("company");
        expect(resolveSiteRoomFromPath("/account/apps/extra")).toBe("connectedApps");
    });

    it("lets contributed path overrides add and replace entries", () => {
        expect(resolveSiteRoomFromPath("/eCommerce/bookings")).toBe("bookingsRoom");
        expect(resolveSiteRoomFromPath("/company/users")).toBe("moduleUsers");
    });

    it("resolves systemSettings resources, contributions winning", () => {
        expect(resolveSiteRoomFromPath("/tenancy/systemSettings/countries")).toBe("country_configurations");
        expect(resolveSiteRoomFromPath("/tenancy/systemSettings/taxRates/5")).toBe("taxRates_configurations");
        expect(resolveSiteRoomFromPath("/tenancy/systemSettings/roles")).toBe("module_roles");
    });

    it.each(["/tenancy/systemSettings", "/tenancy/systemSettings/unknown", "/tenancy/systemSettings/broken"])(
        "falls back to `activity` for %j",
        (path) => {
            expect(resolveSiteRoomFromPath(path)).toBe("activity");
        },
    );

    it("uses the subview slug, else the menu", () => {
        expect(resolveSiteRoomFromPath("/stock/items/42")).toBe("items");
        expect(resolveSiteRoomFromPath("/sales")).toBe("sales");
    });

    it("rejects invalid room ids, including from overrides", () => {
        expect(resolveSiteRoomFromPath("/sales/bad")).toBeNull();
        expect(resolveSiteRoomFromPath("/sales/9lives")).toBeNull();
        expect(resolveSiteRoomFromPath("/sales/some-thing")).toBeNull();
        expect(resolveSiteRoomFromPath(`/sales/${"a".repeat(65)}`)).toBeNull();
    });

    it.each(["/toString", "/company/constructor", "/tenancy/systemSettings/__proto__", "/constructor"])(
        "never resolves to an inherited object property for %j",
        (path) => {
            const room = resolveSiteRoomFromPath(path);
            expect(room === null || SITE_ROOM_ID_PATTERN.test(room)).toBe(true);
            expect(typeof room === "string" || room === null).toBe(true);
        },
    );
});
