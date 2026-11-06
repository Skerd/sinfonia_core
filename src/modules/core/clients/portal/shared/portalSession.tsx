import {createContext, useContext, useEffect, useMemo, useState, type ReactNode} from "react";
import {useDispatch, useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {type AuthUser, signOut, updateToken, updateUserData} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {ValidateTokenFormResponseType} from "armonia/src/modules/core/api/user/public/validateToken/validateToken.form.response.type.ts";

type PortalSessionValue = {
    isAuthenticated: boolean;
    /** True while a stored token is being checked, so guarded pages wait instead of redirecting. */
    isHydrating: boolean;
    user: AuthUser;
};

const VALIDATE_TOKEN_REQUEST = {method: "get" as const, url: "/api/user/validateToken", data: {}};

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
    // The token whose check finished (either way); until it matches, guarded pages wait.
    const [checkedToken, setCheckedToken] = useState<string | null>(null);
    const isHydrating = Boolean(token) && checkedToken !== token;

    // No expiry dialog: end the session and send the visitor to sign in once.
    // Signing out clears the flag, so later navigations are not redirected again.
    useEffect(() => {
        if (!sessionExpired) return;
        dispatch(signOut());
        navigate("/login");
    }, [dispatch, navigate, sessionExpired]);

    // One check per new token. Counted during render so the first one starts with the first render.
    const [validation, setValidation] = useState({token, count: token ? 1 : 0});
    if (validation.token !== token) {
        setValidation({token, count: token ? validation.count + 1 : validation.count});
    }
    // Silent (no translator); a newer token aborts the check of the previous one.
    useHttpRequest<ValidateTokenFormResponseType>(VALIDATE_TOKEN_REQUEST, {}, validation.count, true, {
        success: (data) => {
            dispatch(updateUserData(data));
            if (token) dispatch(updateToken(token));
            setCheckedToken(token);
        },
        error: () => {
            dispatch(signOut());
            setCheckedToken(token);
        },
    });

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
