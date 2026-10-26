import {afterEach, describe, expect, it} from "vitest";
import {createPortalContributions} from "@coreModule/helpers/moduleContributions/loadPortalContributions.ts";
import {setCompanyModules} from "@coreModule/helpers/modules/enabledModules.ts";

const Site = () => null;
const path = (pkg: string) => `/src/modules/${pkg}/clients/portal/portalContribution.tsx`;

describe("createPortalContributions", () => {
    afterEach(() => {
        setCompanyModules(null);
    });

    it("keeps every section for a portal account, whose own company has only core", () => {
        const list = createPortalContributions({
            [path("carRental")]: {default: {section: "carRental", path: "car-rental", order: 20, CompanySite: Site}},
            [path("eCommerce")]: {default: {section: "shop", path: "shop", order: 10, SectionSite: Site}},
        });
        setCompanyModules([]);
        expect(list().map((entry) => entry.section)).toEqual(["shop", "carRental"]);
    });

    it("rejects an entry without a section path", () => {
        const list = createPortalContributions({[path("x")]: {default: {section: "x"}}});
        expect(() => list()).toThrow(/portalContribution/);
    });
});
