import {beforeEach, describe, expect, it, vi} from "vitest";
import {isValidElement} from "react";
import {render, screen} from "@testing-library/react";
import {format} from "date-fns";
import {formatNumber} from "@baseModule/helpers/general/numbers.ts";

vi.mock("@coreModule/clients/panel/moduleContributions/loadWidgetContributions.ts", () => ({
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
const {registerWidget, registerSheetFieldRenderer} = await import("../widgetRegistry.ts");
const {cardNode, lastProps, makeProbe, propsOf, renderLinkedSheet, renderSheetWith, resetCalls, t} = await import("./harness.tsx");

const card = (data: Record<string, any>, name: string, wp: Record<string, any> = {}, extra = {}, ctx = {}) => {
    renderSheetWith(ViewRenderer, [cardNode(name, wp, extra)], {data, ...ctx});
    return lastProps("#DisplayCard");
};

beforeEach(() => {
    resetCalls();
    registerWidget("#ProjectSheetView", makeProbe("#ProjectSheetView"));
    registerWidget("#OrderSheetView", makeProbe("#OrderSheetView"));
    registerWidget("#ReferencesViewModeToggle", makeProbe("#ReferencesViewModeToggle"));
});

describe("#DisplayCard basics", () => {
    it("binds title, tooltip, path and raw value", () => {
        const p = card({name: "Alpha"}, "name");
        expect(p).toMatchObject({title: "t:label.name", tooltip: "t:label.name", path: "name", value: "Alpha", show: true, locked: false});
        expect(p.type).toBeUndefined();
        expect(p.linkedReferenceSheet).toBeUndefined();
    });

    it("falls back to the field name without a label and translates an explicit tooltip", () => {
        renderSheetWith(ViewRenderer, [{render: "#DisplayCard", field: {name: "code", widget: "#DisplayCard", widgetProps: {tooltip: "tip"}}}], {
            data: {code: "C"},
        });
        expect(lastProps("#DisplayCard")).toMatchObject({title: "code", tooltip: "t:tip"});
    });

    it("forwards simple widget props", () => {
        const p = card({n: "x"}, "n", {type: "enum", size: 3, expandable: true, maxLength: 20, dontRenderValue: true, languageKeyCategory: "cat"});
        expect(p).toMatchObject({type: "enum", size: 3, expandable: true, maxLength: 20, dontRenderValue: true, languageKeyCategory: "cat"});
    });
});

describe("value pipeline", () => {
    it("joins valuePath under parent with the separator, skipping empties", () => {
        const data = {createdBy: {name: "Ana", surname: "", last: "Doe"}};
        expect(card(data, "createdBy", {parent: "createdBy", valuePath: ["name", "surname", "last"], joinSeparator: "-"}).value).toBe("Ana-Doe");
    });

    it("treats a missing parent as an empty value", () => {
        expect(card({}, "createdBy", {parent: "createdBy", valuePath: ["name"]}).value).toBeNull();
    });

    it("drops valuePath segments the account cannot read", () => {
        const data = {createdBy: {name: "Ana", surname: "Doe"}};
        const access = {createdBy: {keys: {name: true}}};
        expect(card(data, "createdBy", {parent: "createdBy", valuePath: ["name", "surname"]}, {}, {access}).value).toBe("Ana");
        expect(card(data, "createdBy", {parent: "createdBy", valuePath: ["surname"]}, {}, {access}).value).toBeNull();
    });

    it("pickFirstTruthyValuePath takes the first non-empty segment", () => {
        expect(card({a: "", b: "B", c: "C"}, "x", {valuePath: ["a", "b", "c"], pickFirstTruthyValuePath: true}).value).toBe("B");
    });

    it("languageKeyCategoriesByPath translates matching segments (full path or first segment)", () => {
        const data = {status: "open", kind: {code: "k1"}};
        const p = card(data, "x", {valuePath: ["status", "kind.code"], languageKeyCategoriesByPath: {status: "statuses", kind: "kinds"}});
        expect(p.value).toBe("t:statuses.open t:kinds.k1");
    });

    it("format locale formats numbers in valuePath and plain values", () => {
        expect(card({a: 1234.5, b: "m²"}, "x", {valuePath: ["a", "b"], format: "locale"}).value).toBe(`${formatNumber(1234.5)} m²`);
        expect(card({n: 1234.5}, "n", {format: "locale"}).value).toBe(formatNumber(1234.5));
    });

    it("format date / dateTime use date-fns PP / PPp; invalid dates stay as text", () => {
        const iso = "2026-03-04T10:20:00.000Z";
        expect(card({d: iso}, "d", {format: "date"}).value).toBe(format(new Date(iso), "PP"));
        expect(card({d: iso}, "d", {format: "dateTime"}).value).toBe(format(new Date(iso), "PPp"));
        expect(card({d: "not a date"}, "d", {format: "date"}).value).toBe("not a date");
    });

    it("a display `type` or `bodyWidget` skips pre-formatting", () => {
        expect(card({n: 1234.5}, "n", {format: "locale", type: "number"}).value).toBe(1234.5);
    });

    it("languageKeyCategory translates strings and booleans, but not for enum cards", () => {
        expect(card({s: "open"}, "s", {languageKeyCategory: "st"}).value).toBe("t:st.open");
        expect(card({b: false}, "b", {languageKeyCategory: "yn"}).value).toBe("t:yn.false");
        expect(card({s: "open"}, "s", {languageKeyCategory: "st", type: "enum"}).value).toBe("open");
    });

    it("valueType boolean maps to yes/no", () => {
        expect(card({b: true}, "b", {valueType: "boolean"}).value).toBe("t:yes");
        expect(card({b: "false"}, "b", {valueType: "boolean"}).value).toBe("t:no");
        expect(card({b: "maybe"}, "b", {valueType: "boolean"}).value).toBe("maybe");
    });

    it("prefix / suffix are added once", () => {
        expect(card({n: 5}, "n", {prefix: "#", suffix: " m²"}).value).toBe("#5 m²");
        expect(card({n: "#5 m²"}, "n", {prefix: "#", suffix: " m²"}).value).toBe("#5 m²");
    });

    it("currency cards get a structured stub from valuePath", () => {
        const data = {price: 12.5, priceCurrency: {symbol: "€"}};
        const p = card(data, "price", {type: "currency", valuePath: ["priceCurrency.symbol", "price"]});
        expect(p.value).toEqual({amount: 12.5, currency: {symbol: "€", abbreviation: undefined}});
        expect(p.type).toBe("currency");
        expect(card({price: "7"}, "price", {type: "currency", valuePath: ["price"]}).value).toEqual({amount: 7});
        expect(card({}, "price", {type: "currency", valuePath: ["price"]}).value).toBeNull();
    });

    it("currency stubs with prefix/suffix are baked into text and lose the currency type", () => {
        const data = {price: 12.5, priceCurrency: {abbreviation: "EUR"}};
        const p = card(data, "price", {type: "currency", valuePath: ["priceCurrency.abbreviation", "price"], suffix: "/mo"});
        const amount = formatNumber(12.5, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        expect(p.value).toBe(`EUR ${amount}/mo`);
        expect(p.type).toBeUndefined();
    });

    it("mdiIcon valueType renders an icon element; empty is null", () => {
        expect(isValidElement(card({icon: "mdi-home"}, "icon", {valueType: "mdiIcon"}).value)).toBe(true);
        expect(card({icon: ""}, "icon", {valueType: "mdiIcon"}).value).toBeNull();
    });

    it("stringBadgeList renders badges with an overflow count", () => {
        const p = card({tags: ["a", "b", "c"]}, "tags", {valueType: "stringBadgeList", maxItems: 2});
        render(<>{p.value}</>);
        expect(screen.getByText("a")).toBeInTheDocument();
        expect(screen.getByText("+1")).toBeInTheDocument();
        expect(screen.queryByText("c")).toBeNull();
    });

    it("currencyList renders each amount and the `and` joiner; empty renders `none`", () => {
        const p = card({budget: [{currency: {abbreviation: "EUR"}, value: 1}, {currency: {symbol: "$"}, value: 2}]}, "budget", {valueType: "currencyList"});
        render(<>{p.value}</>);
        expect(screen.getByText("EUR")).toBeInTheDocument();
        expect(screen.getByText("$")).toBeInTheDocument();
        expect(screen.getByText("t:and")).toBeInTheDocument();

        const empty = card({budget: []}, "budget", {valueType: "currencyList"});
        render(<>{empty.value}</>);
        expect(screen.getByText("t:none")).toBeInTheDocument();
    });

    it("bodyWidget replaces the value with the contributed renderer output", () => {
        registerSheetFieldRenderer("#TestBody", ({binding}) => <span data-testid="body">{binding.name}</span>);
        const p = card({items: [1]}, "items", {bodyWidget: "#TestBody"});
        render(<>{p.value}</>);
        expect(screen.getByTestId("body")).toHaveTextContent("items");
    });
});

describe("value access lock", () => {
    it("locks when the value path is unreadable, unless widgetProps.show forces it", () => {
        expect(card({secret: "x"}, "secret", {}, {}, {access: {name: true}})).toMatchObject({locked: true, show: false});
        expect(card({secret: "x"}, "secret", {show: true}, {}, {access: {name: true}})).toMatchObject({locked: false, show: true});
    });

    it("skipReadAccessGate and statistics.* never lock", () => {
        expect(card({secret: "x"}, "secret", {}, {fieldExtra: {skipReadAccessGate: true}}, {access: {name: true}}).locked).toBe(false);
        expect(card({statistics: {n: 1}}, "statistics.n", {}, {}, {access: {name: true}}).locked).toBe(false);
    });

    it("parent + valuePath locks only when no segment is readable", () => {
        const wp = {parent: "createdBy", valuePath: ["name", "surname"]};
        const data = {createdBy: {name: "A"}};
        expect(card(data, "createdBy", wp, {}, {access: {createdBy: {keys: {surname: true}}}}).locked).toBe(false);
        expect(card(data, "createdBy", wp, {}, {access: {other: true}}).locked).toBe(true);
    });
});

describe("decorations", () => {
    it("flagCodePath / mdiIconPath / avatarPath read their path only when readable", () => {
        const data = {n: "x", country: {code: "al"}, type: {icon: "mdi-a"}, createdBy: {photo: {_id: "m1"}}};
        const wp = {flagCodePath: "country.code", mdiIconPath: "type.icon", avatarPath: "createdBy.photo"};
        const open = card(data, "n", wp);
        expect(open).toMatchObject({flagCode: "al", mdiIcon: "mdi-a", avatar: {mediaId: "m1", name: "x"}});

        const narrow = card(data, "n", wp, {}, {access: {n: true}});
        expect(narrow.flagCode).toBeUndefined();
        expect(narrow.mdiIcon).toBeUndefined();
        expect(narrow.avatar).toBeUndefined();
    });

    it("avatar falls back to the label when the value is not a string", () => {
        expect(card({n: 3, photo: "m2"}, "n", {avatarPath: "photo"}).avatar).toEqual({mediaId: "m2", name: "t:label.n"});
    });

    it("resolves an icon token", () => {
        expect(card({n: 1}, "n", {icon: "#Globe"}).Icon).toBeTruthy();
        expect(card({n: 1}, "n", {}).Icon).toBeUndefined();
    });

    it("keeps only known colour variants", () => {
        expect(card({n: 1}, "n", {variant: "success"}).variant).toBe("success");
        expect(card({n: 1}, "n", {variant: "purple"}).variant).toBeUndefined();
    });

    it("variantLookupMap matches raw then lower-cased keys", () => {
        const map = {open: "success", true: "warning"};
        expect(card({n: 1, s: "OPEN"}, "n", {variantLookupField: "s", variantLookupMap: map}).variant).toBe("success");
        expect(card({n: 1, s: true}, "n", {variantLookupField: "s", variantLookupMap: map}).variant).toBe("warning");
        expect(card({n: 1, s: "closed"}, "n", {variant: "info", variantLookupField: "s", variantLookupMap: map}).variant).toBe("info");
    });

    it("variantFromRatingTenScale bands 8+/6+/else", () => {
        const wp = {variantFromRatingTenScale: true};
        expect(card({r: 8}, "r", wp).variant).toBe("success");
        expect(card({r: 6.5}, "r", wp).variant).toBe("warning");
        expect(card({r: 2}, "r", wp).variant).toBe("destructive");
        expect(card({r: 2, score: 9}, "r", {...wp, variantFromRatingPath: "score"}).variant).toBe("success");
    });

    it("externalLink turns a string value into an external href", () => {
        expect(card({url: " https://x.io "}, "url", {externalLink: true})).toMatchObject({externalHref: "https://x.io", dontRenderValue: true});
        expect(card({url: ""}, "url", {externalLink: true}).externalHref).toBeUndefined();
    });

    it("internalHrefTemplate substitutes the ref id from linkedRefPath or the field", () => {
        expect(card({project: {_id: "p1"}}, "project", {internalHrefTemplate: "/projects/{_id}"}).internalHref).toBe("/projects/p1");
        expect(card({pid: "p2", n: 1}, "n", {internalHrefTemplate: "/p/{_id}", linkedRefPath: "pid"}).internalHref).toBe("/p/p2");
    });

    it("header actions come from titleActions or showViewModeToggle", () => {
        const p = card({n: 1}, "n", {showViewModeToggle: true});
        expect(p.headerActions.props.sheetLanguageKey).toBe(t);
        expect(card({n: 1}, "n", {}).headerActions).toBeUndefined();
    });
});

describe("linked sheets", () => {
    it("wires a linked sheet from linkedRefPath and binds its props", () => {
        const unlinkEmbeddedRefPath = vi.fn();
        const onLinkedDeleted = vi.fn();
        const data = {project: {_id: "p1", name: "Tower", code: "T"}};
        const p = card(
            data,
            "project.name",
            {linkedRefPath: "project", linkedSheetModel: "projects", linkedSheetWidget: "#ProjectSheetView", linkedSheetEntityProp: "project"},
            {},
            {unlinkEmbeddedRefPath, referenceCardUnitContext: {unitId: "u1", unitName: "U1"}},
        );
        expect(p.linkedReferenceSheet.resourceId).toBe("projects");

        renderLinkedSheet(p.linkedReferenceSheet, {open: true, onOpenChange: () => {}, onLinkedDeleted});
        const sheet = lastProps("#ProjectSheetView");
        expect(sheet).toMatchObject({fetchId: "p1", unitId: "u1", unitName: "U1", open: true, project: {_id: "p1", name: "Tower", code: "T"}});
        expect("onLinkedDeleted" in sheet).toBe(false);

        sheet.onDelete();
        expect(unlinkEmbeddedRefPath).toHaveBeenCalledWith("project");
        expect(onLinkedDeleted).toHaveBeenCalled();
    });

    // Audit finding 1: a component created per render remounted the open nested sheet on every parent render.
    it("hands DisplayCard the same LinkedSheet component on every render", () => {
        const wp = {linkedRefPath: "project", linkedSheetModel: "projects", linkedSheetWidget: "#ProjectSheetView"};
        const first = card({project: {_id: "p1", name: "A"}}, "project.name", wp).linkedReferenceSheet.LinkedSheet;
        const second = card({project: {_id: "p2", name: "B"}}, "project.name", wp).linkedReferenceSheet.LinkedSheet;
        expect(first).toBe(second);

        const listWp = {valueType: "linkedObjectRefCardList", linkedSheetModel: "projects", linkedSheetWidget: "#ProjectSheetView"};
        renderSheetWith(ViewRenderer, [cardNode("list", listWp)], {data: {list: ["a", "b"]}});
        const [a, b] = propsOf("#DisplayCard").slice(-2);
        expect(a.linkedReferenceSheet.LinkedSheet).toBe(first);
        expect(b.linkedReferenceSheet.LinkedSheet).toBe(first);
    });

    it("bootstraps a bare id ref from the display value under linkedSheetValueField", () => {
        const p = card(
            {pid: "p1", label: "Tower"},
            "label",
            {linkedRefPath: "pid", linkedSheetModel: "projects", linkedSheetWidget: "#ProjectSheetView", linkedSheetValueField: "title"},
        );
        renderLinkedSheet(p.linkedReferenceSheet);
        expect(lastProps("#ProjectSheetView").project).toEqual({_id: "p1", title: "Tower"});
    });

    it("needs a model, a registered widget and an id", () => {
        expect(card({pid: "p1", n: 1}, "n", {linkedRefPath: "pid", linkedSheetWidget: "#ProjectSheetView"}).linkedReferenceSheet).toBeUndefined();
        expect(card({pid: "p1", n: 1}, "n", {linkedRefPath: "pid", linkedSheetModel: "m", linkedSheetWidget: "#Missing"}).linkedReferenceSheet).toBeUndefined();
        expect(card({n: 1}, "n", {linkedRefPath: "pid", linkedSheetModel: "m", linkedSheetWidget: "#ProjectSheetView"}).linkedReferenceSheet).toBeUndefined();
    });

    it("linkedSheetByType picks the target by the discriminator", () => {
        const wp = {
            linkedRefPath: "sourceId",
            linkedSheetByType: {
                productOrder: {linkedSheetModel: "orders", linkedSheetWidget: "#OrderSheetView", linkedSheetEntityProp: "order"},
            },
        };
        const p = card({sourceId: "o1", sourceType: "productOrder", n: 1}, "n", wp);
        expect(p.linkedReferenceSheet.resourceId).toBe("orders");
        renderLinkedSheet(p.linkedReferenceSheet);
        expect(lastProps("#OrderSheetView").order).toEqual({_id: "o1", name: "1"});

        expect(card({sourceId: "o1", sourceType: "checkout", n: 1}, "n", wp).linkedReferenceSheet).toBeUndefined();
        const custom = {...wp, linkedSheetTypePath: "kind"};
        expect(card({sourceId: "o1", kind: "productOrder", n: 1}, "n", custom).linkedReferenceSheet.resourceId).toBe("orders");
    });
});

describe("linkedObjectRefCardList", () => {
    const wp = {
        valueType: "linkedObjectRefCardList",
        linkedSheetModel: "projects",
        linkedSheetWidget: "#ProjectSheetView",
        linkedSheetEntityProp: "project",
    };

    it("renders one empty card for an empty list", () => {
        const p = card({list: []}, "list", wp);
        expect(p).toMatchObject({title: "t:label.list", value: null, dontRenderValue: false});
    });

    it("renders a card per ref and unlinks by index", () => {
        const unlinkEmbeddedListRefItem = vi.fn();
        const {container} = renderSheetWith(
            ViewRenderer,
            [cardNode("list", {...wp, labelField: "info.title", linkedRefListLayout: "grid4"})],
            {data: {list: [{_id: "a", info: {title: "A"}}, "b", null, {name: "no id"}]}, unlinkEmbeddedListRefItem},
        );
        const cards = propsOf("#DisplayCard");
        expect(cards.map((c) => c.title)).toEqual(["A", "b"]);
        expect(cards.every((c) => c.dontRenderValue === true)).toBe(true);
        expect(container.firstElementChild?.className).toContain("grid-cols-4");

        renderLinkedSheet(cards[1].linkedReferenceSheet);
        const sheet = lastProps("#ProjectSheetView");
        expect(sheet).toMatchObject({fetchId: "b", project: {_id: "b", name: "b"}});
        sheet.onDelete();
        expect(unlinkEmbeddedListRefItem).toHaveBeenCalledWith("list", 1);
    });

    it("uses linkedRefListPath for unlinking and listClassName as fallback layout", () => {
        const unlinkEmbeddedListRefItem = vi.fn();
        const {container} = renderSheetWith(
            ViewRenderer,
            [cardNode("list", {...wp, linkedRefListPath: "other.list", listClassName: "custom-list"})],
            {data: {list: [{_id: "a", name: "A", code: 1}]}, unlinkEmbeddedListRefItem},
        );
        expect(container.firstElementChild?.className).toContain("custom-list");
        const c = lastProps("#DisplayCard");
        renderLinkedSheet(c.linkedReferenceSheet);
        expect(lastProps("#ProjectSheetView").project).toEqual({_id: "a", name: "A", code: 1});
        lastProps("#ProjectSheetView").onDelete();
        expect(unlinkEmbeddedListRefItem).toHaveBeenCalledWith("other.list", 0);
    });

    it("warns and renders nothing without a model or widget", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const {container} = renderSheetWith(ViewRenderer, [cardNode("list", {valueType: "linkedObjectRefCardList"})], {data: {list: []}});
        expect(container.innerHTML).toBe("");
        warn.mockRestore();
    });
});
