import {compose} from "redux";
import {OctagonAlert, ShieldAlert} from "lucide-react";
import {useNavigate, useParams} from "react-router-dom";
import {SiTicktick} from "@icons-pack/react-simple-icons";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {useEffect, useImperativeHandle, useState} from 'react';
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import GoBackToLogin from "@coreModule/clients/panel/public/auth/shared/goBackToLogin.tsx";
import {Card, CardDescription, CardFooter, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";

type ConfirmOTPDeactivationProps = WithLanguageType & WithAxiosType & {}

function ConfirmOTPDeactivation({
    resolveLanguageKey,
    onFilterChange = () => {},
    innerRef
}: ConfirmOTPDeactivationProps){

    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(true);
    const [success, setSuccess] = useState<boolean>(false);
    const params = useParams();

    useEffect(() => {
        if( !!params.platform ){
            const code = params.platform;
            if( !!code && code !== "" ){
                setLoading(true);
                setError(false);
                onFilterChange({code});
            }
        }
        else{
            navigate("/authenticate/login");
        }
    }, [params]);

    useImperativeHandle(innerRef, () => ({
        start: () => {
            setLoading(true);
            setError(false);
            setSuccess(false);
        },
        success: () => {
            setLoading(false);
            setSuccess(true);
        },
        error: () => {
            setLoading(false);
            setError(true);
        }
    }));

    if( loading ){
        return (
            <Card className="w-full gap-4 h-fit">
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <ShieldAlert size={30} color="green" className="animate-pulse"/>
                    <CardTitle className='text-lg tracking-tight'>{resolveLanguageKey("loading")}</CardTitle>
                    <CardDescription>{resolveLanguageKey("loadingDescription")}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <GoBackToLogin />
                </CardFooter>
            </Card>
        )
    }
    if( error ){
        return (
            <Card className="w-full gap-4 h-fit">
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <OctagonAlert size={30} color="#c82121"/>
                    <CardTitle className='text-lg tracking-tight'>{resolveLanguageKey("fail")}</CardTitle>
                    <CardDescription>{resolveLanguageKey("failDescription")}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <GoBackToLogin />
                </CardFooter>
            </Card>
        )
    }
    if( success ){
        return (
            <Card className="w-full gap-4 h-fit">
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <SiTicktick size={30} color="green"/>
                    <CardTitle className='text-lg tracking-tight'>{resolveLanguageKey("success")}</CardTitle>
                    <CardDescription>{resolveLanguageKey("successDescription")}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <GoBackToLogin />
                </CardFooter>
            </Card>
        )
    }

    return (
        <></>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/public/auth/2fa/confirm2FADeactivation.form.tsx"),
    withAxios(
        {
            method: "put",
            url: `/api/user/mfa/deactivate`,
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(ConfirmOTPDeactivation)
