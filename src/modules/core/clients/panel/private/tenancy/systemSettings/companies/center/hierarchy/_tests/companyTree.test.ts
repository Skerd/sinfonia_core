import {describe, expect, it} from "vitest";
import type {CompanyTreeNode} from "armonia/src/modules/core/api/platform/private/companies/platformModules.dto.ts";
import {branchIds, buildCompanyTree, companyTreeStats, filterCompanyTree, type CompanyBranch} from "../companyTree.ts";

const company = (_id: string, parentCompany?: string, extra: Partial<CompanyTreeNode> = {}): CompanyTreeNode =>
    ({_id, name: _id, isPlatformOwner: false, isActive: true, ...(parentCompany ? {parentCompany} : {}), ...extra});

/** The tree as nested ids, so a failure shows its shape. */
const shape = (roots: CompanyBranch[]): unknown[] =>
    roots.map((branch) => branch.children.length ? {[branch.company._id]: shape(branch.children)} : branch.company._id);

describe("the company hierarchy", () => {
    it("hangs each company under the company it was created under, the platform first", () => {
        const roots = buildCompanyTree([
            company("Alpha"),
            company("Branch", "Group"),
            company("Group", "Platform"),
            company("Platform", undefined, {isPlatformOwner: true}),
            company("Shop", "Platform"),
        ]);
        expect(shape(roots)).toEqual([{Platform: [{Group: ["Branch"]}, "Shop"]}, "Alpha"]);
        expect(roots[0].descendants).toBe(3);
    });

    it("makes a company whose parent is gone a root", () => {
        expect(shape(buildCompanyTree([company("Orphan", "Deleted"), company("Platform", undefined, {isPlatformOwner: true})])))
            .toEqual(["Platform", "Orphan"]);
    });

    it("shows every company of a parent loop once", () => {
        const roots = buildCompanyTree([company("A", "B"), company("B", "A"), company("Self", "Self")]);
        expect(shape(roots)).toEqual([{A: ["B"]}, "Self"]);
        expect(companyTreeStats(roots).companies).toBe(3);
    });

    it("keeps the path down to each search hit, by name or VAT", () => {
        const roots = buildCompanyTree([
            company("Platform", undefined, {isPlatformOwner: true}),
            company("Group", "Platform"),
            company("Tirana Branch", "Group"),
            company("Durres Branch", "Group", {vat: "L91"}),
            company("Shop", "Platform"),
        ]);
        const hits = filterCompanyTree(roots, "tirana");
        expect(shape(hits)).toEqual([{Platform: [{Group: ["Tirana Branch"]}]}]);
        // The counts stay the real ones: the platform still has two companies under it, four in all.
        expect([hits[0].subsidiaries, hits[0].descendants]).toEqual([2, 4]);
        expect(shape(filterCompanyTree(roots, " l91 "))).toEqual([{Platform: [{Group: ["Durres Branch"]}]}]);
        expect(filterCompanyTree(roots, "nothing")).toEqual([]);
        expect(filterCompanyTree(roots, "  ")).toBe(roots);
    });

    it("counts companies, levels and inactive companies, and lists the branches to expand", () => {
        const roots = buildCompanyTree([
            company("Platform", undefined, {isPlatformOwner: true}),
            company("Group", "Platform", {isActive: false}),
            company("Branch", "Group"),
        ]);
        expect(companyTreeStats(roots)).toEqual({companies: 3, levels: 3, inactive: 1});
        expect(branchIds(roots)).toEqual(["Platform", "Group"]);
    });
});
