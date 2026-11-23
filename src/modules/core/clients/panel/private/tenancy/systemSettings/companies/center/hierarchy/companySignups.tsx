import {compose} from "redux";
import {useMemo, useState} from "react";
import {IconLink, IconUserPlus, IconWorld} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios from "@coreModule/helpers/hocs/withAxios.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from "@coreModule/components/ui/empty.tsx";
import CompanySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/sheetView/companySheetView.tsx";
import type {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import type {CompanyTreeNode, CompanyTreeResponse} from "armonia/src/modules/core/api/platform/private/companies/platformModules.dto.ts";
import {CompanyAvatar, StatChip} from "./companyHierarchy.tsx";
import {counted} from "./companyTree.ts";
import {signupSourceGroups, type SignupSourceGroup} from "./signupSources.ts";

type CompanySignupsProps = WithLanguageType & {companyTree: CompanyTreeResponse | null};

/**
 * The companies that signed themselves up, counted by the source that brought them (P23.9): the portal itself, or a
 * company's site through its "Powered by" link. A company opens its sheet, with the same actions as the list.
 */
function CompanySignups({companyTree, resolveLanguageKey: t}: CompanySignupsProps) {
    // What the sheet's actions changed since the list loaded, by company.
    const [patches, setPatches] = useState<Record<string, Partial<CompanyTreeNode>>>({});
    const [opened, setOpened] = useState<CompanyTreeNode | null>(null);

    const companies = useMemo(
        () => (companyTree?.data ?? []).map((company) => ({...company, ...patches[company._id]})),
        [companyTree, patches],
    );
    const groups = useMemo(() => signupSourceGroups(companies), [companies]);
    const total = groups.reduce((sum, group) => sum + group.companies.length, 0);
    const sourceName = (group: SignupSourceGroup) => group.sourceId ? group.source?.name ?? String(t("sourceRemoved")) : String(t("portal"));
    const patchOpened = (patch: Partial<CompanyTreeNode>) => {
        if (!opened) return;
        setPatches((current) => ({...current, [opened._id]: {...current[opened._id], ...patch}}));
    };

    return (
        <div className="flex w-full min-w-0 max-w-4xl flex-col gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
                <StatChip icon={<IconUserPlus aria-hidden />}>{counted(t, "signupsCount", total)}</StatChip>
                <StatChip icon={<IconLink aria-hidden />}>{counted(t, "sourcesCount", groups.length)}</StatChip>
            </div>

            <div className="rounded-2xl border bg-muted/30 p-3 md:p-5">
                {groups.length > 0 ? (
                    <ul aria-label={String(t("title"))} className="flex flex-col gap-3">
                        {groups.map((group) => (
                            <li key={group.sourceId ?? "portal"} className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-xs">
                                <div className="flex min-w-0 items-center gap-3">
                                    {group.sourceId ? (
                                        <CompanyAvatar name={group.source?.name ?? ""} logo={group.source?.logo} className="size-9" />
                                    ) : (
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary [&>svg]:size-5">
                                            <IconWorld aria-hidden />
                                        </span>
                                    )}
                                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className="truncate font-medium">{sourceName(group)}</span>
                                        <span className="truncate text-xs text-muted-foreground">{t(group.sourceId ? "viaSite" : "viaPortal")}</span>
                                    </div>
                                    <Badge variant="secondary" className="shrink-0">{counted(t, "signupsCount", group.companies.length)}</Badge>
                                </div>
                                <ul aria-label={String(t("companiesFrom")).replace("{source}", sourceName(group))} className="flex flex-wrap gap-1.5">
                                    {group.companies.map((company) => (
                                        <li key={company._id} className="min-w-0 max-w-full">
                                            <Button type="button" variant="outline" size="sm" className="max-w-full" onClick={() => setOpened(company)}>
                                                <span className="truncate">{company.name}</span>
                                                {company.portalApprovalStatus === "pending" ? <Badge variant="secondary">{t("awaitingApproval")}</Badge> : null}
                                                {company.portalApprovalStatus === "rejected" ? <Badge variant="destructive">{t("approvalRejected")}</Badge> : null}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon"><IconUserPlus /></EmptyMedia>
                            <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
                            <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}
            </div>

            {opened ? (
                <CompanySheetView
                    open
                    onOpenChange={(next: boolean) => {
                        if (!next) setOpened(null);
                    }}
                    fetchId={opened._id}
                    hideEdit
                    onActivateSuccess={() => patchOpened({isActive: true})}
                    onDeactivateSuccess={() => patchOpened({isActive: false})}
                    onCompanyPatched={(patch: Partial<Company>) => {
                        if (patch.portalApproval) patchOpened({portalApprovalStatus: patch.portalApproval.status});
                    }}
                />
            ) : null}
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/hierarchy/companySignups.tsx"))(
    withAxios<CompanyTreeResponse, Record<string, unknown>, "companyTree">(
        {url: "/api/platform/companies/tree", method: "GET", data: {}},
        false,
        "companyTree",
    )<WithLanguageType>(CompanySignups),
);
