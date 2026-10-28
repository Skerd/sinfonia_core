import {createContext, useContext, useEffect, useMemo, useState, type ReactNode} from "react";
import {useDispatch, useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {getToken} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {type AuthUser, signOut, updateToken, updateUserData} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {ValidateTokenFormResponseType} from "armonia/src/modules/core/api/user/public/validateToken/validateToken.form.response.type.ts";

type PortalSessionValue = {
    isAuthenticated: boolean;
    /** True while a stored token is being checked, so guarded pages wait instead of redirecting. */
    isHydrating: boolean;
    user: AuthUser;
};

const PortalSessionContext = createContext<PortalSessionValue | null>(null);

/**
 * The visitor's portal account. The session is shared across the portal zone, so a token
 * may have been issued on another host: it is checked once here and the user loaded.
 */
export function PortalSessionProvider({children}: {children: ReactNode}) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const token = useSelector((state: RootState) => state.authentication.token);
    const user = useSelector((state: RootState) => state.authentication.user);
    const sessionExpired = useSelector((state: RootState) => state.authentication.sessionExpired);
    const [isHydrating, setIsHydrating] = useState(() => Boolean(getToken()));

    // No expiry dialog: end the session and send the visitor to sign in once.
    // Signing out clears the flag, so later navigations are not redirected again.
    useEffect(() => {
        if (!sessionExpired) return;
        dispatch(signOut());
        navigate("/login");
    }, [dispatch, navigate, sessionExpired]);

    // Depends on the token only: `navigate` changes on every pathname change, and
    // re-validating then would flash the account pages back to a loader.
    useEffect(() => {
        if (!token) {
            setIsHydrating(false);
            return;
        }

        const abortController = new AbortController();
        setIsHydrating(true);

        apiClient
            .get<ValidateTokenFormResponseType>("/api/user/validateToken", {signal: abortController.signal})
            .then(({data}) => {
                if (abortController.signal.aborted) return;
                dispatch(updateUserData(data));
                dispatch(updateToken(token));
                setIsHydrating(false);
            })
            .catch(() => {
                if (abortController.signal.aborted) return;
                dispatch(signOut());
                setIsHydrating(false);
            });

        return () => {
            abortController.abort();
        };
    }, [dispatch, token]);

    const value = useMemo(
        () => ({isAuthenticated: Boolean(token) && Boolean(user.id), isHydrating, user}),
        [isHydrating, token, user],
    );

    return <PortalSessionContext.Provider value={value}>{children}</PortalSessionContext.Provider>;
}

export function usePortalSession(): PortalSessionValue {
    const value = useContext(PortalSessionContext);
    if (!value) {
        throw new Error("usePortalSession must be used within PortalSessionProvider");
    }
    return value;
}
