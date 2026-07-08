import {compose} from "redux";
import {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import SignInForm from "@coreModule/clients/panel/public/auth/login/signin.form.tsx";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import TermsAndConditions from "@coreModule/clients/panel/public/auth/shared/termsAndConditions.tsx";
import DontHaveAccountSignUp from "@coreModule/clients/panel/public/auth/shared/dontHaveAccountSignUp.tsx";
import ThirdPartyAuthentication from "@coreModule/clients/panel/public/auth/shared/thirdPartyAuthentication.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {getToken} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";

type LoginProps = WithLanguageType & {}

function Login({
    resolveLanguageKey
}: LoginProps){

    const navigate = useNavigate();
    const [header, setHeader] = useState<"signInHeader" | "mfaHeader">("signInHeader");
    const [disableOTP, setDisableOTP] = useState<number>(0);
    const [goLogin, setGoLogin] = useState<number>(1);

    useEffect(() => {
        if( !!getToken() ){
            // if we have a token, we go home, so that token can be validated
            navigate("/");
        }
    }, []);
    useEffect(() => {
        if( header === "signInHeader" ){
            setDisableOTP(0);
        }
    }, [header]);

    return (
        <Card className='gap-4 h-fit'>
            <CardHeader>
                <CardTitle className='text-lg tracking-tight'>{resolveLanguageKey(`${header}.title`)}</CardTitle>
                <CardDescription>
                    {resolveLanguageKey(`${header}.descriptionOne`)} <br />
                    {resolveLanguageKey(`${header}.descriptionTwo`)}
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <SignInForm
                    onMfa={(value: boolean) => {
                        if(value){
                            setHeader("mfaHeader");
                        }
                        else {
                            // setHeader("signInHeader");
                        }
                    }}
                    openDisable={disableOTP}
                    goLogin={goLogin}
                />
                {
                    header === "signInHeader" &&
                    <>
                        <DontHaveAccountSignUp />
                        <ThirdPartyAuthentication />
                    </>
                }
            </CardContent>
            <CardFooter>
                {
                    header === "signInHeader" ?
                    <TermsAndConditions/>
                    :
                    <div className="w-full space-y-2 text-muted-foreground underline-offset-4">
                        <p className='text-center text-sm w-full'>
                            {resolveLanguageKey("mfaFooter.forgot")}{' '}
                            <Link to='#' className='hover:text-primary underline' onClick={() => {setDisableOTP(Date.now());}}>
                                {resolveLanguageKey("mfaFooter.reset")}
                            </Link>
                        </p>

                        <div className='flex items-center'>
                            <p className='flex grow border-t h-0.5'/>
                            <div className='flex justify-center text-xs uppercase text-center px-2'>
                                {resolveLanguageKey("mfaFooter.or")}
                            </div>
                            <p className='flex grow border-t h-0.5'/>
                        </div>

                        <p className=' px-8 text-center text-sm w-full'>
                            <Link to='/authenticate/login' className='hover:text-primary underline' onClick={() => {setDisableOTP(0); setGoLogin(Date.now()); setHeader("signInHeader");}}>
                                {resolveLanguageKey("mfaFooter.goLogin")}{' '}
                            </Link>
                        </p>
                    </div>
                }
            </CardFooter>
        </Card>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/public/auth/login/index.tsx"),
    withDebug(true, true)
)(Login)