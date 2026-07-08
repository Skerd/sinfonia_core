import chatReducer from "@coreModule/helpers/redux/slices/chatSlice.ts";
import languageReducer from "@coreModule/helpers/redux/slices/languageSlice.ts";
import authenticationReducer, {signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";
import serverResourcesReducer from "@coreModule/helpers/redux/slices/serverResourceSlice.ts";
import uiReducer from "@coreModule/helpers/redux/slices/uiSlice.ts";
import {combineReducers, configureStore, type UnknownAction} from "@reduxjs/toolkit";
import notificationReducer from "@coreModule/helpers/redux/slices/notificationSlice.ts";

/**
 * Root reducer map for all application domains.
 * Keep keys stable because selectors depend on this shape.
 */
const appReducer = combineReducers({
    authentication: authenticationReducer,
    language: languageReducer,
    notifications: notificationReducer,
    chat: chatReducer,
    serverResources: serverResourcesReducer,
    ui: uiReducer
});

export type RootState = ReturnType<typeof appReducer>;

/**
 * Application root reducer.
 *
 * Behavior:
 * - For normal actions, delegates to the combined reducer.
 * - On auth sign-out, reinitializes the full state but preserves language to
 *   keep UX continuity after logout/login transitions.
 */
const rootReducer = (state: RootState | undefined, action: UnknownAction): RootState => {
    if (action.type === signOut.type) {
        const persistedLanguage = state?.language;
        const resetState = appReducer(undefined, action);
        return {
            ...resetState,
            language: persistedLanguage ?? resetState.language
        };
    }

    return appReducer(state, action);
};

export const store = configureStore({
    reducer: rootReducer
});

/**
 * Store instance and dispatch typing helpers.
 */
export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;