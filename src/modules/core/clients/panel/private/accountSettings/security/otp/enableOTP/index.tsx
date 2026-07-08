import {compose} from "redux";
import AccountSecurityEnableOtpForm from "./enableOtp.form.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {GenerateMfaQrCodeFormResponseType} from "armonia/src/modules/core/api/user/private/mfa/generateMfaQrCode.form.response.type.ts";
import {useEffect, useState} from "react";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";

type AccountSecurityOtpEnableOTPProps = WithLanguageType & WithAxiosType<GenerateMfaQrCodeFormResponseType> & {
    onSuccess: Function,
    onCancel: Function,
    specificUserId?: string,
}

function AccountSecurityOtpEnableOTP({
    onSuccess,
    onCancel,
    specificUserId,
    data,
    loading,
    error,
    onFilterChange,
    resolveLanguageKey
}: AccountSecurityOtpEnableOTPProps){

    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    const [forceReload, setForceReload] = useState<number>(1);
    useEffect(() => {
        if( !!forceReload && write.mfaStatus){
            onFilterChange({});
        }
    }, [forceReload, write]);

    if( !write.mfaStatus ){
        return <HiddenElement />
    }
    if( loading ){
        return <Loader />
    }
    if( error || !data ){
        return (
            <SimpleError
                title={resolveLanguageKey("failTitle")}
                description={resolveLanguageKey("failDescription")}
                onClick={() => setForceReload(Date.now())}
            />
        )
    }

    return(
        <AccountSecurityEnableOtpForm
            generatedOtpData={data}
            onSuccess={onSuccess}
            onCancel={onCancel}
            specificUserId={specificUserId}
        />
    )
}

export default compose(
    withHidden(),
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/otp/enableOTP/index.tsx"),
    withAxios(
        {
            method: "post",
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
)(AccountSecurityOtpEnableOTP)