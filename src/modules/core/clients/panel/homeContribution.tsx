import type {HomeContribution} from "@coreModule/helpers/types/homeContribution.types.ts";

/**
 * What every company sets up (D178): its logo, its NIPT/VAT (needed for the portal's Verified mark) and its team. The
 * modules add their own steps after these.
 */
const contribution: HomeContribution = {
    id: "core",
    order: 1,
    getSetupSteps: ({resolveLanguageKey: t}) => [
        {
            key: "core.logo",
            title: t("home.setup.logo"),
            to: "/company/info",
            accessModel: "companies",
            doneWhen: {company: (company) => !!company.logo},
        },
        {
            key: "core.vat",
            title: t("home.setup.vat"),
            description: t("home.setup.vatHint"),
            to: "/company/info",
            accessModel: "companies",
            doneWhen: {company: (company) => typeof company.vat === "string" && company.vat.trim() !== ""},
        },
        {
            key: "core.team",
            title: t("home.setup.team"),
            to: "/company/administration",
            accessModel: "users",
            // The staff list (`administration: true`) leaves out the viewer and holds the company's bot: someone else
            // on the team makes two.
            doneWhen: {list: {url: "/api/company/users", params: {administration: true}, minTotal: 2}},
        },
    ],
};

export default contribution;
