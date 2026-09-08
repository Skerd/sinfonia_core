import {compose} from "redux";
import { ContentSection } from '../components/content-section.tsx'
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import UserAccountSecurityChangePassword from "@coreModule/clients/panel/private/accountSettings/security/changePassword";
import UserAccountSecurityDisableAccount from "@coreModule/clients/panel/private/accountSettings/security/disableAccount";
import UserAccountSecurityOTP from "@coreModule/clients/panel/private/accountSettings/security/otp";
import UserAccountSecurityLoginHistory from "@coreModule/clients/panel/private/accountSettings/security/loginHistory";
import UserAccountSecurityUserSession from "@coreModule/clients/panel/private/accountSettings/security/userSession";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/context/accessContext.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
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
            <div className="flex flex-col gap-y-4">
                {write.password ? (
                    <UserAccountSecurityChangePassword specificUserId={specificUserId}/>
                ) : (
                    <HiddenElement />
                )}
                {read.mfaStatus ? (
                    <UserAccountSecurityOTP specificUserId={specificUserId}/>
                ) : (
                    <HiddenElement />
                )}
                <UserAccountSecurityUserSession specificUserId={specificUserId}/>
                <UserAccountSecurityLoginHistory specificUserId={specificUserId}/>
                {read.roles?.keys?.active ? (
                    <UserAccountSecurityDisableAccount specificUserId={specificUserId} onActiveChange={(status: boolean) => { updateRow?.(specificUserId!, {status: status ? "active" : "inactive"}) }}/>
                ) : (
                    <HiddenElement />
                )}
            </div>
        </ContentSection>
    )
}


export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/index.tsx"),
    withDebug(true, true, "users")
)(Security);