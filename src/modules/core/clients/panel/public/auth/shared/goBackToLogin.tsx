import {compose} from "redux";
import {Link} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";

type GoBackToLoginProps = WithLanguageType & {
    alreadyHaveAccount: boolean
};
function GoBackToLogin({resolveLanguageKey, alreadyHaveAccount}: GoBackToLoginProps) {

    return (
        <p className='text-muted-foreground mx-auto px-8 text-center text-sm text-balance'>
            {resolveLanguageKey(alreadyHaveAccount ? "alreadyHaveAccount" : "goBack")}{' '}
            <Link
                to='/authenticate/login'
                className='hover:text-primary underline underline-offset-4'
            >
                {resolveLanguageKey("logIn")}
            </Link>
        </p>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/public/auth/shared/goBackToLogin.tsx"),
    withDebug(true, true)
)(GoBackToLogin)