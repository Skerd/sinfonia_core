import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {MfaStatusFormResponseType} from "armonia/src/modules/core/api/user/private/mfa/mfaStatus.form.response.type.ts";
import {ShieldCheck, TriangleAlert} from "lucide-react";
import {Alert, AlertDescription, AlertTitle} from "@coreModule/components/ui/alert.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {useEffect, useState} from "react";
import AccountSecurityDeactivateOtpForm from "@coreModule/clients/panel/private/accountSettings/security/otp/deactivateOTP/deactivateOtp.form.tsx";
import AccountSecurityOtpEnableOTP from "@coreModule/clients/panel/private/accountSettings/security/otp/enableOTP";
import TitleWithCollapse from "@coreModule/components/custom/titleWithCollapse.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";

function ToggleButton({otpEnabled, setOpenWhat, loading, resolveLanguageKey}:{otpEnabled: boolean, setOpenWhat: Function, loading: boolean, resolveLanguageKey: Function, specificUserId?: string}){
    return (
        <Button
            type="button"
            variant={otpEnabled ? "destructive" : "default"}
            onClick={() => {setOpenWhat(otpEnabled ? "disable" : "enable");}}
            disabled={loading}
        >
            {resolveLanguageKey(otpEnabled ? "otpEnabled.button" : "otpDisabled.button")}
        </Button>
    )
}

type UserAccountSecurityOTPProps = WithLanguageType & WithAxiosType & {
    data: MfaStatusFormResponseType,
    specificUserId?: string;
}

function UserAccountSecurityOTP({
    resolveLanguageKey,
    data,
    loading,
    error,
    specificUserId,
    onFilterChange
}:UserAccountSecurityOTPProps) {

    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");
    const [openWhat, setOpenWhat] = useState<null | "enable" | "disable">(null);
    const [otpEnabled, setOtpEnabled] = useState<boolean>(data?.enabled);

    const [forceReload, setForceReload] = useState<number>(1);
    useEffect(() => {
        if( !!forceReload ){
            onFilterChange({});
        }
    }, [forceReload]);
    useEffect(() => {
        if( !!data && read.mfaStatus ){
            setOtpEnabled(data.enabled);
        }
    }, [data, read]);

    if( !write.password ){
        return <HiddenElement />
    }

    if( loading ){
        return (
            <Loader />
        )
    }
    if( error || !data){
        return (
            <SimpleError
                title={resolveLanguageKey("failTitle")}
                description={resolveLanguageKey("failTitleTooltip")}
                onClick={() => setForceReload(Date.now())}
            />
        )
    }

    if( !read.mfaStatus ){
        return <HiddenElement />
    }

    return (
        <TitleWithCollapse
            title={resolveLanguageKey("title")}
            description={resolveLanguageKey("description")}
            defaultOpen={false}
        >
            {
                !openWhat ?
                <div className="space-y-2">
                    <Alert>
                        {
                            otpEnabled ?
                            <ShieldCheck className="h-4 w-4"/>
                            :
                            <TriangleAlert className="h-4 w-4"/>
                        }
                        <AlertTitle>{resolveLanguageKey(otpEnabled ? "otpEnabled.title" : "otpDisabled.title")}</AlertTitle>
                        <AlertDescription>{resolveLanguageKey(otpEnabled ? "otpEnabled.description" : "otpDisabled.description")}</AlertDescription>
                    </Alert>
                    <div className="flex justify-end">
                        <HiddenElement>
                            {
                                !!write.mfaStatus &&
                                <div className="flex justify-end">
                                    {
                                        !otpEnabled ?
                                            <div>
                                                <ToggleButton
                                                    otpEnabled={otpEnabled}
                                                    setOpenWhat={setOpenWhat}
                                                    loading={loading}
                                                    specificUserId={specificUserId}
                                                    resolveLanguageKey={resolveLanguageKey}
                                                />
                                            </div>
                                            :
                                            <div>
                                                <ToggleButton
                                                    otpEnabled={otpEnabled}
                                                    setOpenWhat={setOpenWhat}
                                                    loading={loading}
                                                    specificUserId={specificUserId}
                                                    resolveLanguageKey={resolveLanguageKey}
                                                />
                                            </div>
                                    }
                                </div>
                            }
                        </HiddenElement>
                    </div>
                </div>
                :
                <>
                    {
                        openWhat === "disable" ?
                        <AccountSecurityDeactivateOtpForm
                            hideCondition={!write.mfaStatus}
                            onSuccess={() => {setOtpEnabled(false); setOpenWhat(null);}}
                            onCancel={() => {setOpenWhat(null);}}
                            specificUserId={specificUserId}
                        />
                        :
                        <AccountSecurityOtpEnableOTP
                            hideCondition={!write.mfaStatus}
                            onSuccess={() => {setOtpEnabled(true); setOpenWhat(null);}}
                            onCancel={() => {setOpenWhat(null);}}
                            specificUserId={specificUserId}
                        />
                    }
                </>
            }
        </TitleWithCollapse>
    )
}

export default compose(
    withHidden(),
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/otp/index.tsx"),
    withAxios(
        {
            method: "get",
            url: `/api/user/mfa`,
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }]
        },
        true
    ),
    withDebug(true, true)
)(UserAccountSecurityOTP)