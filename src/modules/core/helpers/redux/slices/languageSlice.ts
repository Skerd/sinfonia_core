import {createSlice, type PayloadAction} from "@reduxjs/toolkit";
import mainConfig from "@coreModule/assets/languages/mainConfig.json";

/**
 * Stores the currently selected language code used by UI, API headers,
 * and language resource loaders.
 */
export interface LanguageState {
    languageCode: string
}

/** Default fallback locale when no preference is persisted yet. */
const DEFAULT_LANGUAGE_CODE = mainConfig.defaults.language;

const initialState: LanguageState = {
    languageCode: DEFAULT_LANGUAGE_CODE
}

export const languageSlice = createSlice({
    name: "language",
    initialState,
    reducers: {
        /**
         * Updates the active locale code (example: "en-US", "sq-AL").
         * Keep this value normalized by caller if strict validation is required.
         */
        changeLanguage: (state, action: PayloadAction<string>) => {
            state.languageCode = action.payload;
        },
        /**
         * Resets locale state to application default language.
         */
        resetLanguage: (state) => {
            state.languageCode = DEFAULT_LANGUAGE_CODE;
        }
    }
})

export const { changeLanguage, resetLanguage } = languageSlice.actions;
export default languageSlice.reducer;