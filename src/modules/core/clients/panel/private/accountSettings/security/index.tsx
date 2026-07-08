import {compose} from "redux";
import { ContentSection } from '../components/content-section.tsx'
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import UserAccountSecurityChangePassword from "@coreModule/clients/panel/private/accountSettings/security/changePassword";
import UserAccountSecurityDisableAccount from "@coreModule/clients/panel/private/accountSettings/security/disableAccount";
import UserAccountSecurityOTP from "@coreModule/clients/panel/private/accountSettings/security/otp";
import UserAccountSecurityLoginHistory from "@coreModule/clients/panel/private/accountSettings/security/loginHistory";
import UserAccountSecurityUserSession from "@coreModule/clients/panel/private/accountSettings/security/userSession";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {useTableUpdate} from "@coreModule/components/custom/tableUpdateContext.tsx";
type SecurityProps = WithLanguageType & { specificUserId?: string }

function Security({
    resolveLanguageKey,
    specificUserId,
}: SecurityProps) {
    const { updateRow } = useTableUpdate();
    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");

    return (
        <ContentSection
            title={resolveLanguageKey("title")}
            desc={resolveLanguageKey("description")}
        >
            <div className="space-y-4">
                <UserAccountSecurityChangePassword hideCondition={!write.password} specificUserId={specificUserId}/>
                <UserAccountSecurityOTP hideCondition={!read?.mfaStatus}  specificUserId={specificUserId}/>
                <UserAccountSecurityUserSession specificUserId={specificUserId}/>
                <UserAccountSecurityLoginHistory specificUserId={specificUserId}/>
                <UserAccountSecurityDisableAccount hideCondition={!read?.roles?.keys?.active} specificUserId={specificUserId} onActiveChange={(status: boolean) => { updateRow?.(specificUserId!, {status: status ? "active" : "inactive"}) }}/>
            </div>
        </ContentSection>
    )
}


export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/index.tsx"),
    withDebug(true, true)
)(Security);