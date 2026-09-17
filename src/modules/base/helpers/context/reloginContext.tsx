import {createContext, useCallback, useMemo, useState, type ReactNode} from "react";
import {useDispatch, useSelector} from "react-redux";
import {logIn} from "@baseModule/helpers/redux/slices/authSlice.ts";
import type {RootState} from "@baseModule/helpers/redux/store/generalStore.ts";
import useHttpRequest from "@baseModule/helpers/hooks/useHttpRequest.ts";
import type {HttpRequest, HttpRequestLifecycleFunctions} from "@baseModule/helpers/hooks/useHttpRequest.ts";
import useErrorHandler from "@baseModule/helpers/hooks/useErrorHandler.ts";
import useSelectedLanguage from "@baseModule/helpers/hooks/useSelectedLanguage.ts";
import {resolveTranslationKey} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {normalizeError} from "@baseModule/helpers/general/errors.ts";
import {isSessionExpiredError} from "@baseModule/helpers/general/httpRequestBuilders.ts";
import type {ReloginDifferentCompanyFormResponseType} from "armonia/src/modules/core/api/user/private/login/reloginDifferentCompany.form.response.type.ts";

export type ReloginContextValue = {
    /** Switch the session to `companyId`. No-op for an empty id or the current company. */
    triggerRelogin: (companyId: string) => void;
    /** A switch request is in flight. */
    switching: boolean;
};

const RELOGIN_REQUEST: HttpRequest = {
    method: "post",
    url: "/api/user/login/differentCompany",
    data: {},
};

/** Dictionary: `core/assets/languages/<locale>/helpers/context/reloginContext.json`. */
const LANGUAGE_PATH = "src/modules/core/helpers/context/reloginContext.tsx";

export const ReloginContext = createContext<ReloginContextValue | undefined>(undefined);

/**
 * Provides `triggerRelogin`, which swaps the session's tokens for ones scoped to another company.
 *
 * A failed switch (inactive company, no role, rate limit, network) leaves the current session
 * valid on the server, so the user stays signed in and sees the error: the server's translated
 * message when it sent one, otherwise the local `switchFailed` copy. An expired session is
 * not toasted here: `apiClient` already flags it and the session-expired flow takes over.
 * Starting a new switch cancels one still in flight.
 */
export function ReloginProvider({children}: {children: ReactNode}) {
    const dispatch = useDispatch();
    const currentCompanyId = useSelector((state: RootState) => state.authentication.user?.company?._id);
    const handleError = useErrorHandler({context: "ReloginProvider"});
    const {currentLanguage} = useSelectedLanguage(LANGUAGE_PATH);
    const switchFailedMessage = String(resolveTranslationKey(currentLanguage, "switchFailed"));
    const [request, setRequest] = useState({body: {} as Record<string, unknown>, count: 0});

    const lifecycle = useMemo<HttpRequestLifecycleFunctions<ReloginDifferentCompanyFormResponseType>>(() => ({
        success: (data) => {
            if (data?.token && data?.refreshToken) {
                dispatch(logIn({token: data.token, refreshToken: data.refreshToken}));
            } else {
                // Logged in English for debugging; the user sees the translated copy.
                handleError(new Error("Company switch returned no session tokens"), {
                    showToast: true,
                    message: switchFailedMessage,
                });
            }
        },
        error: (error) => {
            const {status, code} = normalizeError(error);
            handleError(error, {
                showToast: !isSessionExpiredError(status, code),
                fallbackMessage: switchFailedMessage,
            });
        },
    }), [dispatch, handleError, switchFailedMessage]);

    const {loading: switching} = useHttpRequest<ReloginDifferentCompanyFormResponseType>(
        RELOGIN_REQUEST,
        request.body,
        request.count,
        true,
        lifecycle,
    );

    const triggerRelogin = useCallback((companyId: string) => {
        if (!companyId || companyId === currentCompanyId) return;
        setRequest((prev) => ({body: {companyId}, count: prev.count + 1}));
    }, [currentCompanyId]);

    const value = useMemo<ReloginContextValue>(() => ({triggerRelogin, switching}), [triggerRelogin, switching]);

    return <ReloginContext.Provider value={value}>{children}</ReloginContext.Provider>;
}
