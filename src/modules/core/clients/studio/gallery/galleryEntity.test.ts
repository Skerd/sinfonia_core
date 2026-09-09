import {describe, expect, it} from "vitest";
import {entityPropName, galleryEntityStub, isEntityCardToken} from "./galleryEntity.ts";

describe("isEntityCardToken", () => {
    it("treats list cards as entity cards", () => {
        expect(isEntityCardToken("#CategoryCard")).toBe(true);
        expect(isEntityCardToken("#UnitCard")).toBe(true);
        expect(isEntityCardToken("#TenancyCountryCard")).toBe(true);
    });

    it("does not treat sheet field widgets that happen to end in Card", () => {
        expect(isEntityCardToken("#DisplayCard")).toBe(false);
        expect(isEntityCardToken("#EmbeddedAddressCard")).toBe(false);
        expect(isEntityCardToken("#Input")).toBe(false);
    });
});

describe("entityPropName", () => {
    it("prefers the registry mapping", () => {
        expect(entityPropName("#CategoryCard", "category")).toBe("category");
    });

    it("uses the tenancy aliases when nothing is registered", () => {
        expect(entityPropName("#TenancyCountryCard", undefined)).toBe("country");
        expect(entityPropName("#UnitSaleCard", undefined)).toBe("sale");
    });

    it("strips Card from the token as a last resort", () => {
        expect(entityPropName("#WarehouseCard", undefined)).toBe("warehouse");
    });
});

describe("galleryEntityStub", () => {
    it("is an object with deletedAt, so EntityCard does not throw", () => {
        const stub = galleryEntityStub();
        expect(stub).toEqual(expect.objectContaining({_id: expect.any(String), name: "Sample"}));
        expect("deletedAt" in stub).toBe(true);
        expect(stub.deletedAt).toBeUndefined();
    });

    it("nests unit so SaleCard and UnitCostCard can read entity.unit", () => {
        const stub = galleryEntityStub();
        expect(stub.unit).toEqual(expect.objectContaining({_id: expect.any(String), unitNumber: "A-101"}));
        expect(stub.paymentType).toBe("cash");
    });
});
