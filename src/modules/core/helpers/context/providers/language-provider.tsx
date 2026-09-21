import {ReactNode, useEffect, useLayoutEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import mainConfig from "@coreModule/assets/languages/mainConfig.json";
import {changeLanguage} from "@coreModule/helpers/redux/slices/languageSlice.ts";
import {getLocalStorage, getLocalStorageValue, setLocalStorageValue} from "@coreModule/helpers/context/localStorage/localStorageProvider.ts";
import {AppDispatch, RootState} from "@coreModule/helpers/redux/store/generalStore.ts";

export const LANGUAGE_STORAGE_KEY = "client-ui-language";

type SupportedLanguage = {
  languageCode: string;
};

const SUPPORTED_LANGUAGE_CODES: ReadonlySet<string> = new Set(
  ((mainConfig.supportedLanguages as SupportedLanguage[] | undefined) ?? []).map((language) => language.languageCode),
);

export function isSupportedLanguageCode(value: unknown): value is string {
  return typeof value === "string" && SUPPORTED_LANGUAGE_CODES.has(value);
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
 * - Before first paint: hydrates Redux from the persisted language. Children
 *   mount only after that, so they never render (or fetch resources) in the
 *   default language first.
 * - After hydration: writes Redux language changes back to localStorage and
 *   mirrors them onto `<html lang>` for screen readers, hyphenation and
 *   spell-checking.
 * - Throughout: follows language changes made in other tabs.
 *
 * Safety guarantees:
 * - Values are validated against `mainConfig.supportedLanguages`.
 * - Invalid/stale values are ignored to avoid loading unsupported locales.
 */
export function LanguageProvider({children}: LanguageProviderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const languageCode = useSelector((state: RootState) => state.language.languageCode);
  const [isHydrated, setIsHydrated] = useState(false);

  // Layout effect: the dispatch and the hydrated re-render both flush before
  // the browser paints, so the gate below costs no visible blank frame.
  useLayoutEffect(() => {
    const persistedLanguage = getLocalStorageValue(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguageCode(persistedLanguage)) {
      dispatch(changeLanguage(persistedLanguage));
    }
    setIsHydrated(true);
  }, [dispatch]);

  // Gated on hydration so the default value never overwrites the stored one.
  useEffect(() => {
    if (!isHydrated || !isSupportedLanguageCode(languageCode)) return;
    setLocalStorageValue(LANGUAGE_STORAGE_KEY, languageCode);
    document.documentElement.lang = languageCode;
  }, [isHydrated, languageCode]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== getLocalStorage() || event.key !== LANGUAGE_STORAGE_KEY) return;
      if (isSupportedLanguageCode(event.newValue)) {
        dispatch(changeLanguage(event.newValue));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [dispatch]);

  return isHydrated ? <>{children}</> : null;
}
