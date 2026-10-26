import {compose} from "redux";
import {Link} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {PORTAL_CONTAINER, PORTAL_HEADING, PORTAL_LINK} from "../shared/portalStyles.ts";

function PortalNotFound({resolveLanguageKey}: WithLanguageType) {
    return (
        <div className={cn(PORTAL_CONTAINER, "flex flex-col items-start gap-4 py-20")}>
            <h1 className={cn(PORTAL_HEADING, "text-3xl")}>{resolveLanguageKey("title")}</h1>
            <p className="text-portal-ink-muted">{resolveLanguageKey("description")}</p>
            <Link to="/" className={PORTAL_LINK}>{resolveLanguageKey("home")}</Link>
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/notFound/index.tsx"))(PortalNotFound);
