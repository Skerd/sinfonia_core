import {compose} from "redux";
import {Link} from "react-router-dom";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {ActivateAccountFormType} from "armonia/src/modules/core/api/user/public/activateAccount/activateAccount.form.type.ts";
import type {ActivateAccountFormResponseType} from "armonia/src/modules/core/api/user/public/activateAccount/activateAccount.form.response.type.ts";
import {usePublicActivateAccount} from "@coreModule/helpers/publicAuth/usePublicActivateAccount.ts";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import PortalAuthShell from "./portalAuthShell.tsx";
import {PORTAL_LINK} from "../shared/portalStyles.ts";

/** Opened from the activation email (`/activate/:code`). */
function PortalActivatePage({resolveLanguageKey, onFilterChange, innerRef}: WithLanguageType & WithAxiosType<ActivateAccountFormResponseType, ActivateAccountFormType>) {
    const {phase} = usePublicActivateAccount({onFilterChange, innerRef});
    return (
        <PortalAuthShell title={resolveLanguageKey(`${phase}.title`)} subtitle={phase === "loading" ? undefined : resolveLanguageKey(`${phase}.subtitle`)}>
            {phase === "loading" ? <Loader /> : <Link to="/login" className={PORTAL_LINK}>{resolveLanguageKey("signIn")}</Link>}
        </PortalAuthShell>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/portal/auth/activate.tsx"),
    withAxios<ActivateAccountFormResponseType, ActivateAccountFormType>({method: "put", url: "/api/user/activateAccount", data: {}}, true),
    withDebug(true, true),
)(PortalActivatePage);
