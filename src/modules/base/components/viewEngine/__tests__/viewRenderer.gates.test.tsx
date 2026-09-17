import {beforeEach, describe, expect, it, vi} from "vitest";
import {render, screen} from "@testing-library/react";
import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";

vi.mock("@baseModule/helpers/moduleContributions/loadWidgetContributions.ts", () => ({
    getSortedWidgetContributions: () => [],
}));
vi.mock("@baseModule/helpers/hocs/withLanguage.tsx", async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    default: (await import("./harness.tsx")).fakeWithLanguage,
}));
vi.mock("@baseModule/helpers/hocs/withDebug.tsx", () => ({default: () => (c: unknown) => c}));
vi.mock("@coreModule/components/custom/displayValue/displayCard.tsx", async () => ({
    default: (await import("./harness.tsx")).makeProbe("#DisplayCard"),
}));

const {default: ViewRenderer} = await import("../ViewRenderer.tsx");
const {registerWidget} = await import("../widgetRegistry.ts");
const {cardNode, lastProps, makeProbe, propsOf, renderSheetWith, resetCalls, t} = await import("./harness.tsx");

const div = (testId: string, extra: Partial<ViewNode> = {}, props: Record<string, unknown> = {}): ViewNode => ({
    render: "div",
    props: {"data-testid": testId, ...props},
    ...extra,
});

beforeEach(() => {
    resetCalls();
});

describe("form-extras skips", () => {
    it("skipRenderWhenFormExtraTruthy hides only when the extra is truthy, and never leaks to the DOM", () => {
        const node = div("n", {}, {skipRenderWhenFormExtraTruthy: "flag"});
        const {rerender} = renderSheetWith(ViewRenderer, [node], {formExtras: {flag: true}});
        expect(screen.queryByTestId("n")).toBeNull();

        rerender(<ViewRenderer nodes={[node]} ctx={{mode: "sheet", resolveLanguageKey: t, formExtras: {flag: false}}} />);
        const el = screen.getByTestId("n");
        expect(el.getAttribute("skipRenderWhenFormExtraTruthy")).toBeNull();
        expect(el.getAttribute("skiprenderwhenformextratruthy")).toBeNull();
    });

    it("skipRenderWhenFormExtraNotTruthy hides when the extra is missing or falsy", () => {
        const node = div("n", {}, {skipRenderWhenFormExtraNotTruthy: "flag"});
        renderSheetWith(ViewRenderer, [node], {formExtras: {}});
        expect(screen.queryByTestId("n")).toBeNull();
        renderSheetWith(ViewRenderer, [node], {formExtras: {flag: 1}});
        expect(screen.getByTestId("n")).toBeInTheDocument();
    });
});

describe("read gate (sheet mode)", () => {
    it("drops a non-card node the account cannot read", () => {
        renderSheetWith(ViewRenderer, [div("n", {permissions: {read: "secret"}})], {access: {name: true}});
        expect(screen.queryByTestId("n")).toBeNull();
    });

    it("locks, rather than drops, an unreadable #DisplayCard", () => {
        renderSheetWith(ViewRenderer, [cardNode("secret", {}, {permissions: {read: "secret"}})], {
            access: {name: true},
            data: {secret: "x"},
        });
        const p = lastProps("#DisplayCard");
        expect(p.locked).toBe(true);
        expect(p.show).toBe(false);
    });

    it("readAny passes when any key is readable", () => {
        renderSheetWith(ViewRenderer, [div("n", {permissions: {readAny: ["a", "b"]}})], {access: {b: true}});
        expect(screen.getByTestId("n")).toBeInTheDocument();
        renderSheetWith(ViewRenderer, [div("m", {permissions: {readAny: ["a", "c"]}})], {access: {b: true}});
        expect(screen.queryByTestId("m")).toBeNull();
    });

    it("reads nested access through `.keys`", () => {
        const access = {country: {keys: {name: true}}};
        renderSheetWith(ViewRenderer, [div("n", {permissions: {read: "country.name"}})], {access});
        expect(screen.getByTestId("n")).toBeInTheDocument();
    });

    it("does not gate when there is no access map", () => {
        renderSheetWith(ViewRenderer, [div("n", {permissions: {read: "secret"}})], {access: undefined});
        expect(screen.getByTestId("n")).toBeInTheDocument();
    });

    it("does not apply the read gate in form mode", () => {
        const renderField = vi.fn(() => <span data-testid="field" />);
        const node: ViewNode = {render: "#Input", field: {name: "secret", widget: "#Input"}, permissions: {read: "secret"}};
        render(<ViewRenderer nodes={[node]} ctx={{mode: "form", resolveLanguageKey: t, access: {}, renderField}} />);
        expect(renderField).toHaveBeenCalledWith(node, node.field, 0);
    });
});

describe("dependent / dependentAny", () => {
    const absent = [null, undefined, false, "", [], {}, {a: null, b: []}];
    const present = [0, "x", true, [1], {a: 1}, {a: null, b: [1]}];

    it.each(absent.map((v) => [v]))("hides when the dependent value is %j", (value) => {
        renderSheetWith(ViewRenderer, [div("n", {dependent: "dep"})], {data: {dep: value}});
        expect(screen.queryByTestId("n")).toBeNull();
    });

    it.each(present.map((v) => [v]))("shows when the dependent value is %j", (value) => {
        renderSheetWith(ViewRenderer, [div("n", {dependent: "dep"})], {data: {dep: value}});
        expect(screen.getByTestId("n")).toBeInTheDocument();
    });

    it("dependentAny shows when any listed path is present, and wins over dependent", () => {
        renderSheetWith(ViewRenderer, [div("n", {dependentAny: ["a", "b"], dependent: "missing"})], {data: {b: "x"}});
        expect(screen.getByTestId("n")).toBeInTheDocument();
        renderSheetWith(ViewRenderer, [div("m", {dependentAny: ["a", "c"]})], {data: {b: "x"}});
        expect(screen.queryByTestId("m")).toBeNull();
    });

    it("does not check dependents when there is no data", () => {
        render(<ViewRenderer nodes={[div("n", {dependent: "dep"})]} ctx={{mode: "sheet", resolveLanguageKey: t}} />);
        expect(screen.getByTestId("n")).toBeInTheDocument();
    });
});

describe("write gate", () => {
    it("hides a node whose write key is not granted", () => {
        renderSheetWith(ViewRenderer, [div("ok", {permissions: {write: "name"}}), div("no", {permissions: {write: "code"}})], {
            writeAccess: {name: true},
        });
        expect(screen.getByTestId("ok")).toBeInTheDocument();
        expect(screen.queryByTestId("no")).toBeNull();
    });

    it("writeAny passes on any granted key", () => {
        renderSheetWith(ViewRenderer, [div("n", {permissions: {writeAny: ["code", "name"]}})], {writeAccess: {name: true}});
        expect(screen.getByTestId("n")).toBeInTheDocument();
    });

    it("does not gate without a writeAccess map", () => {
        renderSheetWith(ViewRenderer, [div("n", {permissions: {write: "code"}})]);
        expect(screen.getByTestId("n")).toBeInTheDocument();
    });

    // Audit finding 2: the node gate used to look the dotted key up flat and hide the node.
    it("follows nested `.keys` for a dotted write key", () => {
        renderSheetWith(ViewRenderer, [div("n", {permissions: {write: "address.city"}})], {
            writeAccess: {address: {keys: {city: true}}},
        });
        expect(screen.getByTestId("n")).toBeInTheDocument();
    });
});

describe("registered and DOM nodes", () => {
    beforeEach(() => {
        registerWidget("#SheetGroup", makeProbe("#SheetGroup"));
        registerWidget("#FormAlert", makeProbe("#FormAlert"));
        registerWidget("#TitleWithCollapse", makeProbe("#TitleWithCollapse"));
        registerWidget("#ReferencesViewModeToggle", makeProbe("#ReferencesViewModeToggle"));
    });

    it("renders DOM children recursively", () => {
        renderSheetWith(ViewRenderer, [{...div("outer"), children: [div("inner")]}]);
        expect(screen.getByTestId("outer")).toContainElement(screen.getByTestId("inner"));
    });

    it("warns and skips an unknown token", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const {container} = renderSheetWith(ViewRenderer, [{render: "#NoSuchWidget"}]);
        expect(container.innerHTML).toBe("");
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it("#SheetGroup: translates the title and namespaces the collapse key by sheet model", () => {
        renderSheetWith(ViewRenderer, [{render: "#SheetGroup", props: {title: "general"}, children: [div("c")]}], {
            sheetModel: "units",
        });
        const p = lastProps("#SheetGroup");
        expect(p.title).toBe("t:general");
        expect(p.collapseStorageKey).toBe("units:general");
        expect(screen.getByTestId("c")).toBeInTheDocument();
    });

    it("#SheetGroup: an explicit collapseKey wins and is not forwarded", () => {
        renderSheetWith(ViewRenderer, [{render: "#SheetGroup", props: {title: "general", collapseKey: "k1"}}], {
            sheetModel: "units",
        });
        const p = lastProps("#SheetGroup");
        expect(p.collapseStorageKey).toBe("k1");
        expect("collapseKey" in p).toBe(false);
    });

    it("#SheetGroup: collapseStorageKey passes through; no title and no model means no key", () => {
        renderSheetWith(ViewRenderer, [{render: "#SheetGroup", props: {title: "g", collapseStorageKey: "k2"}}]);
        expect(lastProps("#SheetGroup").collapseStorageKey).toBe("k2");
        renderSheetWith(ViewRenderer, [{render: "#SheetGroup", props: {}}]);
        expect(lastProps("#SheetGroup").collapseStorageKey).toBeUndefined();
        renderSheetWith(ViewRenderer, [{render: "#SheetGroup", props: {title: "g"}}]);
        expect(lastProps("#SheetGroup").collapseStorageKey).toBe("g");
    });

    it("#SheetGroup: resolves titleIcon to an element and drops unknown icons + icon class", () => {
        renderSheetWith(ViewRenderer, [{render: "#SheetGroup", props: {titleIcon: "#Globe", titleIconClassName: "x"}}]);
        const p = lastProps("#SheetGroup");
        expect(p.titleIcon).toBeTruthy();
        expect(typeof p.titleIcon).toBe("object");
        expect(p.titleIcon.props.className).toContain("size-5");
        expect(p.titleIcon.props.className).toContain("x");
        expect("titleIconClassName" in p).toBe(false);

        renderSheetWith(ViewRenderer, [{render: "#SheetGroup", props: {titleIcon: "#DefinitelyNotAnIcon"}}]);
        expect("titleIcon" in lastProps("#SheetGroup")).toBe(false);
    });

    it("#SheetGroup: resolves titleActions; the view-mode toggle gets the sheet translator", () => {
        renderSheetWith(ViewRenderer, [{render: "#SheetGroup", props: {titleActions: "#ReferencesViewModeToggle"}}]);
        const p = lastProps("#SheetGroup");
        expect(p.titleActions.props.sheetLanguageKey).toBe(t);

        renderSheetWith(ViewRenderer, [{render: "#SheetGroup", props: {titleActions: "#Unknown"}}]);
        expect("titleActions" in lastProps("#SheetGroup")).toBe(false);
    });

    it("#FormAlert translates message; #TitleWithCollapse translates title", () => {
        renderSheetWith(ViewRenderer, [
            {render: "#FormAlert", props: {message: "warn.msg"}},
            {render: "#TitleWithCollapse", props: {title: "section"}},
        ]);
        expect(lastProps("#FormAlert").message).toBe("t:warn.msg");
        expect(lastProps("#TitleWithCollapse").title).toBe("t:section");
        expect(propsOf("#TitleWithCollapse")[0].collapseStorageKey).toBeUndefined();
    });
});
