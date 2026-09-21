import {afterEach, describe, expect, it, vi} from "vitest";
import {createSiteRoomContributions} from "@coreModule/helpers/moduleContributions/loadSiteRoomContributions.ts";

const path = (pkg: string) => `/src/modules/${pkg}/clients/panel/siteRoomContribution.ts`;

afterEach(() => {
    vi.restoreAllMocks();
});

describe("createSiteRoomContributions", () => {
    it("merges both maps in order, later contributions winning", () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        const rooms = createSiteRoomContributions({
            [path("late")]: {default: {id: "late", order: 50, systemSettingsRooms: {shared: "late_room", own: "own_room"}}},
            [path("early")]: {default: {
                id: "early",
                order: 10,
                systemSettingsRooms: {shared: "early_room"},
                pathRoomOverrides: {"shop/orders": "ordersRoom"},
            }},
        });
        expect({...rooms.getSystemSettingsRooms()}).toEqual({shared: "late_room", own: "own_room"});
        expect({...rooms.getPathRoomOverrides()}).toEqual({"shop/orders": "ordersRoom"});
    });

    it("works when a contribution omits either map", () => {
        const rooms = createSiteRoomContributions({
            [path("a")]: {default: {id: "only-paths", pathRoomOverrides: {a: "a"}}},
            [path("b")]: {default: {id: "nothing"}},
        });
        expect({...rooms.getSystemSettingsRooms()}).toEqual({});
        expect({...rooms.getPathRoomOverrides()}).toEqual({a: "a"});
    });

    it("returns empty maps for an empty glob", () => {
        const rooms = createSiteRoomContributions({});
        expect(Object.keys(rooms.getSystemSettingsRooms())).toEqual([]);
        expect(Object.keys(rooms.getPathRoomOverrides())).toEqual([]);
    });

    it("never exposes inherited names", () => {
        const rooms = createSiteRoomContributions({[path("a")]: {default: {systemSettingsRooms: {a: "a"}}}});
        expect(rooms.getSystemSettingsRooms().constructor).toBeUndefined();
        expect(rooms.getPathRoomOverrides().toString).toBeUndefined();
    });

    it("memoizes each map and parses the glob once for both", () => {
        const getDefault = vi.fn(() => ({systemSettingsRooms: {a: "a"}, pathRoomOverrides: {b: "b"}}));
        const mod = {get default() {
            return getDefault();
        }};
        const rooms = createSiteRoomContributions({[path("a")]: mod});

        const settings = rooms.getSystemSettingsRooms();
        const paths = rooms.getPathRoomOverrides();
        expect(rooms.getSystemSettingsRooms()).toBe(settings);
        expect(rooms.getPathRoomOverrides()).toBe(paths);
        expect(getDefault).toHaveBeenCalledTimes(1);
    });

    it.each([
        ["a non-string room", {systemSettingsRooms: {a: 1}}],
        ["an array map", {pathRoomOverrides: ["a"]}],
        ["a null map", {systemSettingsRooms: null}],
    ])("rejects %s", (_label, entry) => {
        const rooms = createSiteRoomContributions({[path("bad")]: {default: entry}});
        expect(() => rooms.getSystemSettingsRooms()).toThrow("[siteRoomContribution] Invalid default export");
    });
});
