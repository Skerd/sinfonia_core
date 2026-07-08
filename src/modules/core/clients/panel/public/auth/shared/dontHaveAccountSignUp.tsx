import {compose} from "redux";
import {Link} from "react-router-dom";
import {getClientConfig} from "@coreModule/helpers/general";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";

type DontHaveAccountSignUpProps = WithLanguageType & {};

function DontHaveAccountSignUp({
    resolveLanguageKey
}: DontHaveAccountSignUpProps) {

    const config = getClientConfig();

    if( config.layout.activateSignup ){
        return (
            <p className='text-muted-foreground mx-auto text-center text-sm text-balance'>
                {resolveLanguageKey("dontHaveAccount")}{' '}
                <Link to='/authenticate/signUp' className='hover:text-primary underline underline-offset-4'>
                    {resolveLanguageKey("signUp")}
                </Link>
            </p>
        )
    }

    return (<></>)
}

export default compose(
    withLanguage("src/modules/core/clients/panel/public/auth/shared/dontHaveAccountSignUp.tsx"),
    withDebug(true, true)
)(DontHaveAccountSignUp);