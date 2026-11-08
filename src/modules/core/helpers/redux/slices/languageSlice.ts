import {createSlice, type PayloadAction} from "@reduxjs/toolkit";
import mainConfig from "@coreModule/assets/languages/mainConfig.json";

/**
 * Stores the currently selected language code used by UI, API headers,
 * and language resource loaders.
 */
export interface LanguageState {
    languageCode: string
    /**
     * True once the visitor chose the language through a language picker (`pickLanguage`). The default language,
     * a restored one and a page's own switch (`changeLanguage`) leave it false, so a page can tell a deliberate
     * choice, even of the default language, from a language nobody chose. `LanguageProvider` persists it.
     */
    picked: boolean
}

/** Default fallback locale when no preference is persisted yet. */
const DEFAULT_LANGUAGE_CODE = mainConfig.defaults.language;

const initialState: LanguageState = {
    languageCode: DEFAULT_LANGUAGE_CODE,
    picked: false,
}

export const languageSlice = createSlice({
    name: "language",
    initialState,
    reducers: {
        /**
         * Updates the active locale code (example: "en-US", "sq-AL") without marking it as the visitor's choice.
         * Keep this value normalized by caller if strict validation is required.
         */
        changeLanguage: (state, action: PayloadAction<string>) => {
            state.languageCode = action.payload;
        },
        /**
         * The visitor chose this language in a language picker. Only pickers dispatch it; pages that switch the
         * language on their own use `changeLanguage`.
         */
        pickLanguage: (state, action: PayloadAction<string>) => {
            state.languageCode = action.payload;
            state.picked = true;
        },
        /**
         * Resets locale state to application default language.
         */
        resetLanguage: (state) => {
            state.languageCode = DEFAULT_LANGUAGE_CODE;
            state.picked = false;
        }
    }
})

/** Whether the visitor chose the current language in a language picker (see `LanguageState.picked`). */
export const selectLanguageWasPicked = (state: {language: LanguageState}): boolean => state.language.picked;

export const { changeLanguage, pickLanguage, resetLanguage } = languageSlice.actions;
export default languageSlice.reducer;
