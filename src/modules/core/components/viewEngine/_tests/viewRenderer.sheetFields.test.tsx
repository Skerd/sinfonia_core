import {beforeEach, describe, expect, it, vi} from "vitest";
import {isValidElement} from "react";
import {render, screen, within} from "@testing-library/react";

vi.mock("@coreModule/helpers/moduleContributions/loadWidgetContributions.ts", () => ({
    getSortedWidgetContributions: () => [],
}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    default: (await import("./harness.tsx")).fakeWithLanguage,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({default: () => (c: unknown) => c}));
vi.mock("@coreModule/components/viewEngine/widgets/display/displayCard.tsx", async () => ({
    default: (await import("./harness.tsx")).makeProbe("#DisplayCard"),
}));
vi.mock("@coreModule/components/viewEngine/widgets/addresses/sheetLocationMap.tsx", async () => ({
    default: (await import("./harness.tsx")).makeProbe("#SheetLocationMap"),
}));
vi.mock("@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/cardView/countryCard.tsx", async () => ({
    default: (await import("./harness.tsx")).makeProbe("CountryCard"),
}));
vi.mock("@coreModule/clients/panel/private/tenancy/systemSettings/states/center/cardView/stateCard.tsx", async () => ({
    default: (await import("./harness.tsx")).makeProbe("StateCard"),
}));
vi.mock("@coreModule/clients/panel/private/tenancy/systemSettings/cities/center/cardView/cityCard.tsx", async () => ({
    default: (await import("./harness.tsx")).makeProbe("CityCard"),
}));
vi.mock("@coreModule/clients/panel/private/tenancy/systemSettings/currencies/center/cardView/currencyCard.tsx", async () => ({
    default: (await import("./harness.tsx")).makeProbe("CurrencyCard"),
}));

const {default: ViewRenderer} = await import("../ViewRenderer.tsx");
const {resolveReferencesCardBinding} = await import("../sheet/fields/references.tsx");
const {registerWidget, registerSheetFieldRenderer, registerReferencesDefaultItemProp} = await import("../widgetRegistry.ts");
const {ReferencesViewModeScope} = await import("../sheet/widgets/references/referencesViewModeContext.tsx");
const {fieldNode, lastProps, makeProbe, propsOf, renderSheetWith, resetCalls, t} = await import("./harness.tsx");

const PROBED = [
    "#ExpandableText",
    "#SheetMediaFilesStrip",
    "#SheetMediaAvatar",
    "#GalleryCarousel",
    "#CountryFlag",
    "#Badge",
    "#EmbeddedAddressCard",
    "#InspectionCard",
    "#ModificationRequestCard",
    "#SomeCard",
    "#Generic",
];

beforeEach(() => {
    resetCalls();
    for (const token of PROBED) registerWidget(token, makeProbe(token));
});

describe("contributed sheet field renderers", () => {
    it("undefined falls through to the built-in path; null renders nothing", () => {
        registerSheetFieldRenderer("#Generic", () => undefined);
        renderSheetWith(ViewRenderer, [fieldNode("#Generic", "x", {a: 1})]);
        expect(lastProps("#Generic")).toMatchObject({a: 1});

        resetCalls();
        registerSheetFieldRenderer("#Generic", () => null);
        const {container} = renderSheetWith(ViewRenderer, [fieldNode("#Generic", "x")]);
        expect(container.innerHTML).toBe("");
        expect(propsOf("#Generic")).toHaveLength(0);
        registerSheetFieldRenderer("#Generic", () => undefined);
    });

    it("receives node, binding, ctx, index and the resolved component", () => {
        const spy = vi.fn(() => <span data-testid="contributed" />);
        registerSheetFieldRenderer("#SomeCard", spy);
        const node = fieldNode("#SomeCard", "x");
        renderSheetWith(ViewRenderer, [node]);
        expect(screen.getByTestId("contributed")).toBeInTheDocument();
        const arg = (spy.mock.calls[0] as unknown[])[0] as Record<string, any>;
        expect(arg.node).toBe(node);
        expect(arg.binding).toBe(node.field);
        expect(arg.index).toBe(0);
        expect(arg.ctx.mode).toBe("sheet");
        expect(typeof arg.Component).toBe("function");
        registerSheetFieldRenderer("#SomeCard", () => undefined);
    });
});

describe("generic registered field", () => {
    it("spreads widgetProps and renders nothing for an unknown widget", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#Generic", "x", {a: 1, b: "two"})]);
        expect(lastProps("#Generic")).toMatchObject({a: 1, b: "two"});
        const {container} = renderSheetWith(ViewRenderer, [fieldNode("#Unregistered", "x")]);
        expect(container.innerHTML).toBe("");
    });
});

describe("tenancy reference cards", () => {
    it.each([
        ["#TenancyCountryCard", "CountryCard", "country"],
        ["#TenancyStateCard", "StateCard", "state"],
        ["#TenancyCityCard", "CityCard", "city"],
        ["#TenancyCurrencyCard", "CurrencyCard", "currency"],
    ])("%s binds the ref stub, fetchId and hides actions", async (token, probe, prop) => {
        renderSheetWith(ViewRenderer, [fieldNode(token, "ref", {small: true, className: "min-w-0"})], {
            data: {ref: {_id: "r1", name: "R"}},
        });
        const el = await screen.findByText((_, node) => node?.getAttribute("data-probe") === probe);
        expect(el.parentElement?.className).toBe("min-w-0");
        const p = lastProps(probe);
        expect(p).toMatchObject({[prop]: {_id: "r1", name: "R"}, fetchId: "r1", hideActions: true, small: true});
        expect("className" in p).toBe(false);
    });

    it("accepts a bare id and renders nothing without one", async () => {
        renderSheetWith(ViewRenderer, [fieldNode("#TenancyCountryCard", "ref")], {data: {ref: "c9"}});
        await screen.findByText((_, node) => node?.getAttribute("data-probe") === "CountryCard");
        expect(lastProps("CountryCard")).toMatchObject({country: {_id: "c9"}, fetchId: "c9"});

        const {container} = renderSheetWith(ViewRenderer, [fieldNode("#TenancyCountryCard", "ref")], {data: {ref: {name: "no id"}}});
        expect(container.innerHTML).toBe("");
    });
});

describe("addresses", () => {
    const address = {country: {_id: "c1", name: "Albania"}, city: {_id: "t1", name: "Tirana"}, street: "Main", latitude: 41.3, longitude: 19.8};

    it("#SheetCompanyAddresses renders a card set per address, with the map when coordinates exist", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetCompanyAddresses", "addresses", {badgeAccessModel: "edifices"})], {
            data: {addresses: [address, {street: "Side"}]},
        });
        const countries = propsOf("#DisplayCard").filter((p) => p.title === "t:form.countryLabel");
        expect(countries.map((p) => p.value)).toEqual(["Albania", null]);
        // `badgeAccessModel` never reached DisplayCard; the linked sheet's own model drives its access check.
        expect(countries[0].linkedReferenceSheet).toMatchObject({resourceId: "countries"});
        expect(countries[1].linkedReferenceSheet).toBeUndefined();
        expect(propsOf("#SheetLocationMap")).toHaveLength(1);
        expect(propsOf("#DisplayCard").find((p) => p.title === "t:form.latitudeLabel")?.value).toBe("41.3000");
    });

    it("#SheetAddressSection renders a single address; compact mode renders one summary card", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetAddressSection", "address")], {data: {address}});
        expect(propsOf("#DisplayCard").some((p) => p.title === "t:form.streetLabel" && p.value === "Main")).toBe(true);

        resetCalls();
        render(
            <ReferencesViewModeScope storageKey="test-compact" defaultMode="compact">
                <ViewRenderer nodes={[fieldNode("#SheetAddressSection", "address")]} ctx={{mode: "sheet", resolveLanguageKey: t, data: {address}}} />
            </ReferencesViewModeScope>,
        );
        localStorage.removeItem("test-compact");
        expect(propsOf("#DisplayCard")).toHaveLength(1);
        expect(lastProps("#DisplayCard")).toMatchObject({title: "t:address", value: "Tirana, Albania, Main"});
    });

    it("#SheetCompanyAddresses reads the entity itself when addressField is '.'", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetCompanyAddresses", "street", {addressField: "."})], {
            data: {street: "Main", country: {_id: "c1", name: "Albania"}, latitude: 41.3, longitude: 19.8, firstName: "Ada"},
        });
        expect(propsOf("#DisplayCard").find((p) => p.title === "t:form.streetLabel")?.value).toBe("Main");
        expect(propsOf("#DisplayCard").find((p) => p.title === "t:form.countryLabel")?.value).toBe("Albania");
        expect(propsOf("#SheetLocationMap")).toHaveLength(1);
    });

    it("renders the empty state for no address", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetCompanyAddresses", "addresses")], {data: {}});
        expect(propsOf("#DisplayCard")).toHaveLength(0);
    });

    it("#EmbeddedAddressCard binds the address from data", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#EmbeddedAddressCard", "address", {badgeAccessModel: "x"})], {data: {address}});
        expect(lastProps("#EmbeddedAddressCard")).toMatchObject({address, badgeAccessModel: "x"});
        renderSheetWith(ViewRenderer, [fieldNode("#EmbeddedAddressCard", "address")], {data: {}});
        expect(propsOf("#EmbeddedAddressCard")).toHaveLength(1);
    });
});

describe("#ReferencesRender", () => {
    it("resolves the card binding from cardWidget, the registered default, or legacy referenceKind", () => {
        registerReferencesDefaultItemProp("#SomeCard", "thing");
        expect(resolveReferencesCardBinding({cardWidget: "#SomeCard"})).toEqual({cardToken: "#SomeCard", itemDataProp: "thing"});
        expect(resolveReferencesCardBinding({cardWidget: "#Other"})).toEqual({cardToken: "#Other", itemDataProp: "item"});
        expect(resolveReferencesCardBinding({cardWidget: "#SomeCard", itemDataProp: "x"})).toEqual({cardToken: "#SomeCard", itemDataProp: "x"});
        expect(resolveReferencesCardBinding({referenceKind: "modificationRequest"})).toEqual({cardToken: "#ModificationRequestCard", itemDataProp: "request"});
        expect(resolveReferencesCardBinding({})).toEqual({cardToken: "#InspectionCard", itemDataProp: "inspection"});
    });

    it("renders a card per stub (objects with _id, or a bare id) with unit context and card props", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#ReferencesRender", "items", {cardWidget: "#SomeCard", itemDataProp: "thing", cardProps: {sheetOnly: true}, pageSize: 2})], {
            data: {_id: "u1", unitNumber: "A-1", items: [{_id: "a"}, {name: "no id"}, {_id: "b"}, {_id: "c"}]},
        });
        const cards = propsOf("#SomeCard");
        expect(cards.map((c) => c.thing._id)).toEqual(["a", "b"]);
        expect(cards[0]).toMatchObject({fetchId: "a", unitId: "u1", unitName: "A-1", hideActions: false, small: true, sheetOnly: true});
        expect(screen.getByText("1–2 / 3")).toBeInTheDocument();

        resetCalls();
        renderSheetWith(ViewRenderer, [fieldNode("#ReferencesRender", "sale", {cardWidget: "#SomeCard", itemDataProp: "item"})], {
            data: {_id: "u2", sale: "s1"},
            referenceCardUnitContext: {unitId: "ux", unitName: "UX"},
        });
        expect(lastProps("#SomeCard")).toMatchObject({item: {_id: "s1"}, unitId: "ux", unitName: "UX"});
    });

    it("renders the empty state when there are no stubs, and nothing for an unknown card", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#ReferencesRender", "items", {cardWidget: "#SomeCard"})], {data: {items: []}});
        expect(propsOf("#SomeCard")).toHaveLength(0);

        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const {container} = renderSheetWith(ViewRenderer, [fieldNode("#ReferencesRender", "items", {cardWidget: "#Nope"})], {data: {items: [{_id: "a"}]}});
        expect(container.innerHTML).toBe("");
        warn.mockRestore();
    });

    it("compact mode renders rows only when compactRow is configured", () => {
        const compactRow = {label: "inspection", valuePath: ["name"], linkedSheetModel: "m", linkedSheetWidget: "#SomeCard", linkedSheetEntityProp: "x"};
        const nodes = [
            fieldNode("#ReferencesRender", "items", {cardWidget: "#SomeCard", compactRow}),
            fieldNode("#ReferencesRender", "items", {cardWidget: "#InspectionCard"}),
        ];
        render(
            <ReferencesViewModeScope storageKey="test-refs" defaultMode="compact">
                <ViewRenderer nodes={nodes} ctx={{mode: "sheet", resolveLanguageKey: t, data: {items: [{_id: "a", name: "Insp A"}]}}} />
            </ReferencesViewModeScope>,
        );
        localStorage.removeItem("test-refs");
        expect(propsOf("#SomeCard")).toHaveLength(0);
        expect(lastProps("#DisplayCard")).toMatchObject({title: "t:inspection", value: "Insp A"});
        expect(propsOf("#InspectionCard")).toHaveLength(1);
    });
});

describe("#SheetEmbeddedItemsList", () => {
    it("renders the configured fields per item, sorted newest first, with a summary header per item", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetEmbeddedItemsList", "notes", {
            fields: [{name: "text", type: "text"}, {name: "at", type: "text"}],
            sortField: "at",
        })], {
            data: {notes: [{text: "old", at: "2020-01-01"}, {text: "new", at: "2024-01-01"}, {text: "", at: ""}]},
        });
        // Each item shows its summary as a header and then its fields. A blank entry still renders.
        const texts = screen.getAllByText(/^(old|new)$/).map((el) => el.textContent);
        expect(texts).toEqual(["new", "new", "old", "old"]);
        expect(screen.getByText("#1")).toBeInTheDocument();
        expect(screen.getByText("#3")).toBeInTheDocument();
    });

    it("entityCards opt-in uses the summary field as the title and omits it from the body", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetEmbeddedItemsList", "notes", {
            entityCards: true,
            fields: [{name: "text", type: "text"}, {name: "at", type: "text", labelKey: "when"}],
            sortField: "at",
        })], {
            data: {notes: [{text: "old", at: "2020-01-01"}, {text: "new", at: "2024-01-01"}]},
        });
        expect(screen.getAllByText(/^(old|new)$/).map((el) => el.textContent)).toEqual(["new", "old"]);
        expect(screen.getByText("2024-01-01")).toBeInTheDocument();
        expect(screen.getByText("2020-01-01")).toBeInTheDocument();
    });

    it("keeps the title field in the entity card body when that field is blank", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetEmbeddedItemsList", "geolocation", {
            entityCards: true,
            compactSummaryFields: ["city"],
            fields: [{name: "city", type: "text", labelKey: "geoCity"}, {name: "ip", type: "text", labelKey: "geoIp"}],
        })], {
            data: {geolocation: [{city: "", ip: "203.0.113.4"}]},
        });
        expect(screen.getByText("#1")).toBeInTheDocument();
        expect(screen.getByText(/t:geoCity/)).toBeInTheDocument();
        expect(screen.getByText("203.0.113.4")).toBeInTheDocument();
    });

    it("keeps an item when the summary field is blank and another field has a value", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetEmbeddedItemsList", "geolocation", {
            fields: [
                {name: "city", type: "text"},
                {name: "ip", type: "text"},
            ],
            compactSummaryFields: ["city", "country", "time"],
        })], {
            data: {geolocation: [{city: "", ip: "203.0.113.4"}, {city: "", ip: ""}]},
        });
        expect(screen.getAllByText("203.0.113.4")).toHaveLength(1);
    });

    it("renders every object in the array, including {}", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetEmbeddedItemsList", "geolocation", {
            fields: [{name: "city", type: "text"}, {name: "ip", type: "text"}],
            compactSummaryFields: ["city"],
        })], {
            data: {geolocation: [{city: "", ip: ""}, {city: ""}, {}]},
        });
        expect(screen.getByText("#1")).toBeInTheDocument();
        expect(screen.getByText("#2")).toBeInTheDocument();
        expect(screen.getByText("#3")).toBeInTheDocument();
        expect(document.querySelectorAll(".tabler-icon-exclamation-mark")).toHaveLength(6);
    });

    it("locks a field the access map does not grant and shows value-not-set for an empty granted field", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetEmbeddedItemsList", "geolocation", {
            cardColumns: 2,
            fields: [
                {name: "city", type: "text", labelKey: "geoCity"},
                {name: "ip", type: "text", labelKey: "geoIp"},
            ],
            compactSummaryFields: ["city"],
        })], {
            data: {geolocation: [{city: "Paris", ip: ""}]},
            access: {geolocation: {keys: {ip: {}}}},
        });
        const cards = propsOf("#DisplayCard");
        const city = cards.find((c) => c.title === "t:geoCity");
        const ip = cards.find((c) => c.title === "t:geoIp");
        expect(city).toMatchObject({locked: true, show: false, value: ""});
        expect(ip).toMatchObject({locked: false, show: true, value: ""});
        expect(screen.queryByText("Paris")).toBeNull();
        expect(screen.getByText("#1")).toBeInTheDocument();
    });

    it("treats a parent grant with no keys as readable children", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetEmbeddedItemsList", "geolocation", {
            cardColumns: 2,
            fields: [{name: "city", type: "text", labelKey: "geoCity"}],
        })], {
            data: {geolocation: [{}]},
            access: {geolocation: {}},
        });
        expect(propsOf("#DisplayCard").find((c) => c.title === "t:geoCity")).toMatchObject({
            locked: false,
            show: true,
            value: "",
        });
    });

    it("compact mode joins the summary fields", () => {
        render(
            <ReferencesViewModeScope storageKey="test-embedded" defaultMode="compact">
                <ViewRenderer
                    nodes={[fieldNode("#SheetEmbeddedItemsList", "rows", {
                        fields: [{name: "who", type: "text"}, {name: "status", type: "text", languageKeyCategory: "st"}],
                        compactSummaryFields: ["who", "status"],
                    })]}
                    ctx={{mode: "sheet", resolveLanguageKey: t, data: {rows: [{who: "Ana", status: "done"}]}}}
                />
            </ReferencesViewModeScope>,
        );
        localStorage.removeItem("test-embedded");
        expect(screen.getByText("Ana")).toBeInTheDocument();
        expect(screen.getByText(/t:st\.done/)).toBeInTheDocument();
    });

    it("is also usable as a #DisplayCard bodyWidget", () => {
        renderSheetWith(ViewRenderer, [{
            render: "#DisplayCard",
            field: {name: "rows", widget: "#DisplayCard", label: "rows", widgetProps: {bodyWidget: "#SheetEmbeddedItemsList", fields: [{name: "who", type: "text"}]}},
        }], {data: {rows: [{who: "Body"}]}});
        const {value} = lastProps("#DisplayCard");
        expect(isValidElement(value)).toBe(true);
        render(<>{value}</>);
        expect(screen.getByText("Body")).toBeInTheDocument();
    });
});

describe("#ExpandableText", () => {
    it("formats FAQ blocks, string lists and JSON; strips its own props", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#ExpandableText", "faq", {valueType: "faqBlock", className: "c"})], {
            data: {faq: [{question: "Q1", answer: "A1"}, {question: "", answer: ""}, {answer: "A2"}]},
        });
        const faq = lastProps("#ExpandableText");
        expect(faq.children).toBe("Q: Q1\nA: A1\n\nA: A2");
        expect(faq).toMatchObject({className: "c", show: true});
        expect("valueType" in faq).toBe(false);

        renderSheetWith(ViewRenderer, [fieldNode("#ExpandableText", "list")], {data: {list: ["a", "b"]}});
        expect(lastProps("#ExpandableText").children).toBe("• a\n• b");

        renderSheetWith(ViewRenderer, [fieldNode("#ExpandableText", "obj", {format: "json"})], {data: {obj: {a: 1}}});
        expect(lastProps("#ExpandableText").children).toBe('{\n  "a": 1\n}');
        expect("format" in lastProps("#ExpandableText")).toBe(false);

        renderSheetWith(ViewRenderer, [fieldNode("#ExpandableText", "faq", {valueType: "faqBlock"})], {data: {faq: [{}]}});
        expect(lastProps("#ExpandableText").children).toBeNull();
    });
});

describe("media", () => {
    it("#SheetMediaFilesStrip normalizes one media, a list, or an id string", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetMediaFilesStrip", "media", {canRemove: true, isBig: true, className: "k"}, {fieldExtra: {label: "files"}})], {
            data: {media: [{_id: "m1"}, "skip-me", {_id: "m2"}]},
        });
        expect(lastProps("#SheetMediaFilesStrip")).toMatchObject({
            media: [{_id: "m1"}, {_id: "m2"}],
            canDownload: true,
            canRemove: true,
            isBig: true,
            className: "k",
            resolveLanguageKey: t,
        });
        expect(screen.getByText("t:files")).toBeInTheDocument();

        renderSheetWith(ViewRenderer, [fieldNode("#SheetMediaFilesStrip", "logo")], {data: {logo: "m3"}});
        expect(lastProps("#SheetMediaFilesStrip").media).toEqual([{_id: "m3"}]);
    });

    it("#SheetMediaFilesStrip combines fields, de-duplicates ids and skips unreadable paths", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetMediaFilesStrip", "media", {combineFromFields: ["a", "b", "secret"], canDownload: false})], {
            data: {a: [{_id: "m1"}, "m2"], b: {_id: "m1"}, secret: [{_id: "s"}]},
            access: {a: true, b: true},
        });
        expect(lastProps("#SheetMediaFilesStrip")).toMatchObject({media: [{_id: "m1"}, {_id: "m2"}], canDownload: false});
    });

    it("#SheetMediaFilesStrip shows the empty state, and hides without read access", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetMediaFilesStrip", "media", {}, {fieldExtra: {label: "files"}})], {data: {media: []}});
        expect(propsOf("#SheetMediaFilesStrip")).toHaveLength(0);
        expect(screen.getByText("t:files")).toBeInTheDocument();

        const {container} = renderSheetWith(ViewRenderer, [fieldNode("#SheetMediaFilesStrip", "media")], {data: {media: [{_id: "m"}]}, access: {other: true}});
        expect(container.innerHTML).toBe("");
    });

    it("#SheetMediaAvatar resolves the media id and name", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetMediaAvatar", "logo", {nameField: "title", className: "c"})], {
            data: {logo: {_id: "m1"}, title: "Acme"},
        });
        expect(lastProps("#SheetMediaAvatar")).toMatchObject({mediaId: "m1", name: "Acme", className: "c"});

        renderSheetWith(ViewRenderer, [fieldNode("#SheetMediaAvatar", "logo")], {data: {logo: "m2", name: 5}});
        expect(lastProps("#SheetMediaAvatar")).toMatchObject({mediaId: "m2", name: ""});
    });

    it("#GalleryCarousel gates each gallery by access and folds an array main image into the gallery", () => {
        const wp = {imageGalleryField: "images", videoGalleryField: "videos", icon: "#Photo", autoplay: true};
        renderSheetWith(ViewRenderer, [fieldNode("#GalleryCarousel", "main", wp)], {
            data: {main: [{_id: "i0"}], images: [], videos: [{_id: "v1"}]},
        });
        expect(lastProps("#GalleryCarousel")).toMatchObject({mainImage: null, imageGallery: [{_id: "i0"}], videoGallery: [{_id: "v1"}], autoplay: true});
        expect("icon" in lastProps("#GalleryCarousel")).toBe(false);

        renderSheetWith(ViewRenderer, [fieldNode("#GalleryCarousel", "main", wp)], {
            data: {main: {_id: "m"}, images: [{_id: "i1"}], videos: [{_id: "v1"}]},
            access: {images: true},
        });
        expect(lastProps("#GalleryCarousel")).toMatchObject({mainImage: null, imageGallery: [{_id: "i1"}], videoGallery: []});

        resetCalls();
        const {container} = renderSheetWith(ViewRenderer, [fieldNode("#GalleryCarousel", "main", wp)], {data: {main: "m"}, access: {other: true}});
        expect(container.innerHTML).toBe("");

        renderSheetWith(ViewRenderer, [fieldNode("#GalleryCarousel", "main")], {data: {}});
        expect(propsOf("#GalleryCarousel")).toHaveLength(0);
    });
});

describe("simple fields", () => {
    it("#SheetLocationMap uses addressField, or the entity itself for '.'", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#SheetLocationMap", "x", {className: "h-40"})], {data: {address: {latitude: 1}}});
        expect(lastProps("#SheetLocationMap")).toMatchObject({address: {latitude: 1}, className: "h-40"});

        const data = {latitude: 2};
        renderSheetWith(ViewRenderer, [fieldNode("#SheetLocationMap", "x", {addressField: "."})], {data});
        expect(lastProps("#SheetLocationMap").address).toBe(data);

        resetCalls();
        renderSheetWith(ViewRenderer, [fieldNode("#SheetLocationMap", "x")], {data: {}});
        expect(propsOf("#SheetLocationMap")).toHaveLength(0);
    });

    it("#CountryFlag prefers the field value over widgetProps.code", () => {
        renderSheetWith(ViewRenderer, [fieldNode("#CountryFlag", "code", {code: "IT"})], {data: {code: "AL"}});
        expect(lastProps("#CountryFlag").code).toBe("AL");
        renderSheetWith(ViewRenderer, [fieldNode("#CountryFlag", "code", {code: "IT"})], {data: {}});
        expect(lastProps("#CountryFlag").code).toBe("IT");
        resetCalls();
        renderSheetWith(ViewRenderer, [fieldNode("#CountryFlag", "code")], {data: {}});
        expect(propsOf("#CountryFlag")).toHaveLength(0);
    });

    it("#Badge prefers widgetProps.children over the field value", () => {
        const {container} = renderSheetWith(ViewRenderer, [fieldNode("#Badge", "status", {variant: "secondary"})], {data: {status: 3}});
        expect(within(container).getByText("3")).toBeInTheDocument();
        expect(lastProps("#Badge").variant).toBe("secondary");

        renderSheetWith(ViewRenderer, [fieldNode("#Badge", "status", {children: "Fixed"})], {data: {status: "open"}});
        expect(screen.getByText("Fixed")).toBeInTheDocument();

        resetCalls();
        renderSheetWith(ViewRenderer, [fieldNode("#Badge", "status")], {data: {status: {nested: true}}});
        expect(propsOf("#Badge")).toHaveLength(0);
    });
});
