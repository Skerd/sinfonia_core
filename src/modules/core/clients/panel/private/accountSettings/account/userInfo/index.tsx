import {compose} from "redux";
import {useEffect, useState} from "react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import { manipulateDate } from "@coreModule/helpers/general";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import AccountProfileEmail from "@coreModule/clients/panel/private/accountSettings/account/userInfo/email";
import AccountProfileName from "@coreModule/clients/panel/private/accountSettings/account/userInfo/name";
import AccountProfileSurname from "@coreModule/clients/panel/private/accountSettings/account/userInfo/surname";
import AccountProfilePhoneNumber from "@coreModule/clients/panel/private/accountSettings/account/userInfo/phoneNumber";
import AccountProfileAndCoverPhoto from "@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto";
import AccountProfileTimeZone from "@coreModule/clients/panel/private/accountSettings/account/userInfo/timezone";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import AccountCompaniesCardEditRoles from "@coreModule/clients/panel/private/accountSettings/account/userInfo/companies/companyCardEditRoles";
import {RequestsSection, hasRequestsData} from "@coreModule/clients/panel/private/users/center/cardView/userProfileCard.tsx";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {useDispatch, useSelector} from "react-redux";
import {updateUserValue} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {useTableUpdate} from "@coreModule/components/custom/tableUpdateContext.tsx";

type UserAccountProfileUserInfoProps = WithLanguageType & WithAxiosType<CompanyUserType, any> & {
    specificUserId?: string,
    updatedEmail: string | false,
    updatedTimeZone: string | false
}

function UserAccountProfileUserInfo({
    resolveLanguageKey,
    data,
    updatedTimeZone,
    specificUserId,
    loading,
    error,
    onFilterChange
}: UserAccountProfileUserInfoProps) {

    const { updateRow } = useTableUpdate();
    const {read} = useAccess("users", !specificUserId ? "self" : "others");
    const [forceReload, setForceReload] = useState<number>(1);
    const {id} = useSelector((state: RootState) => state.authentication.user);
    const dispatch = useDispatch();

    const [currentTimeZone, setCurrentTimeZone] = useState<string>("Europe/Tirane");

    useEffect(() => {
        if( !!updatedTimeZone){
            setCurrentTimeZone(updatedTimeZone);
        }
    }, [updatedTimeZone]);
    useEffect(() => {
        if( !!data ){
            let timezone = data.timezone || "Europe/Tirane";
            setCurrentTimeZone(timezone);
        }
    }, [data]);

    useEffect(() => {
        if( !read ) return;
        onFilterChange({});
    }, [forceReload, read]);

    if( loading ){
        return <Loader />
    }
    if( error ){
        return (
            <SimpleError
                title={resolveLanguageKey("failTitle")}
                description={resolveLanguageKey("failTitleTooltip")}
                onClick={() => setForceReload(Date.now())}
            />
        )
    }

    return (
        <div className="space-y-4">
            <AccountProfileAndCoverPhoto
                hideCondition={!read?.photo && !read?.cover}
                specificUserId={specificUserId}
                onPhotoUpdate={(updates: any) => updateRow?.(specificUserId ?? id, updates)}
            />

            <div className="flex items-center flex-wrap space-x-0.5">
                <HiddenElement>
                    {
                        !!read?.roles?.keys?.active &&
                        <>
                            {
                                data?.status === "active" ?
                                <Badge className="bg-green-600">{resolveLanguageKey("status.title")}{resolveLanguageKey("status.active")}</Badge>
                                :
                                <>
                                    {
                                        (data?.status === "inactive") ?
                                        <Badge className={"bg-destructive"}>{resolveLanguageKey("status.title")}{resolveLanguageKey("status.blocked")}</Badge>
                                        :
                                        <Badge>{resolveLanguageKey("status.title")}{resolveLanguageKey("status.invited")}</Badge>
                                    }
                                </>
                            }
                        </>
                    }
                </HiddenElement>
                <HiddenElement>
                    {
                        !!read?.registerDate ?
                        <>
                            {
                                !!data?.registerDate &&
                                <Badge>{resolveLanguageKey("registeredDate")}{manipulateDate(data?.registerDate.toString(), currentTimeZone)}</Badge>
                            }
                        </>
                        :
                        undefined
                    }
                </HiddenElement>
            </div>

            <AccountProfileEmail
                invited={data?.status === "invited"}
                defaultValue={data?.username}
                defaultVerified={data?.verified}
                defaultUnverifiedEmail={data?.unverifiedEmail}
                hideCondition={!read?.username}
                specificUserId={specificUserId}
                onUpdate={(email: string) => {
                    updateRow?.(specificUserId ?? id, {username: email})
                    if( !specificUserId ){
                        // dispatch(updateUserValue("username", "email"))
                    }
                }}
            />
            <AccountProfileName
                defaultValue={data?.name}
                hideCondition={!read?.name}
                specificUserId={specificUserId}
                onUpdate={(name: string) => {
                    updateRow?.(specificUserId ?? id, {name});
                    if(!specificUserId ){
                        dispatch(updateUserValue({field: "name", value: name}))
                    }
                }}
            />
            <AccountProfileSurname
                defaultValue={data?.surname}
                hideCondition={!read?.surname}
                specificUserId={specificUserId}
                onUpdate={(surname: string) => {
                    updateRow?.(specificUserId ?? id, {surname})
                    if(!specificUserId ){
                        dispatch(updateUserValue({field: "surname", value: surname}))
                    }
                }}
            />
            <AccountProfilePhoneNumber
                defaultValue={data?.phoneNumber}
                hideCondition={!read?.phoneNumber}
                specificUserId={specificUserId}
                onUpdate={(phoneNumber: string) => {
                    updateRow?.(specificUserId ?? id, {phoneNumber});
                    if(!specificUserId ){
                        dispatch(updateUserValue({field: "phoneNumber", value: phoneNumber}))
                    }
                }}
            />
            <AccountProfileTimeZone
                defaultValue={data?.timezone}
                hideCondition={!read?.timezone}
                specificUserId={specificUserId}
                onTimeZoneUpdate={(timezone: string) => {
                    setCurrentTimeZone(timezone);
                    updateRow?.(specificUserId ?? id, { timezone });
                }}
            />
            <AccountCompaniesCardEditRoles
                specificUserId={specificUserId}
                roles={data?.roles || []}
            />
            {
                specificUserId && data && read?.requests && data.requests && hasRequestsData(data.requests) &&
                <RequestsSection data={data} resolveLanguageKey={resolveLanguageKey} timezone={currentTimeZone} specificUserId={specificUserId}/>
            }
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/index.tsx"),
    withAxios(
        {
            method: "get",
            url: `/api/user/data`,
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }]
        },
        true
    ),
    withDebug(true, true)
)(UserAccountProfileUserInfo);
