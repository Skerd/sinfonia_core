import {useLayoutEffect} from "react";
import {useSearchParams} from "react-router-dom";
import {setSiteCompany} from "@coreModule/helpers/apiClient/siteCompany.ts";

/** Keep `?company=` on a path so an apex article stays on that company's posts. */
export function withCompany(path: string, company?: string): string {
    if (!company) return path;
    const [pathname, query = ""] = path.split("?");
    const params = new URLSearchParams(query);
    params.set("company", company);
    return `${pathname}?${params}`;
}

/**
 * The company an apex blog URL names (`?company=`). Its requests carry `x-site-company`,
 * so the public blog API returns only that company's posts. A company host needs no query:
 * the host already is the company.
 */
export function useBlogCompanyQuery(): string | undefined {
    const [params] = useSearchParams();
    const company = params.get("company")?.trim() || undefined;
    useLayoutEffect(() => {
        if (!company) return;
        setSiteCompany(company);
        return () => setSiteCompany(null);
    }, [company]);
    return company;
}
