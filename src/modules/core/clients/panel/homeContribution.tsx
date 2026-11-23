import type {HomeContribution} from "@coreModule/helpers/types/homeContribution.types.ts";

/** The company's own edit form, where its logo and NIPT/VAT are set (the "Edit" of Company → info). */
function companyEditPage(company: {id: string; name: string}): string {
    return `/tenancy/systemSettings/companies/edit?${new URLSearchParams({companyId: company.id, companyName: company.name})}`;
}

/**
 * What every company sets up (D178): its logo, its NIPT/VAT (needed for the portal's Verified mark) and its team. The
 * modules add their own steps after these. Each step's guide (D179) points at its fields; `home.guide.save*` is the
 * closing tip every module's guide may reuse.
 */
const contribution: HomeContribution = {
    id: "core",
    order: 1,
    getSetupSteps: ({resolveLanguageKey: t, company}) => {
        const save = {target: "form.save", title: t("home.guide.saveTitle"), text: t("home.guide.saveText")};
        return [
            {
                key: "core.logo",
                title: t("home.setup.logo"),
                to: companyEditPage(company),
                accessModel: "companies",
                doneWhen: {company: (record) => !!record.logo},
                guide: [{target: "field.logo", title: t("home.guide.core.logoTitle"), text: t("home.guide.core.logoText")}, save],
            },
            {
                key: "core.vat",
                title: t("home.setup.vat"),
                description: t("home.setup.vatHint"),
                to: companyEditPage(company),
                accessModel: "companies",
                doneWhen: {company: (record) => typeof record.vat === "string" && record.vat.trim() !== ""},
                guide: [{target: "field.vat", title: t("home.guide.core.vatTitle"), text: t("home.guide.core.vatText")}, save],
            },
            {
                key: "core.team",
                title: t("home.setup.team"),
                to: "/company/administration",
                accessModel: "users",
                // The staff list (`administration: true`) leaves out the viewer and holds the company's bot: someone else
                // on the team makes two.
                doneWhen: {list: {url: "/api/company/users", params: {administration: true}, minTotal: 2}},
                guide: [{target: "users.invite", title: t("home.guide.core.teamTitle"), text: t("home.guide.core.teamText")}],
            },
        ];
    },
};

export default contribution;
