import {useEffect, useState, type ReactNode} from "react";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {signOut, updateToken, updateUserData} from "@coreModule/helpers/redux/slices/authSlice.ts";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import {
    ValidateTokenFormResponseType
} from "armonia/src/modules/core/api/user/public/validateToken/validateToken.form.response.type.ts";
import {SessionSetupScreen, SESSION_SETUP_TOTAL_STEPS} from "@coreModule/components/ui/sessionSetupScreen.tsx";

type AuthenticationProviderProps = {
    children: ReactNode;
    setupStep?: number;
    setupTotal?: number;
};

/**
 * Validates the session (`GET /api/user/validateToken`) and blocks children until it succeeds.
 * Mount only on the authenticated tree, above AccessProvider / WebSocketProvider / TableConfigProvider / ViewConfigProvider.
 */
export function AuthenticationProvider({
    children,
    setupStep = 1,
    setupTotal = SESSION_SETUP_TOTAL_STEPS,
}: AuthenticationProviderProps) {
    const dispatch = useDispatch();
    const [isHydrated, setIsHydrated] = useState(false);
    const [error, setError] = useState(false);
    const [retryToken, setRetryToken] = useState(0);
    const loginToken = useSelector((state: RootState) => state.authentication.token);
    const sessionExpired = useSelector((state: RootState) => state.authentication.sessionExpired);

    function goToLogin() {
        dispatch(signOut());
        window.location.href = "/authenticate/login";
    }

    useEffect(() => {
        if (sessionExpired) {
            setIsHydrated(false);
            setError(true);
            return;
        }

        if (!loginToken) {
            goToLogin();
            return;
        }

        const abortController = new AbortController();
        setError(false);
        setIsHydrated(false);

        apiClient
            .get<ValidateTokenFormResponseType>("/api/user/validateToken", {signal: abortController.signal})
            .then(({data}) => {
                if (abortController.signal.aborted) return;
                dispatch(updateUserData(data));
                dispatch(updateToken(loginToken));
                setIsHydrated(true);
                setError(false);
            })
            .catch(() => {
                if (abortController.signal.aborted) return;
                setError(true);
                setIsHydrated(false);
            });

        return () => {
            abortController.abort();
        };
    }, [dispatch, loginToken, sessionExpired, retryToken]);

    if (error || !isHydrated) {
        return (
            <SessionSetupScreen
                step={setupStep}
                total={setupTotal}
                phase="auth"
                error={error}
                onRetry={() => {
                    if (!loginToken || sessionExpired) {
                        goToLogin();
                        return;
                    }
                    setRetryToken((n) => n + 1);
                }}
            />
        );
    }

    return children;
}
