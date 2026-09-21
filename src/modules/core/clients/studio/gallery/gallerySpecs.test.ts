import {beforeEach, describe, expect, it, vi} from "vitest";
import {CORE_WIDGET_META, type WidgetMeta} from "@coreModule/components/viewEngine/widgetMeta.ts";

const registeredTokens = vi.hoisted(() => ({current: [] as string[]}));
const metaByToken = vi.hoisted(() => ({current: {} as Record<string, unknown>}));

vi.mock("@coreModule/components/viewEngine/widgetRegistry.ts", () => ({
    getRegisteredWidgetTokens: () => registeredTokens.current,
    getWidgetMeta: (token: string) => metaByToken.current[token],
    getReferencesDefaultItemProp: () => undefined,
}));

const {
    formDefaultValues,
    formViewConfig,
    isOverlayToken,
    listGalleryEntries,
    sheetRow,
    sheetViewConfig,
} = await import("./gallerySpecs.ts");

function registry(tokens: string[], meta: Record<string, WidgetMeta> = CORE_WIDGET_META) {
    registeredTokens.current = tokens;
    metaByToken.current = meta;
}

beforeEach(() => {
    registry([]);
});

describe("isOverlayToken", () => {
    it("treats linked sheet widgets as overlays", () => {
        expect(isOverlayToken("#CountrySheetView")).toBe(true);
        expect(isOverlayToken("#DisplayCard")).toBe(false);
    });
});

describe("listGalleryEntries", () => {
    it("skips HTML tags and lists each registered token once", () => {
        registry(["#Input", "#DisplayCard", "#CountrySheetView"]);
        const entries = listGalleryEntries();
        expect(entries.map((e) => e.token)).toEqual(["#Input", "#DisplayCard", "#CountrySheetView"]);
        expect(entries.find((e) => e.token === "div")).toBeUndefined();
    });

    it("marks *SheetView as overlay-only", () => {
        registry(["#CountrySheetView"]);
        const [entry] = listGalleryEntries();
        expect(entry?.overlay).toBe(true);
        expect(entry?.form).toBe(false);
        expect(entry?.sheet).toBe(true);
        expect(entry?.entityCard).toBe(false);
    });

    it("mounts *Card tokens as entity cards, not form fields", () => {
        registry(["#CategoryCard"]);
        const [entry] = listGalleryEntries();
        expect(entry?.entityCard).toBe(true);
        expect(entry?.form).toBe(false);
        expect(entry?.sheet).toBe(true);
        expect(entry?.overlay).toBe(false);
    });

    it("keeps #UnitCard as a form compound plus entity card", () => {
        registry(["#UnitCard"]);
        const [entry] = listGalleryEntries();
        expect(entry?.entityCard).toBe(true);
        expect(entry?.form).toBe(true);
        expect(entry?.sheet).toBe(true);
    });

    it("does not mount form-only compounds as sheets", () => {
        registry(["#FormFloorPolygon", "#LocalDiscountField", "#PaymentPlanInstallmentsField"]);
        const byToken = Object.fromEntries(listGalleryEntries().map((e) => [e.token, e]));
        expect(byToken["#FormFloorPolygon"]).toMatchObject({form: true, sheet: false, overlay: false});
        expect(byToken["#LocalDiscountField"]).toMatchObject({form: true, sheet: false});
        expect(byToken["#PaymentPlanInstallmentsField"]).toMatchObject({form: true, sheet: false});
    });

    it("does not mount undescribed #Sheet* widgets as forms", () => {
        registry(["#SheetPriceHistoryChart", "#SheetModificationLineItems"]);
        const byToken = Object.fromEntries(listGalleryEntries().map((e) => [e.token, e]));
        expect(byToken["#SheetPriceHistoryChart"]).toMatchObject({form: false, sheet: true, overlay: false});
        expect(byToken["#SheetModificationLineItems"]).toMatchObject({form: false, sheet: true});
    });

    it("reads form vs sheet from metadata", () => {
        registry(["#Input", "#DisplayCard"]);
        const byToken = Object.fromEntries(listGalleryEntries().map((e) => [e.token, e]));
        expect(byToken["#Input"]?.form).toBe(true);
        expect(byToken["#Input"]?.sheet).toBe(false);
        expect(byToken["#DisplayCard"]?.form).toBe(false);
        expect(byToken["#DisplayCard"]?.sheet).toBe(true);
    });
});

describe("synthetic configs", () => {
    it("binds a form input through #Field, the same shape *.views.ts uses", () => {
        const config = formViewConfig("#Input");
        expect(config.viewType).toBe("form");
        expect(config.viewMode).toBe("create");
        expect(config.nodes[0]).toMatchObject({
            render: "#Field",
            field: {name: "value", widget: "#Input"},
        });
        expect(formDefaultValues("#Input").value).toBe("Sample");
    });

    it("seeds SimpleSelect options so the widget is not an empty trigger", () => {
        const node = formViewConfig("#SimpleSelect").nodes[0];
        expect(node?.field?.widgetProps?.options).toEqual(
            expect.arrayContaining([{value: "alpha", label: "Alpha"}]),
        );
        expect(formDefaultValues("#SimpleSelect").choice).toBe("alpha");
    });

    it("seeds EmbeddedAddressCard and SheetEmbeddedItemsList so they are not empty", () => {
        const addressNode = sheetViewConfig("#EmbeddedAddressCard").nodes[0];
        expect(addressNode?.field?.widgetProps?.address).toEqual(
            expect.objectContaining({
                street: expect.any(String),
                latitude: expect.any(Number),
                country: expect.objectContaining({name: expect.any(String)}),
            }),
        );
        expect(sheetRow("#EmbeddedAddressCard").address).toEqual(
            expect.objectContaining({street: expect.any(String)}),
        );

        const itemsNode = sheetViewConfig("#SheetEmbeddedItemsList").nodes[0];
        expect(itemsNode?.field?.widgetProps?.fields).toEqual(
            expect.arrayContaining([expect.objectContaining({name: "name", type: "text"})]),
        );
        expect(sheetRow("#SheetEmbeddedItemsList").items).toEqual(
            expect.arrayContaining([expect.objectContaining({name: "Website"})]),
        );
    });

    it("gives a sheet DisplayCard a value the renderer can resolve", () => {
        const config = sheetViewConfig("#DisplayCard");
        expect(config.viewType).toBe("sheet");
        expect(config.nodes[0]).toMatchObject({
            render: "#DisplayCard",
            field: {name: "value", widget: "#DisplayCard"},
        });
        expect(sheetRow("#DisplayCard").value).toBe("Sample");
    });

    it("nests a sample field under layout containers so they are not empty boxes", () => {
        const formGrid = formViewConfig("#FormGrid").nodes[0];
        expect(formGrid?.render).toBe("#FormGrid");
        expect(formGrid?.children?.[0]?.field?.widget).toBe("#Input");

        const sheetGroup = sheetViewConfig("#SheetGroup").nodes[0];
        expect(sheetGroup?.render).toBe("#SheetGroup");
        expect(sheetGroup?.children?.[0]?.field?.widget).toBe("#DisplayCard");
    });

    it("pairs FormWhenFieldValueIn with a switch the condition can watch", () => {
        const config = formViewConfig("#FormWhenFieldValueIn");
        const nodes = config.nodes[0]?.children ?? [];
        expect(nodes[0]?.field).toMatchObject({name: "enabled", widget: "#Switch"});
        expect(nodes[1]).toMatchObject({
            render: "#FormWhenFieldValueIn",
            props: {watchField: "enabled", whenNonEmpty: true},
        });
        expect(formDefaultValues("#FormWhenFieldValueIn").enabled).toBe(true);
    });
});
