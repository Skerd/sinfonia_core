import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import UserAccountSecurityChangePasswordForm from "@coreModule/clients/panel/private/accountSettings/security/changePassword/changePassword.form.tsx";
import TitleWithCollapse from "@baseModule/components/custom/titleWithCollapse.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@baseModule/helpers/hooks/useAccess.ts";
import HiddenElement from "@baseModule/components/custom/hiddenElement.tsx";

type UserAccountSecurityChangePasswordProps = WithLanguageType & {
    specificUserId?: string;
};

function UserAccountSecurityChangePassword({
    specificUserId,
    resolveLanguageKey,
}:UserAccountSecurityChangePasswordProps) {

    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    if( !write.password ){
        return <HiddenElement />
    }

    return (
        <TitleWithCollapse
            title={resolveLanguageKey("title")}
            description={resolveLanguageKey("description")}
            defaultOpen={false}
        >
            <UserAccountSecurityChangePasswordForm specificUserId={specificUserId}/>
        </TitleWithCollapse>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/changePassword/index.tsx"),
    withDebug(true, true, "users")
)(UserAccountSecurityChangePassword)

// $2b$12$xaYYabNPAGcV3tI7Kv3nH.atGNPFPFsDH0NJGyPnX9KyQVhXyLTjK