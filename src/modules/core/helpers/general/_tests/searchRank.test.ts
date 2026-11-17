import {describe, expect, it} from "vitest";
import {commandItemScore, labelMatchRank, rankByLabel} from "../searchRank.ts";

// TD-F110: "Rol" + Enter picked Status in the filter field picker, and ⌘K "cities" + Enter opened Website chats › Waiting.
describe("search ranking", () => {
    it("ranks the whole label, then its start, then a word's start, then anywhere", () => {
        expect(labelMatchRank("Roles", "roles")).toBeGreaterThan(labelMatchRank("Roles list", "roles"));
        expect(labelMatchRank("Roles list", "roles")).toBeGreaterThan(labelMatchRank("Default roles", "roles"));
        expect(labelMatchRank("Default roles", "roles")).toBeGreaterThan(labelMatchRank("Controles", "roles"));
        expect(labelMatchRank("Status", "rol")).toBe(0);
    });

    it("puts the field named by the text above fields found only through their path", () => {
        const userFields = [
            {label: "Status", value: "roles.status"},
            {label: "Unsuccessful logins", value: "roles.unsuccessfulLogins"},
            {label: "Locked out until", value: "roles.lockedOutUntil"},
            {label: "Last login", value: "roles.lastLogin"},
            {label: "Roles", value: "roles"},
        ];
        const ranked = rankByLabel(userFields, "Rol", (field) => field.label);
        expect(ranked[0].label).toBe("Roles");
        // Ties keep their order.
        expect(ranked.slice(1).map((field) => field.label)).toEqual(["Status", "Unsuccessful logins", "Locked out until", "Last login"]);
    });

    it("scores a palette page by its title, and hides a page that only fuzzily resembles the text", () => {
        const cities = commandItemScore("Cities", "cities", ["Tenancy", "/tenancy/systemSettings/cities"]);
        const waiting = commandItemScore("Waiting", "cities", ["Website chats", "/company/websiteChats/waiting"]);
        expect(cities).toBe(1);
        expect(waiting).toBe(0);
    });

    it("still finds pages by their group or address, below any title match", () => {
        const roles = commandItemScore("Roles", "tenancy", ["Tenancy", "/tenancy/systemSettings/roles"]);
        const tenancyPage = commandItemScore("Tenancy overview", "tenancy", ["Tenancy", "/tenancy"]);
        expect(roles).toBeGreaterThan(0);
        expect(tenancyPage).toBeGreaterThan(roles);
    });
});
