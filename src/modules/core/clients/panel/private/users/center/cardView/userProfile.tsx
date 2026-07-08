import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {compose} from "redux";
import {useEffect, useState} from "react";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {UserProfileCard} from "./userProfileCard.tsx";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";

type UserProfileProps = WithLanguageType & WithAxiosType<CompanyUserType> & {
    specificUserId?: string;
    /** When provided, no API call is made; card renders with this data. Use for list/dialog reuse. */
    data?: CompanyUserType | null;
};

function UserProfileFetcherInner({
    resolveLanguageKey,
    onFilterChange,
    data,
    error,
    loading,
    specificUserId,
}: UserProfileProps) {
    const [forceReload, setForceReload] = useState<number>(1);
    const {id: userId} = useSelector((state: RootState) => state.authentication.user);
    const {read} = useAccess("users", (!specificUserId || specificUserId === userId) ? "self" : "others");

    useEffect(() => {
        onFilterChange({});
    }, [forceReload]);

    if (!read || !Object.keys(read).length) {
        return null;
    }
    if (loading) return <Loader />;
    if (error || !data) {
        return (
            <SimpleError
                title={resolveLanguageKey("failTitle")}
                description={resolveLanguageKey("failTitleTooltip")}
                onClick={() => setForceReload(Date.now())}
            />
        );
    }

    return <UserProfileCard data={data as CompanyUserType} specificUserId={specificUserId} />;
}

const UserProfileFetcher = compose(
    withLanguage("src/modules/core/clients/panel/private/users/center/cardView/userProfile.tsx"),
    withAxios(
        {
            method: "get",
            url: `/api/user/data`,
            data: { search: "" },
            addToHeader: [{ whatToGet: "specificUserId", whereToPut: "specificUser" }],
        },
        true
    ),
    withDebug(true, true)
)(UserProfileFetcherInner);

type UserProfileWrapperProps = {
    specificUserId?: string | null;
    data?: CompanyUserType | null;
};

function UserProfile({ specificUserId, data }: UserProfileWrapperProps) {
    if (data != null && data._id) {
        return <UserProfileCard data={data as CompanyUserType} specificUserId={specificUserId ?? data._id} />;
    }
    if (specificUserId) {
        return (
            <>
                <UserProfileFetcher specificUserId={specificUserId} />
            </>
        );
    }
    return null;
}

export default compose(
    withDebug(true, true)
)(UserProfile);
