// Loads the real module contributions (no mocks): catches import-order and wiring breaks
// that the mocked engine tests cannot see.
import {describe, expect, it} from "vitest";

const registry = await import("../widgetRegistry.ts");
const {rendersOnEditForm} = await import("../form/writeGate.ts");

describe("widget registry with real contributions", () => {
    it("merges core first, then modules", () => {
        const tokens = registry.getRegisteredWidgetTokens();
        expect(tokens).toEqual(expect.arrayContaining(["#DisplayCard", "#Input", "#SheetGroup"]));
        expect(tokens).toEqual(expect.arrayContaining(["#UnitCard", "#FormFloorPolygon", "#ProjectSheetView"]));
        expect(registry.getWidgetMeta("#DisplayCard")).toBeDefined();
    });

    it("knows core and module compound form widgets and their renderers", () => {
        for (const token of ["#FormRepeater", "#MainImageField", "#FormFloorPolygon", "#UnitCard", "#LocalDiscountField"]) {
            expect(registry.isCompoundFormWidget(token)).toBe(true);
        }
        expect(registry.isCompoundFormWidget("#Input")).toBe(false);
        expect(registry.getCompoundFormWidgetRenderer("#FormRepeater")).toBeTypeOf("function");
        expect(registry.getCompoundFormWidgetRenderer("#FormFloorPolygon")).toBeTypeOf("function");
    });

    it("gates module compound widgets on their contributed write keys", () => {
        const binding = {name: "__floorPolygon", widget: "#FormFloorPolygon"};
        expect(registry.getFormWriteAccessKey("#FormFloorPolygon")).toBe("polygonCoordinates");
        expect(registry.getFormWriteAccessKey("#FormEditMediaField")).toBe("media");
        expect(rendersOnEditForm(binding, (k) => k === "polygonCoordinates")).toBe(true);
        expect(rendersOnEditForm(binding, () => false)).toBe(false);
    });

    it("exposes module sheet renderers, reference props and audit hints", () => {
        expect(registry.getSheetFieldRenderer("#UnitSaleCard")).toBeTypeOf("function");
        expect(registry.getReferencesDefaultItemProp("#InspectionCard")).toBe("inspection");
        expect(registry.getAuditSinglePostHint("#TenancyCountryCard")?.url).toBe("/api/auxiliary/country/single");
        expect(registry.getAuditSinglePostHint("#ProjectSheetView")?.url).toBe("/api/realEstate/project/single");
    });
});
