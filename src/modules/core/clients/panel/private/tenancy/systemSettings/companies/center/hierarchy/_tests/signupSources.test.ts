import {describe, expect, it} from "vitest";
import type {CompanyTreeNode} from "armonia/src/modules/core/api/platform/private/companies/platformModules.dto.ts";
import {signupSourceGroups} from "../signupSources.ts";

const node = (id: string, name: string, extra: Partial<CompanyTreeNode> = {}): CompanyTreeNode => ({_id: id, name, isPlatformOwner: false, ...extra});
const via = (refCompany?: string): CompanyTreeNode["signupSource"] => ({via: "selfServe", ...(refCompany ? {refCompany} : {})});

describe("sign-ups per source", () => {
    it("groups the self-serve companies by the site that brought them, the biggest source first", () => {
        const rental = node("r", "Rental Co");
        const clinic = node("c", "Clinic Co");
        const groups = signupSourceGroups([
            node("p", "Platform", {isPlatformOwner: true}),
            rental,
            clinic,
            node("a", "Alpha", {signupSource: via("c")}),
            node("b", "Beta", {signupSource: via()}),
            node("d", "Delta", {signupSource: via("r")}),
            node("e", "Echo", {signupSource: via("r")}),
        ]);
        expect(groups.map((group) => [group.source?.name ?? group.sourceId ?? "portal", group.companies.map((company) => company.name)])).toEqual([
            ["Rental Co", ["Delta", "Echo"]],
            ["portal", ["Beta"]],
            ["Clinic Co", ["Alpha"]],
        ]);
    });

    it("keeps a source that is no longer listed by its id, and leaves out the companies the platform created", () => {
        const groups = signupSourceGroups([node("x", "Gone fan", {signupSource: via("missing")}), node("y", "Created")]);
        expect(groups).toEqual([{sourceId: "missing", companies: [node("x", "Gone fan", {signupSource: via("missing")})]}]);
    });

    it("is empty when no company signed itself up", () => {
        expect(signupSourceGroups([node("p", "Platform", {isPlatformOwner: true})])).toEqual([]);
    });
});
