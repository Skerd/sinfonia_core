import {describe, expect, it} from "vitest";
import {
    createLanguageFragmentMerger,
    deepMergeDictionaries,
    isDictionary,
} from "@coreModule/helpers/moduleContributions/languageFragments.ts";

const file = (pkg: string, locale: string, name = "menus.json") => `/src/modules/${pkg}/assets/languages/${locale}/${name}`;
const merger = (glob: Record<string, unknown>, fallbackLocales = ["en-US"]) =>
    createLanguageFragmentMerger({fileName: "menus.json", glob, fallbackLocales});

describe("isDictionary", () => {
    it("accepts objects only", () => {
        expect(isDictionary({})).toBe(true);
        for (const value of [null, undefined, [], "x", 3]) {
            expect(isDictionary(value)).toBe(false);
        }
    });
});

describe("deepMergeDictionaries", () => {
    it("merges nested dictionaries, source winning on conflicts", () => {
        expect(deepMergeDictionaries(
            {a: {b: 1, c: 1}, keep: "core"},
            {a: {c: 2, d: 2}, add: "module"},
        )).toEqual({a: {b: 1, c: 2, d: 2}, keep: "core", add: "module"});
    });

    it("replaces arrays instead of merging them", () => {
        expect(deepMergeDictionaries({list: [1, 2, 3]}, {list: [9]})).toEqual({list: [9]});
    });

    it("lets a scalar replace a dictionary and vice versa", () => {
        expect(deepMergeDictionaries({a: {b: 1}, c: "text"}, {a: "flat", c: {d: 1}})).toEqual({a: "flat", c: {d: 1}});
    });

    it("keeps null and empty-string values from the source", () => {
        expect(deepMergeDictionaries({a: "x", b: "y"}, {a: null, b: ""})).toEqual({a: null, b: ""});
    });

    it("mutates neither input", () => {
        const target = {a: {b: 1}};
        const source = {a: {c: 2}};
        deepMergeDictionaries(target, source);
        expect(target).toEqual({a: {b: 1}});
        expect(source).toEqual({a: {c: 2}});
    });

    it("never aliases the source", () => {
        const source = {fresh: {deep: {value: 1}}, list: [{x: 1}]};
        const out = deepMergeDictionaries({}, source);
        expect(out.fresh).not.toBe(source.fresh);
        expect((out.fresh as {deep: unknown}).deep).not.toBe(source.fresh.deep);
        expect((out.list as unknown[])[0]).not.toBe(source.list[0]);
        expect(out).toEqual(source);
    });

    it("ignores `__proto__` keys and leaves Object.prototype alone", () => {
        const source = JSON.parse('{"__proto__": {"polluted": true}, "nested": {"__proto__": {"polluted": true}}}');
        const out = deepMergeDictionaries({}, source);
        expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
        expect(Object.hasOwn(out, "__proto__")).toBe(false);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect((out.nested as Record<string, unknown>).polluted).toBeUndefined();
    });

    it("keeps harmless keys like `constructor` as data", () => {
        expect(deepMergeDictionaries({}, {constructor: "Builder"})).toEqual({constructor: "Builder"});
    });
});

describe("createLanguageFragmentMerger", () => {
    it("merges every non-core module for the locale", () => {
        const getMerged = merger({
            [file("finance", "de-CH")]: {finance: {title: "Finanzen"}},
            [file("shop", "de-CH")]: {shop: {title: "Laden"}},
            [file("core", "de-CH")]: {core: {title: "Kern"}},
        });
        expect(getMerged("de-CH")).toEqual({finance: {title: "Finanzen"}, shop: {title: "Laden"}});
    });

    it("skips only the `core` package, not packages whose name starts with core", () => {
        const getMerged = merger({[file("coreExtras", "en-US")]: {extra: 1}});
        expect(getMerged("en-US")).toEqual({extra: 1});
    });

    it("ignores other files, unrelated paths and non-dictionary JSON", () => {
        const getMerged = merger({
            [file("a", "en-US", "rolesPermissions.json")]: {wrong: 1},
            [file("b", "en-US", "nested/menus.json")]: {wrong: 2},
            "/src/other/menus.json": {wrong: 3},
            [file("c", "en-US")]: ["array"],
            [file("d", "en-US")]: "text",
            [file("e", "en-US")]: null,
        });
        expect(getMerged("en-US")).toEqual({});
    });

    it("normalizes Windows separators", () => {
        const getMerged = merger({"C:\\app\\src\\modules\\shop\\assets\\languages\\en-US\\menus.json": {shop: 1}});
        expect(getMerged("en-US")).toEqual({shop: 1});
    });

    it("fills keys a module lacks in the requested locale from the fallbacks, per key", () => {
        const getMerged = merger({
            [file("finance", "en-US")]: {finance: {title: "Finance", invoices: "Invoices"}},
            [file("finance", "fr-FR")]: {finance: {title: "Finances"}},
            [file("shop", "en-US")]: {shop: {title: "Shop"}},
        });
        expect(getMerged("fr-FR")).toEqual({
            finance: {title: "Finances", invoices: "Invoices"},
            shop: {title: "Shop"},
        });
    });

    it("uses the configured default before en-US", () => {
        const getMerged = merger({
            [file("shop", "en-US")]: {title: "Shop", only: "en"},
            [file("shop", "de-CH")]: {title: "Laden"},
        }, ["de-CH", "en-US"]);
        expect(getMerged("it-IT")).toEqual({title: "Laden", only: "en"});
    });

    it("lets a requested-locale value beat another module's fallback value", () => {
        const getMerged = merger({
            [file("aaa", "fr-FR")]: {shared: "français"},
            [file("zzz", "en-US")]: {shared: "english"},
        });
        expect(getMerged("fr-FR")).toEqual({shared: "français"});
    });

    it("lets later modules (by name) win within one locale", () => {
        const getMerged = merger({
            [file("zzz", "en-US")]: {shared: "z"},
            [file("aaa", "en-US")]: {shared: "a"},
        });
        expect(getMerged("en-US")).toEqual({shared: "z"});
    });

    it("returns an empty dictionary when nothing matches", () => {
        expect(merger({})("xx-XX")).toEqual({});
        expect(merger({[file("shop", "de-CH")]: {a: 1}})("fr-FR")).toEqual({});
    });

    it("caches per locale and freezes the result deeply", () => {
        const getMerged = merger({[file("shop", "en-US")]: {shop: {title: "Shop"}}});
        const first = getMerged("en-US");
        expect(getMerged("en-US")).toBe(first);
        expect(getMerged("fr-FR")).not.toBe(first);
        expect(Object.isFrozen(first)).toBe(true);
        expect(Object.isFrozen(first.shop)).toBe(true);
    });

    it("does not freeze or alias the source JSON", () => {
        const source = {shop: {title: "Shop"}};
        const merged = merger({[file("shop", "en-US")]: source})("en-US");
        expect(merged.shop).not.toBe(source.shop);
        expect(Object.isFrozen(source.shop)).toBe(false);
    });
});
