import {describe, expect, it} from "vitest";
import {
    applyDebugStateOverrides,
    clearKindOverrides,
    countDebugSources,
    countPerspectiveOverrides,
    countResourceOverrides,
    isAccessGranted,
    normalizeDebugResourceIds,
    perspectiveHasOverrides,
    resolveDebugResourceIds,
    setAllFieldOverrides,
    setFieldOverride,
    setMasterOverride,
    updatePerspectiveOverride,
} from "@baseModule/helpers/general/withDebugHelpers.ts";

/** Server field map shaped like `accessFieldPathExists` expects: nested maps live under `keys`. */
const BASE_READ = {
    name: true,
    country: {keys: {name: true, code: true}},
    secret: false,
};

describe("normalizeDebugResourceIds", () => {
    it("returns an empty list when nothing is passed", () => {
        expect(normalizeDebugResourceIds()).toEqual([]);
        expect(normalizeDebugResourceIds("")).toEqual([]);
    });

    it("lower-cases, trims, de-duplicates and drops blanks", () => {
        expect(normalizeDebugResourceIds(" Cities ")).toEqual(["cities"]);
        expect(normalizeDebugResourceIds(["Users", "users", "  ", "Orders"])).toEqual(["users", "orders"]);
    });
});

describe("resolveDebugResourceIds", () => {
    it("uses an explicit id or list", () => {
        expect(resolveDebugResourceIds("Countries", {})).toEqual(["countries"]);
        expect(resolveDebugResourceIds(["Users", "users", "orders"], {})).toEqual(["users", "orders"]);
    });

    it("calls a resolver with the render's props, so shared components name their own resource", () => {
        const byProp = (props: Record<string, any>) => props.access;

        expect(resolveDebugResourceIds(byProp, {access: "Countries"})).toEqual(["countries"]);
        expect(resolveDebugResourceIds(byProp, {access: "units"})).toEqual(["units"]);
    });

    it("falls back to the conventional resource prop when nothing was passed", () => {
        expect(resolveDebugResourceIds(undefined, {access: "countries"})).toEqual(["countries"]);
        expect(resolveDebugResourceIds(undefined, {accessModel: "units"})).toEqual(["units"]);
        expect(resolveDebugResourceIds(undefined, {resource: "leads"})).toEqual(["leads"]);
        expect(resolveDebugResourceIds(undefined, {resourceId: "sales"})).toEqual(["sales"]);
    });

    it("prefers `access` over the later conventions", () => {
        expect(resolveDebugResourceIds(undefined, {access: "countries", resource: "leads"})).toEqual(["countries"]);
    });

    it("returns nothing when no id can be found", () => {
        expect(resolveDebugResourceIds(undefined, {})).toEqual([]);
        expect(resolveDebugResourceIds(undefined, {access: "   "})).toEqual([]);
        expect(resolveDebugResourceIds(() => undefined, {access: "countries"})).toEqual([]);
    });
});

describe("isAccessGranted", () => {
    it("treats `true` and non-empty field maps as granted", () => {
        expect(isAccessGranted(true)).toBe(true);
        expect(isAccessGranted({name: true})).toBe(true);
    });

    it("treats false, nullish and empty maps as denied", () => {
        expect(isAccessGranted(false)).toBe(false);
        expect(isAccessGranted(null)).toBe(false);
        expect(isAccessGranted(undefined)).toBe(false);
        expect(isAccessGranted({})).toBe(false);
    });
});

describe("counting overrides", () => {
    it("reports whether a perspective carries anything", () => {
        expect(perspectiveHasOverrides()).toBe(false);
        expect(perspectiveHasOverrides({})).toBe(false);
        expect(perspectiveHasOverrides({readFields: {}})).toBe(false);
        expect(perspectiveHasOverrides({create: false})).toBe(true);
        expect(perspectiveHasOverrides({readFields: {name: false}})).toBe(true);
    });

    it("counts each flag and each field path", () => {
        expect(countPerspectiveOverrides()).toBe(0);
        expect(
            countPerspectiveOverrides({
                create: true,
                read: false,
                readFields: {name: false, "country.name": false},
            }),
        ).toBe(4);
    });

    it("sums both perspectives across resources", () => {
        expect(
            countResourceOverrides({
                cities: {self: {create: true}, others: {delete: false}},
                users: {self: {readFields: {name: false}}},
            }),
        ).toBe(3);
    });
});

describe("updatePerspectiveOverride", () => {
    it("adds an override without touching other resources", () => {
        const next = updatePerspectiveOverride({users: {self: {create: true}}}, "cities", "self", (current) => ({
            ...current,
            delete: false,
        }));

        expect(next).toEqual({users: {self: {create: true}}, cities: {self: {delete: false}}});
    });

    it("prunes an emptied perspective, and the resource once its last perspective goes", () => {
        const start = {cities: {self: {create: true}, others: {delete: false}}};

        const withoutSelf = updatePerspectiveOverride(start, "cities", "self", () => ({}));
        expect(withoutSelf).toEqual({cities: {others: {delete: false}}});

        expect(updatePerspectiveOverride(withoutSelf, "cities", "others", () => ({}))).toEqual({});
    });

    it("drops field maps that a mutation emptied, so they never read as an override", () => {
        const next = updatePerspectiveOverride({}, "cities", "self", () => ({readFields: {}, create: true}));

        expect(next).toEqual({cities: {self: {create: true}}});
    });

    it("does not mutate the map it was given", () => {
        const start = {cities: {self: {create: true}}};
        updatePerspectiveOverride(start, "cities", "self", (current) => ({...current, delete: false}));

        expect(start).toEqual({cities: {self: {create: true}}});
    });
});

describe("setMasterOverride", () => {
    it("records an override that differs from the server", () => {
        expect(setMasterOverride({}, "read", false, BASE_READ)).toEqual({read: false});
    });

    it("clears the override when it would restate what the server already says", () => {
        expect(setMasterOverride({read: false}, "read", true, BASE_READ)).toEqual({});
        expect(setMasterOverride({read: true}, "read", false, {})).toEqual({});
    });
});

describe("setFieldOverride", () => {
    it("denies a field the server granted, and clears the master switch it replaces", () => {
        expect(setFieldOverride({read: false}, "read", "name", false, BASE_READ)).toEqual({
            readFields: {name: false},
        });
    });

    it("removes the entry when a field is set back to the server's own value", () => {
        expect(setFieldOverride({readFields: {name: false}}, "read", "name", true, BASE_READ)).toEqual({});
    });

    it("drops descendants when a parent is denied, since the parent already hides them", () => {
        const current = {readFields: {"country.name": false, "country.code": false, name: false}};

        expect(setFieldOverride(current, "read", "country", false, BASE_READ)).toEqual({
            readFields: {name: false, country: false},
        });
    });

    it("clears a denied ancestor when a child is granted, so the child is actually reachable", () => {
        const current = {readFields: {country: false}};

        expect(setFieldOverride(current, "read", "country.name", true, BASE_READ)).toEqual({});
    });

    it("writes into the map matching the kind", () => {
        expect(setFieldOverride({}, "write", "name", false, BASE_READ)).toEqual({writeFields: {name: false}});
    });
});

describe("setAllFieldOverrides", () => {
    it("denies every known path", () => {
        expect(setAllFieldOverrides({}, "read", ["name", "country.name"], false)).toEqual({
            readFields: {name: false, "country.name": false},
        });
    });

    it("clears the field map when everything is turned back on", () => {
        expect(setAllFieldOverrides({readFields: {name: false}, read: false}, "read", ["name"], true)).toEqual({});
    });
});

describe("clearKindOverrides", () => {
    it("drops the master switch and field map for one kind, leaving the other alone", () => {
        const current = {read: false, readFields: {name: false}, write: true, writeFields: {name: false}};

        expect(clearKindOverrides(current, "read")).toEqual({write: true, writeFields: {name: false}});
    });
});

describe("countDebugSources", () => {
    it("counts only the HOC metadata props that were injected", () => {
        expect(countDebugSources({})).toBe(0);
        expect(countDebugSources({withLanguage: {path: "x"}, withAxios: {httpRequest: {}}})).toBe(2);
        expect(countDebugSources({withLanguage: undefined, somethingElse: true})).toBe(0);
    });
});

describe("applyDebugStateOverrides", () => {
    const off = {testLoading: false, testError: false, testEmptyData: false};

    it("passes the real props through when nothing is toggled", () => {
        expect(applyDebugStateOverrides({loading: false, error: false, data: {a: 1}}, off)).toEqual({
            loading: false,
            error: false,
            data: {a: 1},
        });
    });

    it("forces each state on when toggled", () => {
        expect(
            applyDebugStateOverrides({loading: false, error: false, data: {a: 1}}, {
                testLoading: true,
                testError: true,
                testEmptyData: true,
            }),
        ).toEqual({loading: true, error: true, data: null});
    });

    it("never turns off a state the component is really in", () => {
        expect(applyDebugStateOverrides({loading: true, error: "boom", data: null}, off)).toEqual({
            loading: true,
            error: "boom",
            data: null,
        });
    });
});
