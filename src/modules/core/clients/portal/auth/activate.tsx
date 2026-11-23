import {compose} from "redux";
import {Link, useLocation} from "react-router-dom";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {ActivateAccountFormType} from "armonia/src/modules/core/api/user/public/activateAccount/activateAccount.form.type.ts";
import type {ActivateAccountFormResponseType} from "armonia/src/modules/core/api/user/public/activateAccount/activateAccount.form.response.type.ts";
import {usePublicActivateAccount} from "@coreModule/helpers/publicAuth/usePublicActivateAccount.ts";
import {safeNextPath} from "@coreModule/helpers/publicAuth/safeNextPath.ts";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import PortalAuthShell from "./portalAuthShell.tsx";

/**
 * Opened from the activation email (`/activate/:code`). A `?next=` on the link (where the person started signing up)
 * carries on to the sign-in, which opens it afterwards (P23.12).
 */
function PortalActivatePage({resolveLanguageKey, onFilterChange, innerRef}: WithLanguageType & WithAxiosType<ActivateAccountFormResponseType, ActivateAccountFormType>) {
    const {phase} = usePublicActivateAccount({onFilterChange, innerRef});
    const next = safeNextPath(useLocation().search, "");
    const signIn = next ? `/login?${new URLSearchParams({next})}` : "/login";
    return (
        <PortalAuthShell title={resolveLanguageKey(`${phase}.title`)} subtitle={phase === "loading" ? undefined : resolveLanguageKey(`${phase}.subtitle`)}>
            {phase === "loading" ? <Loader /> : <Button asChild size="lg"><Link to={signIn}>{resolveLanguageKey("signIn")}</Link></Button>}
        </PortalAuthShell>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/portal/auth/activate.tsx"),
    withAxios<ActivateAccountFormResponseType, ActivateAccountFormType>({method: "put", url: "/api/user/activateAccount", data: {}}, true),
    withDebug(true, true),
)(PortalActivatePage);
