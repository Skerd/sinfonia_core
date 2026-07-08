import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import SignUpForm from "@coreModule/clients/panel/public/auth/signUp/signup.form.tsx";
import GoBackToLogin from "@coreModule/clients/panel/public/auth/shared/goBackToLogin.tsx";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import TermsAndConditions from "@coreModule/clients/panel/public/auth/shared/termsAndConditions.tsx";
import ThirdPartyAuthentication from "@coreModule/clients/panel/public/auth/shared/thirdPartyAuthentication.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";

type SignUpProps = WithLanguageType & {}
function SignUp({
    resolveLanguageKey
}: SignUpProps) {

    return (
        <Card className='w-full gap-4 h-fit'>
            <CardHeader>
                <CardTitle className='text-lg tracking-tight'>{resolveLanguageKey(`title`)}</CardTitle>
                <CardDescription>
                    {resolveLanguageKey("descriptionOne")} <br />
                    {resolveLanguageKey("descriptionTwo")}
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <SignUpForm />
                <GoBackToLogin alreadyHaveAccount={true} />
                <ThirdPartyAuthentication />
            </CardContent>
            <CardFooter>
                <TermsAndConditions />
            </CardFooter>
        </Card>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/public/auth/signUp/index.tsx"),
    withDebug(true, true)
)(SignUp);