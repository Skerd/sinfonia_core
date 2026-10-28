import {compose} from "redux";
import {useDispatch} from "react-redux";
import {useEffect, useImperativeHandle, useRef} from "react";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {logIn} from "@coreModule/helpers/redux/slices/authSlice.ts";
import type {ThirdPartyLoginFormType} from "armonia/src/modules/core/api/user/public/login/thirdPartyLogin.form.type.ts";
import type {ThirdPartyLoginFormResponseType} from "armonia/src/modules/core/api/user/public/login/thirdPartyLogin.form.response.type.ts";
import {safeNextPath} from "@coreModule/helpers/publicAuth/safeNextPath.ts";
import {isPortalZoneUrl} from "../shared/portalZone.ts";

const LANGUAGE_PATH = "src/modules/core/clients/portal/auth/portalThirdPartyLogin.form.tsx";
const submittedOauthCodes = new Set<string>();

type PortalThirdPartyLoginFormProps = WithLanguageType &
    WithAxiosType<ThirdPartyLoginFormResponseType, ThirdPartyLoginFormType> & {
    onBusy?: (busy: boolean) => void;
};

/** Where the provider's `state` says to go: a page on any site of the zone, else a path here. */
function oauthNextFromCallback(searchParams: URLSearchParams): string {
    const fromState = searchParams.get("state") ?? "";
    return isPortalZoneUrl(fromState) ? fromState : safeNextPath(`?next=${encodeURIComponent(fromState)}`, "/account");
}

/** The provider's callback on the apex (`/login/:platform`): trades the code for a session, then goes back. */
function PortalThirdPartyLoginForm({
    onFilterChange,
    innerRef,
    loading,
    onBusy,
}: PortalThirdPartyLoginFormProps) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const onBusyRef = useRef(onBusy);
    onBusyRef.current = onBusy;
    const nextRef = useRef("/account");

    useImperativeHandle(innerRef, () => ({
        success: (data) => {
            if (data.token && data.refreshToken) {
                dispatch(logIn({token: data.token, refreshToken: data.refreshToken}));
                // The session spans the zone, so another site of it opens already signed in.
                if (isPortalZoneUrl(nextRef.current)) window.location.assign(nextRef.current);
                else navigate(nextRef.current);
            }
        },
    }));

    useEffect(() => {
        onBusyRef.current?.(loading);
        return () => onBusyRef.current?.(false);
    }, [loading]);

    useEffect(() => {
        const code = searchParams.get("code");
        const platform = params.platform;
        if (!code || !platform || submittedOauthCodes.has(code)) {
            return;
        }

        const next = oauthNextFromCallback(searchParams);
        nextRef.current = next;
        submittedOauthCodes.add(code);
        setSearchParams(next === "/account" ? {} : {next}, {replace: true});
        onFilterChange({code, platform});
    }, [searchParams, setSearchParams, onFilterChange, params.platform]);

    return null;
}

export default compose(
    withLanguage(LANGUAGE_PATH),
    withAxios<ThirdPartyLoginFormResponseType, ThirdPartyLoginFormType>(
        {
            method: "post",
            url: "/api/user/login/thirdParty",
            data: {},
        },
        true,
    ),
    withDebug(true, true),
)(PortalThirdPartyLoginForm);
