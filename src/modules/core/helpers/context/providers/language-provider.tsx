import {ReactNode, useEffect, useLayoutEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import mainConfig from "@coreModule/assets/languages/mainConfig.json";
import {changeLanguage, pickLanguage} from "@coreModule/helpers/redux/slices/languageSlice.ts";
import {getLocalStorage, getLocalStorageValue, removeLocalStorageValue, setLocalStorageValue} from "@coreModule/helpers/context/localStorage/localStorageProvider.ts";
import {AppDispatch, RootState} from "@coreModule/helpers/redux/store/generalStore.ts";

export const LANGUAGE_STORAGE_KEY = "client-ui-language";
/** Set to "true" once the visitor chose the stored language in a language picker (`LanguageState.picked`). */
export const LANGUAGE_PICKED_STORAGE_KEY = "client-ui-language-picked";

type SupportedLanguage = {
  languageCode: string;
};

const SUPPORTED_LANGUAGE_CODES: ReadonlySet<string> = new Set(
  ((mainConfig.supportedLanguages as SupportedLanguage[] | undefined) ?? []).map((language) => language.languageCode),
);

export function isSupportedLanguageCode(value: unknown): value is string {
  return typeof value === "string" && SUPPORTED_LANGUAGE_CODES.has(value);
}

/** The stored language, as picked or not, the way the stored flag says. */
function restoreLanguage(languageCode: string) {
  return getLocalStorageValue(LANGUAGE_PICKED_STORAGE_KEY) === "true" ? pickLanguage(languageCode) : changeLanguage(languageCode);
}

type LanguageProviderProps = {
  /**
   * Descendant React tree that should receive hydrated language state.
   */
  children: ReactNode;
};

/**
 * Synchronizes Redux language state with localStorage and the document.
 *
 * Lifecycle:
 * - Before first paint: hydrates Redux from the persisted language, and whether
 *   the visitor picked it. Children mount only after that, so they never render
 *   (or fetch resources) in the default language first.
 * - After hydration: writes Redux language changes back to localStorage and
 *   mirrors them onto `<html lang>` for screen readers, hyphenation and
 *   spell-checking. The picked flag is stored separately, so the default
 *   language stored on a first visit never reads as a choice.
 * - Throughout: follows language changes made in other tabs.
 *
 * Safety guarantees:
 * - Values are validated against `mainConfig.supportedLanguages`.
 * - Invalid/stale values are ignored to avoid loading unsupported locales.
 */
export function LanguageProvider({children}: LanguageProviderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const languageCode = useSelector((state: RootState) => state.language.languageCode);
  const picked = useSelector((state: RootState) => state.language.picked);
  const [isHydrated, setIsHydrated] = useState(false);

  // Layout effect: the dispatch and the hydrated re-render both flush before
  // the browser paints, so the gate below costs no visible blank frame.
  useLayoutEffect(() => {
    const persistedLanguage = getLocalStorageValue(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguageCode(persistedLanguage)) {
      dispatch(restoreLanguage(persistedLanguage));
    }
    setIsHydrated(true);
  }, [dispatch]);

  // Gated on hydration so the default value never overwrites the stored one.
  useEffect(() => {
    if (!isHydrated || !isSupportedLanguageCode(languageCode)) return;
    setLocalStorageValue(LANGUAGE_STORAGE_KEY, languageCode);
    if (picked) setLocalStorageValue(LANGUAGE_PICKED_STORAGE_KEY, "true");
    else removeLocalStorageValue(LANGUAGE_PICKED_STORAGE_KEY);
    document.documentElement.lang = languageCode;
  }, [isHydrated, languageCode, picked]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== getLocalStorage()) return;
      if (event.key !== LANGUAGE_STORAGE_KEY && event.key !== LANGUAGE_PICKED_STORAGE_KEY) return;
      const storedLanguage = getLocalStorageValue(LANGUAGE_STORAGE_KEY);
      if (isSupportedLanguageCode(storedLanguage)) {
        dispatch(restoreLanguage(storedLanguage));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [dispatch]);

  return isHydrated ? <>{children}</> : null;
}
