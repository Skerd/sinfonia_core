import {compose} from "redux";
import {Link} from "react-router-dom";
import {ArrowRight} from "lucide-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import PortalSearchForm from "../shared/portalSearchForm.tsx";
import PortalSectionName from "../shared/portalSectionName.tsx";
import {usePortalSections} from "../shared/portalSectionsContext.tsx";
import {PORTAL_CARD, PORTAL_CONTAINER, PORTAL_HEADING} from "../shared/portalStyles.ts";

function PortalHomePage({resolveLanguageKey}: WithLanguageType) {
    const {sections, loading} = usePortalSections();

    return (
        <div className={cn(PORTAL_CONTAINER, "flex flex-col gap-12 py-12 sm:py-16")}>
            <section className="flex flex-col gap-6">
                <div className="max-w-2xl">
                    <h1 className={cn(PORTAL_HEADING, "text-4xl sm:text-5xl")}>{resolveLanguageKey("title")}</h1>
                    <p className="mt-4 text-lg text-portal-ink-muted">{resolveLanguageKey("subtitle")}</p>
                </div>
                <div className={PORTAL_CARD}>
                    <PortalSearchForm />
                </div>
            </section>

            <section className="flex flex-col gap-4" aria-busy={loading}>
                <h2 className={cn(PORTAL_HEADING, "text-2xl")}>{resolveLanguageKey("sectionsTitle")}</h2>
                {!loading && sections.length === 0 ? (
                    <p className="text-portal-ink-muted">{resolveLanguageKey("noSections")}</p>
                ) : (
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {sections.map((section) => (
                            <li key={section.section}>
                                <Link to={`/${section.path}`} className={cn(PORTAL_CARD, "group flex h-full flex-col gap-3 transition hover:border-portal-accent")}>
                                    <h3 className={cn(PORTAL_HEADING, "text-lg")}><PortalSectionName section={section.section} /></h3>
                                    <p className="flex-1 text-sm text-portal-ink-muted"><PortalSectionName section={section.section} part="description" /></p>
                                    <span className="flex items-center justify-between text-sm font-medium text-portal-accent">
                                        {section.companies} {resolveLanguageKey(section.companies === 1 ? "company" : "companies")}
                                        <ArrowRight size={16} className="transition group-hover:translate-x-0.5" aria-hidden />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/home/index.tsx"))(PortalHomePage);
