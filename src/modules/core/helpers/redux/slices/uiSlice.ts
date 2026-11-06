import {createSlice, PayloadAction} from "@reduxjs/toolkit";

/**
 * Shared cross-page UI state that does not belong to domain entities.
 */
export interface UiState {
    webSocketConnected: boolean,
    telegramLinked: boolean
}

const initialState: UiState = {
    webSocketConnected: false,
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
        /** Stores current Telegram link status reflected by backend. */
        telegramLinked: (state, action: PayloadAction<boolean>) => {
            state.telegramLinked = action.payload;
        },
    }
});

export const {updateWebSocketConnectionStatus, telegramLinked} = uiSlice.actions;
export default uiSlice.reducer;