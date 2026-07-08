import {createSlice, PayloadAction} from "@reduxjs/toolkit";

/**
 * Minimal user shape needed by the edit-user drawer.
 */
export type UserEditType = {
    name: string,
    surname: string,
    _id: string
}

/**
 * Shared cross-page UI state that does not belong to domain entities.
 */
export interface UiState {
    webSocketConnected: boolean,
    newCompanyCreated: number,
    newUserCreated: number,
    editUser: UserEditType | null,
    telegramLinked: boolean
}

const initialState: UiState = {
    webSocketConnected: false,
    newCompanyCreated: 0,
    newUserCreated: 0,
    editUser: null,
    telegramLinked: false,
}

export const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        /** Mirrors websocket connectivity for feature-level UI logic. */
        updateWebSocketConnectionStatus: (state, action: PayloadAction<boolean>) => {
            state.webSocketConnected = action.payload;
        },
        /** Bumps company change token to trigger list refreshes. */
        newCompanyCreated: (state) => {
            state.newCompanyCreated ++;
        },
        /** Bumps user change token to trigger list refreshes. */
        newUserCreated: (state) => {
            state.newUserCreated ++;
        },
        /**
         * Opens/closes user edit drawer by setting current user payload.
         * `null` means closed.
         */
        editUser: (state, action: PayloadAction<UserEditType | null>) => {
            state.editUser = action.payload;
        },
        /** Stores current Telegram link status reflected by backend. */
        telegramLinked: (state, action: PayloadAction<boolean>) => {
            state.telegramLinked = action.payload;
        },
        /**
         * Resets transient UI state while preserving connectivity and integrations.
         * Useful when navigating between contexts that should not keep edit modal state.
         */
        resetTransientUiState: (state) => {
            state.newCompanyCreated = 0;
            state.newUserCreated = 0;
            state.editUser = null;
        },
    }
});

export const {updateWebSocketConnectionStatus, newCompanyCreated, telegramLinked, newUserCreated, editUser, resetTransientUiState} = uiSlice.actions;
export default uiSlice.reducer;