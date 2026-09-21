import {createListenerMiddleware} from "@reduxjs/toolkit";
import {type AuthenticationState, signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {
    clearAuth,
    clearRefreshToken,
    setRefreshToken,
    setToken,
    setUser
} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";

type AuthRootState = {authentication: AuthenticationState};

/**
 * Mirrors the `authentication` slice into localStorage so the session survives reloads.
 *
 * Rules:
 * - A signed-out state (no token) always clears stored auth, so a dead token is never re-sent.
 * - Otherwise only the fields that changed are written.
 *
 * The effect is synchronous on purpose: RTK calls it before `dispatch` returns, so code that
 * reads the token straight from storage (e.g. `apiClient`) sees the new value right after dispatching.
 */
export const authPersistence = createListenerMiddleware();

authPersistence.startListening.withTypes<AuthRootState>()({
    predicate: (action, currentState, originalState) =>
        currentState.authentication !== originalState.authentication
        // Sign-out always clears storage, even when the state was already empty.
        || signOut.match(action),
    effect: (_action, api) => {
        const next = api.getState().authentication;
        const previous = api.getOriginalState().authentication;

        if (!next.token) {
            clearAuth();
            return;
        }

        if (next.token !== previous.token) {
            setToken(next.token);
        }
        if (next.refreshToken !== previous.refreshToken) {
            if (next.refreshToken) {
                setRefreshToken(next.refreshToken);
            }
            else {
                clearRefreshToken();
            }
        }
        if (next.user !== previous.user) {
            setUser(next.user);
        }
    },
});
