import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import PortalSectionName from "../shared/portalSectionName.tsx";
import {usePortalSite} from "../shared/portalSiteContext.tsx";

/** The visitor's bookings and orders, one block per section this host offers (behind `RequireSession`). */
function PortalAccountPage({resolveLanguageKey}: WithLanguageType) {
    const {sections} = usePortalSite();

    return (
        <div className="flex flex-col gap-12">
            <div>
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{resolveLanguageKey("title")}</h1>
                <p className="mt-3 text-lg text-muted-foreground">{resolveLanguageKey("subtitle")}</p>
            </div>
            {sections.map(({section, AccountSection}) => AccountSection ? (
                <section key={section} className="flex flex-col gap-4">
                    <h2 className="font-display text-2xl font-bold tracking-tight"><PortalSectionName section={section} /></h2>
                    <AccountSection />
                </section>
            ) : null)}
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/account/index.tsx"))(PortalAccountPage);
