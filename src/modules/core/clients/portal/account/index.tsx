import {compose} from "redux";
import {useSelector} from "react-redux";
import {Navigate} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import {getPortalContributions} from "@coreModule/helpers/moduleContributions/loadPortalContributions.ts";
import PortalSectionName from "../shared/portalSectionName.tsx";
import {PORTAL_CARD, PORTAL_CONTAINER, PORTAL_HEADING} from "../shared/portalStyles.ts";

/** The visitor's bookings and orders, one block per section that has some to show. */
function PortalAccountPage({resolveLanguageKey}: WithLanguageType) {
    const token = useSelector((state: RootState) => state.authentication.token);
    if (!token) return <Navigate to="/login?next=/account" replace />;

    return (
        <div className={cn(PORTAL_CONTAINER, "flex flex-col gap-8 py-10")}>
            <div>
                <h1 className={cn(PORTAL_HEADING, "text-3xl")}>{resolveLanguageKey("title")}</h1>
                <p className="mt-2 text-portal-ink-muted">{resolveLanguageKey("subtitle")}</p>
            </div>
            {getPortalContributions().map(({section, AccountSection}) => AccountSection ? (
                <section key={section} className={cn(PORTAL_CARD, "flex flex-col gap-4")}>
                    <h2 className={cn(PORTAL_HEADING, "text-xl")}><PortalSectionName section={section} /></h2>
                    <AccountSection />
                </section>
            ) : null)}
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/account/index.tsx"))(PortalAccountPage);
