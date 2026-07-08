import {compose} from "redux";
import {useEffect, useState} from "react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import UserAccountSecurityDisableAccountForm from "@coreModule/clients/panel/private/accountSettings/security/disableAccount/disableAccount.form.tsx";
import UserAccountSecurityEnableAccountForm from "@coreModule/clients/panel/private/accountSettings/security/disableAccount/enableAccount.form.tsx";
import TitleWithCollapse from "@coreModule/components/custom/titleWithCollapse.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import {UserStatusFormResponseType} from "armonia/src/modules/core/api/user/private/status/userStatus.form.response.type.ts";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type UserAccountSecurityDisableAccountProps = WithAxiosType<UserStatusFormResponseType> & WithLanguageType & {
    specificUserId?: string,
    onActiveChange?: Function
};

function UserAccountSecurityDisableAccount({
    resolveLanguageKey,
    specificUserId,
    data,
    onActiveChange = () => {},
    loading,
    error,
    onFilterChange
}: UserAccountSecurityDisableAccountProps){

    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");
    const [openWhat, setOpenWhat] = useState<null | "enable" | "disable">(null);
    const [innerActive, setInnerActive] = useState<boolean>(data?.active ?? false);

    useEffect(() => {
        setOpenWhat(innerActive ? "disable" : "enable");
    }, [innerActive]);

    const [forceReload, setForceReload] = useState<number>(1);
    useEffect(() => {
        if( !!forceReload && read?.roles?.keys?.active ){
            onFilterChange({});
        }
    }, [forceReload]);
    useEffect(() => {
        if( !!data?.active ){
            setInnerActive(data.active);
        }
    }, [data]);

    if( !read?.roles?.keys?.active ){
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

    return (
        <TitleWithCollapse
            title={resolveLanguageKey("title")}
            description={resolveLanguageKey("description")}
            danger={true}
            defaultOpen={false}
        >
            <>
                {
                    openWhat === "disable" ?
                    <UserAccountSecurityDisableAccountForm hideCondition={!write.roles?.keys?.active} specificUserId={specificUserId} userData={data} onSuccess={() => {setInnerActive(false); onActiveChange(false)}}/>
                    :
                    <UserAccountSecurityEnableAccountForm hideCondition={!write.roles?.keys?.active} specificUserId={specificUserId} userData={data} onSuccess={() => {setInnerActive(true); onActiveChange(true)}}/>
                }
            </>
        </TitleWithCollapse>
    )
}

export default compose(
    withHidden(),
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/disableAccount/index.tsx"),
    withAxios(
        {
            method: "get",
            url: `/api/user/status`,
            data: {search: ""},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }]
        },
        true,
    ),
    withDebug(true, true)
)(UserAccountSecurityDisableAccount);
