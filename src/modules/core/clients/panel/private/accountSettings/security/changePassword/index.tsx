import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import UserAccountSecurityChangePasswordForm from "@coreModule/clients/panel/private/accountSettings/security/changePassword/changePassword.form.tsx";
import TitleWithCollapse from "@coreModule/components/custom/titleWithCollapse.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";

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
    withHidden(),
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/changePassword/index.tsx"),
    withDebug(true, true)
)(UserAccountSecurityChangePassword)

// $2b$12$xaYYabNPAGcV3tI7Kv3nH.atGNPFPFsDH0NJGyPnX9KyQVhXyLTjK