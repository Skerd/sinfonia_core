import {createSlice, type PayloadAction} from "@reduxjs/toolkit";
import {LoginFormResponseType} from "armonia/src/modules/core/api/user/public/login/login.form.response.type.ts";
import {ValidateTokenFormResponseType} from "armonia/src/modules/core/api/user/public/validateToken/validateToken.form.response.type.ts";
import {getRefreshToken, getToken, getUser} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";

/**
 * Authenticated user profile as held in the store.
 * `phoneNumber` is editable from account settings but not part of the validate-token response.
 */
export type AuthUser = ValidateTokenFormResponseType & {
    phoneNumber?: string;
};

/** Profile fields that can be patched individually from account settings. */
export type EditableUserField = "name" | "surname" | "phoneNumber";

/**
 * Authentication state shared across guarded routes.
 *
 * Reducers are pure: localStorage is written by the `authPersistence` listener
 * (`redux/listeners/authPersistence.ts`) after each change, and only read here to seed the initial state.
 */
export interface AuthenticationState {
    token: string | null;
    refreshToken: string | null;
    user: AuthUser;
    /** True when a mid-session API call detected an expired/invalid auth session. */
    sessionExpired: boolean;
}

/**
 * Returns a fresh anonymous user object.
 * Using a factory avoids accidental mutation of a shared singleton.
 */
const createEmptyUser = (): AuthUser => ({
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
});

/**
 * Lazy initial state: storage is read whenever the slice is (re)initialized,
 * not once at module load, so root resets never resurrect a stale session.
 */
const createInitialState = (): AuthenticationState => ({
    token: getToken() || null,
    refreshToken: getRefreshToken() || null,
    user: getUser() || createEmptyUser(),
    sessionExpired: false,
});

/** Company id embedded in an access token. Requests scope with this, not a second copy of the id. */
function companyIdFromAccessToken(token: string): string | null {
    const segment = token.split(".")[1];
    if (!segment) return null;
    try {
        const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
        const json = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
        const companyId = JSON.parse(json).company?._id;
        return typeof companyId === "string" && companyId ? companyId : null;
    } catch {
        return null;
    }
}

/** Wipes credentials from state; the persistence listener clears storage to match. */
const clearSession = (state: AuthenticationState, sessionExpired: boolean) => {
    state.token = null;
    state.refreshToken = null;
    state.user = createEmptyUser();
    state.sessionExpired = sessionExpired;
};

export const authenticationSlice = createSlice({
    name: 'authentication',
    initialState: createInitialState,
    reducers: {
        /**
         * Stores the token pair and marks the user as authenticated.
         * The session company follows the access token, which is what later requests send as `x-company-id`.
         */
        logIn: (state, action: PayloadAction<LoginFormResponseType>) => {
            const {token, refreshToken} = action.payload;

            // Defensive guard for malformed runtime payloads.
            if (!token || !refreshToken) {
                clearSession(state, false);
                return;
            }

            state.token = token;
            state.refreshToken = refreshToken;
            state.sessionExpired = false;
            const companyId = companyIdFromAccessToken(token);
            if (companyId) {
                state.user.company._id = companyId;
            }
        },
        /**
         * Replaces current user profile after token validation.
         */
        updateUserData: (state, action: PayloadAction<ValidateTokenFormResponseType>) => {
            state.user = action.payload;
        },
        /**
         * Updates the access token (e.g. refresh/impersonation flows).
         */
        updateToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
        },
        /**
         * Updates the refresh token without changing other auth state.
         */
        updateRefreshToken: (state, action: PayloadAction<string>) => {
            state.refreshToken = action.payload;
        },
        /**
         * Updates only the timezone on the authenticated user profile.
         */
        updateTimezone: (state, action: PayloadAction<string>) => {
            state.user.timezone = action.payload;
        },
        /**
         * Patches a single editable profile field.
         */
        updateUserValue: (state, action: PayloadAction<{field: EditableUserField, value: string}>) => {
            const {field, value} = action.payload;
            state.user[field] = value;
        },
        /**
         * Clears all auth state (storage is cleared by the persistence listener).
         */
        signOut: (state) => {
            clearSession(state, false);
        },
        /**
         * Marks the session as expired after an authenticated API call fails auth.
         * Drops credentials (and, via the listener, storage) so further requests stop attaching a dead token,
         * but leaves `sessionExpired` set so the UI can show the expiry dialog first.
         */
        markSessionExpired: (state) => {
            if (state.sessionExpired) {
                return;
            }
            clearSession(state, true);
        },
    }
});

export const {
    logIn,
    signOut,
    updateTimezone,
    updateUserData,
    updateToken,
    updateRefreshToken,
    updateUserValue,
    markSessionExpired
} = authenticationSlice.actions;
export default authenticationSlice.reducer;
