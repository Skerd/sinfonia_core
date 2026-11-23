import type {CompanyTreeNode} from "armonia/src/modules/core/api/platform/private/companies/platformModules.dto.ts";

/** The companies that signed themselves up through one source (P23.9). */
export type SignupSourceGroup = {
    /** The company whose site's "Powered by" link brought them; absent for sign-ups on the portal itself. */
    sourceId?: string;
    /** That company, while it is still on the platform. */
    source?: CompanyTreeNode;
    companies: CompanyTreeNode[];
};

/**
 * The self-serve companies grouped by the source that brought them: the source with the most sign-ups first, then by
 * name (the portal first on a tie). The companies keep the order given (the server sorts by name).
 */
export function signupSourceGroups(companies: CompanyTreeNode[]): SignupSourceGroup[] {
    const byId = new Map(companies.map((company) => [company._id, company]));
    const groups = new Map<string, SignupSourceGroup>();
    for (const company of companies) {
        if (company.signupSource?.via !== "selfServe") continue;
        const sourceId = company.signupSource.refCompany;
        const key = sourceId ?? "";
        let group = groups.get(key);
        if (!group) {
            const source = sourceId ? byId.get(sourceId) : undefined;
            group = {...(sourceId ? {sourceId} : {}), ...(source ? {source} : {}), companies: []};
            groups.set(key, group);
        }
        group.companies.push(company);
    }
    const nameOf = (group: SignupSourceGroup) => group.sourceId ? group.source?.name ?? group.sourceId : "";
    return [...groups.values()].sort((a, b) => b.companies.length - a.companies.length || nameOf(a).localeCompare(nameOf(b)));
}
