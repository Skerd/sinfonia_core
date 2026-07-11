import {createSlice, type PayloadAction} from "@reduxjs/toolkit";
import {LoginFormResponseType} from "armonia/src/modules/core/api/user/public/login/login.form.response.type.ts";
import {ValidateTokenFormResponseType} from "armonia/src/modules/core/api/user/public/validateToken/validateToken.form.response.type.ts";
import {
    clearAuth,
    getRefreshToken,
    getToken,
    getUser,
    setRefreshToken,
    setToken,
    setUser
} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";

/**
 * Authentication state shared across guarded routes.
 */
export interface AuthenticationState {
    token: string | null;
    refreshToken: string | null;
    user: ValidateTokenFormResponseType;
    /** True when a mid-session API call detected an expired/invalid auth session. */
    sessionExpired: boolean;
}

/**
 * Returns a fresh anonymous user object.
 * Using a factory avoids accidental mutation of a shared singleton.
 */
const createEmptyUser = (): ValidateTokenFormResponseType => {
    return {
        id: "",
        username: "",
        name: "",
        surname: "",
        email: "",
        timezone: "",
        permissions: [],
        maxClearance: 1,
        company: {
            _id: "",
            name: ""
        }
    }
};

const initialState: AuthenticationState = {
    token: getToken() || null,
    refreshToken: getRefreshToken() || null,
    user: getUser() || createEmptyUser(),
    sessionExpired: false,
};

export const authenticationSlice = createSlice({
    name: 'authentication',
    initialState,
    reducers: {
        /**
         * Persists token pair and marks the user as authenticated.
         */
        logIn: (state, action: PayloadAction<LoginFormResponseType>) => {
            const {token, refreshToken} = action.payload;

            // Defensive guard for malformed runtime payloads.
            if (!token || !refreshToken) {
                clearAuth();
                state.token = null;
                state.refreshToken = null;
                state.user = createEmptyUser();
                state.sessionExpired = false;
                return;
            }

            setToken(token);
            setRefreshToken(refreshToken);
            state.token = token;
            state.refreshToken = refreshToken;
            state.sessionExpired = false;
        },
        /**
         * Replaces current user profile after token validation.
         */
        updateUserData: (state, action: PayloadAction<ValidateTokenFormResponseType>) => {
            setUser(action.payload);
            state.user = action.payload;
        },
        /**
         * Updates and persists access token (e.g. refresh/impersonation flows).
         */
        updateToken: (state, action: PayloadAction<string>) => {
            setToken(action.payload);
            state.token = action.payload;
        },
        /**
         * Updates only the timezone on the authenticated user profile.
         */
        updateTimezone: (state, action: PayloadAction<string>) => {
            state.user.timezone = action.payload;
            setUser({...state.user, timezone: action.payload});
        },
        updateUserValue: (state, action: PayloadAction<{field: string, value: string}>) => {
            const {field, value} = action.payload;
            //@ts-ignore
            state.user[field] = value;
            setUser({...state.user, [field]: value});
        },
        /**
         * Updates and persists refresh token without changing other auth state.
         */
        updateRefreshToken: (state, action: PayloadAction<string>) => {
            setRefreshToken(action.payload);
            state.refreshToken = action.payload;
        },
        /**
         * Clears all auth state and persisted auth storage.
         */
        signOut: (state) => {
            clearAuth();
            state.user = createEmptyUser();
            state.token = null;
            state.refreshToken = null;
            state.sessionExpired = false;
        },
        /**
         * Marks the session as expired after an authenticated API call fails auth.
         * Clears persisted credentials so further requests stop attaching a dead token,
         * but leaves `sessionExpired` set so the UI can show the expiry dialog first.
         */
        markSessionExpired: (state) => {
            if (state.sessionExpired) {
                return;
            }
            clearAuth();
            state.token = null;
            state.refreshToken = null;
            state.user = createEmptyUser();
            state.sessionExpired = true;
        },
    }
})

export const { logIn, signOut, updateTimezone, updateUserData, updateToken, updateRefreshToken, updateUserValue, markSessionExpired } = authenticationSlice.actions;
export default authenticationSlice.reducer;
