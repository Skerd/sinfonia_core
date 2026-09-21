import {beforeEach, describe, expect, it, vi} from "vitest";
import {CORE_WIDGET_META, type WidgetMeta} from "@coreModule/components/viewEngine/widgetMeta.ts";

/**
 * The registry pulls in every widget component (and a Leaflet map or two), which is far
 * more than these tests need. Mocking it keeps the catalog's own logic under test and
 * lets a case declare exactly which tokens exist.
 */
const registeredTokens = vi.hoisted(() => ({current: [] as string[]}));
const metaByToken = vi.hoisted(() => ({current: {} as Record<string, unknown>}));

vi.mock("@coreModule/components/viewEngine/widgetRegistry.ts", () => ({
    getRegisteredWidgetTokens: () => registeredTokens.current,
    getWidgetMeta: (token: string) => metaByToken.current[token],
}));

const {
    buildPaletteGroups,
    createPaletteNode,
    defaultPropsFor,
    isContainerToken,
    isFieldToken,
    tokenSupportsMode,
} = await import("./widgetCatalog.ts");

function registry(tokens: string[], meta: Record<string, WidgetMeta> = CORE_WIDGET_META) {
    registeredTokens.current = tokens;
    metaByToken.current = meta;
}

beforeEach(() => {
    registry([]);
});

describe("mode support", () => {
    it("reads the described mode", () => {
        registry(["#DisplayCard", "#Input"]);
        expect(tokenSupportsMode("#DisplayCard", "sheet")).toBe(true);
        expect(tokenSupportsMode("#DisplayCard", "form")).toBe(false);
        expect(tokenSupportsMode("#Input", "form")).toBe(true);
        expect(tokenSupportsMode("#Input", "sheet")).toBe(false);
    });

    it("offers undescribed tokens everywhere rather than hiding them", () => {
        registry(["#SomeModuleWidget"], {});
        expect(tokenSupportsMode("#SomeModuleWidget", "sheet")).toBe(true);
        expect(tokenSupportsMode("#SomeModuleWidget", "form")).toBe(true);
    });

    it("treats plain HTML tags as available in both modes", () => {
        expect(tokenSupportsMode("div", "sheet")).toBe(true);
        expect(tokenSupportsMode("div", "form")).toBe(true);
    });
});

describe("container and field predicates", () => {
    it("derives container-ness from metadata", () => {
        expect(isContainerToken("#SheetGroup")).toBe(true);
        expect(isContainerToken("#DisplayCard")).toBe(false);
        expect(isContainerToken("div")).toBe(true);
    });

    it("falls back to the hard-coded set for undescribed tokens", () => {
        registry(["#SheetGroup"], {});
        expect(isContainerToken("#SheetGroup")).toBe(true);
        expect(isContainerToken("#Unknown")).toBe(false);
    });

    it("separates field widgets from chrome", () => {
        expect(isFieldToken("#DisplayCard")).toBe(true);
        expect(isFieldToken("#Input")).toBe(true);
        expect(isFieldToken("#FormAlert")).toBe(false);
        expect(isFieldToken("#ReferencesViewModeToggle")).toBe(false);
        expect(isFieldToken("#SheetGroup")).toBe(false);
    });
});

describe("defaultPropsFor", () => {
    it("seeds documented defaults", () => {
        expect(defaultPropsFor("#SheetGrid")).toEqual({columns: 3});
        expect(defaultPropsFor("#FormGrid")).toEqual({columns: 2});
    });

    it("seeds required props with an empty value so the gap is visible", () => {
        expect(defaultPropsFor("#FormAlert")).toEqual({message: ""});
        expect(defaultPropsFor("#ReferencesViewModeScope")).toEqual({
            storageKey: "",
            defaultMode: "compact",
        });
        expect(defaultPropsFor("#FormWhenFieldValueIn")).toEqual({watchField: "", whenValues: []});
    });

    it("returns nothing for a widget with no required or defaulted props", () => {
        expect(defaultPropsFor("#Input")).toBeUndefined();
        expect(defaultPropsFor("#ReferencesViewModeToggle")).toBeUndefined();
    });
});

describe("createPaletteNode", () => {
    it("gives a container an empty children array", () => {
        expect(createPaletteNode("#SheetGroup", "sheet")).toEqual({
            render: "#SheetGroup",
            props: {title: ""},
            children: [],
        });
    });

    it("uses the #Field pseudo-token in a form and the widget itself in a sheet", () => {
        expect(createPaletteNode("#Input", "form")).toEqual({
            render: "#Field",
            field: {name: "", widget: "#Input"},
        });
        expect(createPaletteNode("#DisplayCard", "sheet")).toEqual({
            render: "#DisplayCard",
            field: {name: "", widget: "#DisplayCard"},
        });
    });

    it("gives chrome props but no field binding", () => {
        expect(createPaletteNode("#FormAlert", "form")).toEqual({
            render: "#FormAlert",
            props: {message: ""},
        });
    });

    it("treats a plain HTML tag as a container", () => {
        expect(createPaletteNode("div", "sheet")).toEqual({render: "div", children: []});
    });
});

describe("buildPaletteGroups", () => {
    it("hides widgets that do nothing in the current mode", () => {
        registry(["#DisplayCard", "#Input", "#SheetGroup", "#FormGrid"]);
        const sheet = buildPaletteGroups({mode: "sheet"}).flatMap((g) => g.tokens);
        expect(sheet).toContain("#DisplayCard");
        expect(sheet).toContain("#SheetGroup");
        expect(sheet).not.toContain("#Input");
        expect(sheet).not.toContain("#FormGrid");

        const form = buildPaletteGroups({mode: "form"}).flatMap((g) => g.tokens);
        expect(form).toContain("#Input");
        expect(form).not.toContain("#DisplayCard");
    });

    it("shows everything when no mode is given", () => {
        registry(["#DisplayCard", "#Input"]);
        const all = buildPaletteGroups().flatMap((g) => g.tokens);
        expect(all).toContain("#DisplayCard");
        expect(all).toContain("#Input");
    });

    it("does not leak a mode-hidden core token into Module widgets", () => {
        registry(["#Input"]);
        const groups = buildPaletteGroups({mode: "sheet"});
        const moduleGroup = groups.find((g) => g.id === "module");
        expect(moduleGroup?.tokens ?? []).not.toContain("#Input");
    });

    it("collects unclaimed registry tokens into Module widgets", () => {
        registry(["#DisplayCard", "#ModuleThing"]);
        const moduleGroup = buildPaletteGroups({mode: "sheet"}).find((g) => g.id === "module");
        expect(moduleGroup?.tokens).toEqual(["#ModuleThing"]);
    });

    it("always offers the HTML tags", () => {
        registry([]);
        const html = buildPaletteGroups({mode: "sheet"}).find((g) => g.id === "html");
        expect(html?.tokens).toEqual(["div", "span", "p"]);
    });
});

describe("CORE_WIDGET_META hygiene", () => {
    it("declares at least one mode per token", () => {
        for (const [token, meta] of Object.entries(CORE_WIDGET_META)) {
            expect(meta.modes.length, token).toBeGreaterThan(0);
        }
    });

    it("never marks a token as both a container and a field binding", () => {
        for (const [token, meta] of Object.entries(CORE_WIDGET_META)) {
            expect(meta.container && meta.bindsField, token).toBeFalsy();
        }
    });

    it("gives every described prop a unique name", () => {
        for (const [token, meta] of Object.entries(CORE_WIDGET_META)) {
            for (const list of [meta.props, meta.widgetProps]) {
                if (!list) continue;
                const names = list.map((p) => p.name);
                expect(new Set(names).size, token).toBe(names.length);
            }
        }
    });

    it("only uses enum values alongside the enum type", () => {
        for (const [token, meta] of Object.entries(CORE_WIDGET_META)) {
            for (const prop of [...(meta.props ?? []), ...(meta.widgetProps ?? [])]) {
                if (prop.enum) expect(prop.type, `${token}.${prop.name}`).toBe("enum");
                if (prop.type === "enum") expect(prop.enum, `${token}.${prop.name}`).toBeTruthy();
            }
        }
    });
});
