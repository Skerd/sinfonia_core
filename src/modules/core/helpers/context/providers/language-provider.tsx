import {ReactNode, useEffect, useMemo, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import mainConfig from "@coreModule/assets/languages/mainConfig.json";
import {changeLanguage} from "@coreModule/helpers/redux/slices/languageSlice.ts";
import {getLocalStorageValue, setLocalStorageValue} from "@coreModule/helpers/context/localStorage/localStorageProvider.ts";
import {AppDispatch, RootState} from "@coreModule/helpers/redux/store/generalStore.ts";

const LANGUAGE_STORAGE_KEY = "client-ui-language";

type SupportedLanguage = {
  languageCode: string;
};

type LanguageProviderProps = {
  /**
   * Descendant React tree that should receive hydrated language state.
   */
  children: ReactNode;
};

/**
 * Synchronizes Redux language state with localStorage.
 *
 * Lifecycle:
 * - On mount: reads the persisted language and hydrates Redux if value is valid.
 * - After hydration: writes Redux language changes back to localStorage.
 *
 * Safety guarantees:
 * - Values are validated against `mainConfig.supportedLanguages`.
 * - Invalid/stale values are ignored to avoid loading unsupported locales.
 */
export function LanguageProvider({children}: LanguageProviderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const languageCode = useSelector((state: RootState) => state.language.languageCode);
  const [isHydrated, setIsHydrated] = useState(false);

  /**
   * Memoized lookup set for O(1) validation of persisted language codes.
   */
  const supportedLanguageCodes = useMemo(() => new Set(((mainConfig.supportedLanguages as SupportedLanguage[] | undefined) ?? []).map((language) => language.languageCode)), []);

  /**
   * One-time hydration pass from localStorage to Redux state.
   */
  useEffect(() => {
    const persistedLanguage = getLocalStorageValue(LANGUAGE_STORAGE_KEY);

    if (typeof persistedLanguage === "string" && supportedLanguageCodes.has(persistedLanguage)) {
      dispatch(changeLanguage(persistedLanguage));
    }

    setIsHydrated(true);
  }, [dispatch, supportedLanguageCodes]);

  /**
   * Persists current Redux language after hydration completes.
   * This prevents a premature write of the default value before the stored read.
   */
  useEffect(() => {
    if (!isHydrated || !supportedLanguageCodes.has(languageCode)) return;
    setLocalStorageValue(LANGUAGE_STORAGE_KEY, languageCode);
  }, [isHydrated, languageCode, supportedLanguageCodes]);

  return <>{children}</>;
}
