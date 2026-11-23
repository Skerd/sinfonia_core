import {Link, useSearchParams} from "react-router-dom";
import {compose} from "redux";
import {IconArrowRight, IconLayoutDashboard, IconUsers, IconWorld} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {usePortalSite} from "@coreModule/clients/portal/shared/portalSiteContext.tsx";
import {getPortalContributions, portalBusinessTypesOf} from "@coreModule/helpers/moduleContributions/loadPortalContributions.ts";
import {isValidSiteSlug} from "armonia/src/modules/core/api/company/private/company/siteSlug.ts";

const LANGUAGE_PATH = "src/modules/core/clients/portal/business/index.tsx";

const BENEFITS = [
    {Icon: IconWorld, title: "benefitSiteTitle", text: "benefitSiteText"},
    {Icon: IconUsers, title: "benefitCustomersTitle", text: "benefitCustomersText"},
    {Icon: IconLayoutDashboard, title: "benefitPanelTitle", text: "benefitPanelText"},
] as const;

const STEPS = [
    {title: "stepAccountTitle", text: "stepAccountText"},
    {title: "stepBusinessTitle", text: "stepBusinessText"},
    {title: "stepLiveTitle", text: "stepLiveText"},
] as const;

/** The sign-up page, keeping the company site that sent the visitor here (`ref`, P23.9). */
function newBusinessHref(ref: string | null, type?: string): string {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (ref) params.set("ref", ref);
    const query = params.toString();
    return query ? `/business/new?${query}` : "/business/new";
}

/**
 * The apex's "For businesses" page (D178): why to join, the kinds of business the modules offer, how sign-up goes.
 * A company site's "Powered by" link names that site in `ref`; the sign-up records it.
 */
function ForBusinessesPage({resolveLanguageKey}: WithLanguageType) {
    const {site} = usePortalSite();
    const [searchParams] = useSearchParams();
    const requestedRef = searchParams.get("ref");
    const ref = requestedRef && isValidSiteSlug(requestedRef) ? requestedRef : null;
    const brand = site?.company.name ?? "";
    const businessTypes = portalBusinessTypesOf(getPortalContributions());
    const withBrand = (key: string) => resolveLanguageKey(key).replace("{brand}", brand);

    return (
        <div className="site-container flex flex-col gap-16 py-8 sm:py-12">
            <section className="flex flex-col gap-6 rounded-3xl bg-muted px-6 py-12 sm:px-12 sm:py-16" aria-labelledby="business-heading">
                <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">{resolveLanguageKey("eyebrow")}</p>
                <h1 id="business-heading" className="max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">{withBrand("title")}</h1>
                <p className="max-w-2xl text-lg text-muted-foreground">{withBrand("lead")}</p>
                <div className="flex flex-wrap gap-3">
                    <Button asChild size="lg">
                        <Link to={newBusinessHref(ref)}>{resolveLanguageKey("cta")}<IconArrowRight aria-hidden /></Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <a href="#business-how">{resolveLanguageKey("howLink")}</a>
                    </Button>
                </div>
            </section>

            <section className="grid gap-6 md:grid-cols-3" aria-label={resolveLanguageKey("benefitsLabel")}>
                {BENEFITS.map(({Icon, title, text}) => (
                    <div key={title} className="flex flex-col gap-3 rounded-2xl border p-6">
                        <Icon className="h-7 w-7" aria-hidden />
                        <h2 className="font-semibold">{withBrand(title)}</h2>
                        <p className="text-sm text-muted-foreground">{withBrand(text)}</p>
                    </div>
                ))}
            </section>

            {businessTypes.length > 0 ? (
                <section className="flex flex-col gap-6" aria-labelledby="business-types-heading">
                    <h2 id="business-types-heading" className="font-display text-2xl font-bold tracking-tight">{resolveLanguageKey("typesHeading")}</h2>
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {businessTypes.map(({key, Icon, Summary}) => (
                            <li key={key}>
                                <Link
                                    to={newBusinessHref(ref, key)}
                                    className="flex h-full items-start gap-4 rounded-2xl border p-5 transition-colors hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
                                >
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                                        <Icon className="h-6 w-6" aria-hidden />
                                    </span>
                                    <Summary />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            <section id="business-how" className="flex flex-col gap-6 scroll-mt-24" aria-labelledby="business-how-heading">
                <h2 id="business-how-heading" className="font-display text-2xl font-bold tracking-tight">{resolveLanguageKey("howHeading")}</h2>
                <ol className="grid gap-6 md:grid-cols-3">
                    {STEPS.map(({title, text}, index) => (
                        <li key={title} className="flex flex-col gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground font-semibold text-background" aria-hidden>{index + 1}</span>
                            <h3 className="font-semibold">{resolveLanguageKey(title)}</h3>
                            <p className="text-sm text-muted-foreground">{withBrand(text)}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="flex flex-col items-start gap-4 rounded-3xl border px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-2xl font-bold tracking-tight">{resolveLanguageKey("closingTitle")}</h2>
                    <p className="text-muted-foreground">{resolveLanguageKey("closingText")}</p>
                </div>
                <Button asChild size="lg">
                    <Link to={newBusinessHref(ref)}>{resolveLanguageKey("cta")}</Link>
                </Button>
            </section>
        </div>
    );
}

export default compose(
    withLanguage(LANGUAGE_PATH),
    withDebug(true, true),
)(ForBusinessesPage);
