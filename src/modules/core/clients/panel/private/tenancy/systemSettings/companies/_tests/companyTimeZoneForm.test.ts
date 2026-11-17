import {describe, expect, it, vi} from "vitest";
import type {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import type {CreateCompanyFormType, EditCompanyFormType} from "armonia/src/modules/core/api/company/private/company/company.schema-def.ts";

type EditPageConfig = {
    buildInitialValues: (dto: Company, writeFields: Record<string, unknown>) => Partial<EditCompanyFormType>;
    mapSubmitPayload: (data: EditCompanyFormType, helpers: {writeFields: Record<string, unknown>; params: URLSearchParams}) => FormData;
};
type CreatePageConfig = {mapSubmitPayload: (data: CreateCompanyFormType) => FormData};

// The pages hand their config to the core page factories; capture it to check what the forms load and send.
const pages = vi.hoisted(() => ({edit: {} as EditPageConfig, create: {} as CreatePageConfig}));
vi.mock("@coreModule/components/entityPage/pages/createGenericEditPage.tsx", () => ({
    createGenericEditPage: (config: EditPageConfig) => {
        pages.edit = config;
        return () => null;
    },
}));
vi.mock("@coreModule/components/entityPage/pages/createGenericCreatePage.tsx", () => ({
    createGenericCreatePage: (config: CreatePageConfig) => {
        pages.create = config;
        return () => null;
    },
}));

await import("../editCompany.tsx");
await import("../createCompany.tsx");

function sentBody(formData: FormData): Record<string, unknown> {
    return JSON.parse(String(formData.get("data")));
}

const company = {_id: "c1", name: "Kudoo Market", vat: "Z1", timezone: "Europe/Tirane"} as Company;
const helpers = {writeFields: {}, params: new URLSearchParams()};

describe("company form time zone (D91)", () => {
    it("loads the stored zone into the edit form when the user may write it", () => {
        expect(pages.edit.buildInitialValues(company, {timezone: {}}).timezone).toBe("Europe/Tirane");
        expect(pages.edit.buildInitialValues(company, {}).timezone).toBeUndefined();
    });

    it("sends the edited zone, and an emptied one as \"\" so the server clears it", () => {
        const edited = {_id: "c1", name: "Kudoo Market", vat: "Z1", timezone: "Europe/Zurich"} as EditCompanyFormType;
        expect(sentBody(pages.edit.mapSubmitPayload(edited, helpers)).timezone).toBe("Europe/Zurich");
        expect(sentBody(pages.edit.mapSubmitPayload({...edited, timezone: ""}, helpers)).timezone).toBe("");
    });

    it("sends the zone picked when creating a company", () => {
        const created = {name: "New Co", vat: "Z9", timezone: "Europe/Tirane"} as CreateCompanyFormType;
        expect(sentBody(pages.create.mapSubmitPayload(created)).timezone).toBe("Europe/Tirane");
    });
});
