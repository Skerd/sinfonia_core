import type {CompanyTreeNode} from "armonia/src/modules/core/api/platform/private/companies/platformModules.dto.ts";
import type {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";

/** A company with the companies created under it. */
export type CompanyBranch = {
    company: CompanyTreeNode;
    children: CompanyBranch[];
    /** The companies right under it, and every company below it at any depth; a search keeps both whole. */
    subsidiaries: number;
    descendants: number;
};

/**
 * Hangs every company under the company it was created under. The platform comes first, then the other roots in the
 * order given (the server sorts by name). A company whose parent is not in the list (deleted, or unreadable) becomes a
 * root, and so does one caught in a parent loop, so every company shows exactly once.
 */
export function buildCompanyTree(companies: CompanyTreeNode[]): CompanyBranch[] {
    const ids = new Set(companies.map((company) => company._id));
    const childrenOf = new Map<string, CompanyTreeNode[]>();
    for (const company of companies) {
        if (!company.parentCompany || !ids.has(company.parentCompany)) continue;
        childrenOf.set(company.parentCompany, [...(childrenOf.get(company.parentCompany) ?? []), company]);
    }

    const placed = new Set<string>();
    const grow = (company: CompanyTreeNode): CompanyBranch => {
        placed.add(company._id);
        const children = (childrenOf.get(company._id) ?? []).filter((child) => !placed.has(child._id)).map(grow);
        return {company, children, subsidiaries: children.length, descendants: children.reduce((sum, child) => sum + 1 + child.descendants, 0)};
    };

    const isRoot = (company: CompanyTreeNode) => !company.parentCompany || !ids.has(company.parentCompany);
    const roots = [...companies.filter((company) => isRoot(company) && company.isPlatformOwner), ...companies.filter((company) => isRoot(company) && !company.isPlatformOwner)].map(grow);
    // Only a parent loop leaves companies unplaced; the first of each loop stands in as its root.
    for (const company of companies) {
        if (!placed.has(company._id)) roots.push(grow(company));
    }
    return roots;
}

/**
 * The branches with a company whose name or VAT contains `query` (any case), each kept with the path down to it. A
 * matching company keeps only its matching children, so a search reads as a list of hits in place.
 */
export function filterCompanyTree(roots: CompanyBranch[], query: string): CompanyBranch[] {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return roots;
    const keep = (branch: CompanyBranch): CompanyBranch | null => {
        const children = branch.children.map(keep).filter((child): child is CompanyBranch => child !== null);
        if (!companyMatches(branch.company, needle) && children.length === 0) return null;
        return {...branch, children};
    };
    return roots.map(keep).filter((branch): branch is CompanyBranch => branch !== null);
}

export function companyMatches(company: CompanyTreeNode, needle: string): boolean {
    return [company.name, company.vat].some((value) => value?.toLocaleLowerCase().includes(needle) === true);
}

/** How many companies, how many levels deep, and how many inactive. */
export function companyTreeStats(roots: CompanyBranch[]): {companies: number; levels: number; inactive: number} {
    let companies = 0;
    let levels = 0;
    let inactive = 0;
    const walk = (branch: CompanyBranch, depth: number) => {
        companies += 1;
        levels = Math.max(levels, depth);
        if (branch.company.isActive === false) inactive += 1;
        for (const child of branch.children) walk(child, depth + 1);
    };
    for (const root of roots) walk(root, 1);
    return {companies, levels, inactive};
}

/** The ids of every branch that has children: the set a fully expanded tree keeps open. */
export function branchIds(roots: CompanyBranch[]): string[] {
    return roots.flatMap((branch) => branch.children.length > 0 ? [branch.company._id, ...branchIds(branch.children)] : []);
}

/** `{key}.one` or `{key}.other` with the count filled in. */
export function counted(t: WithLanguageType["resolveLanguageKey"], key: string, count: number): string {
    return String(t(`${key}.${count === 1 ? "one" : "other"}`)).replace("{count}", String(count));
}
