import {ReactNode, useEffect, useMemo, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import mainConfig from "@coreModule/assets/languages/mainConfig.json";
import {changeLanguage} from "@coreModule/helpers/redux/slices/languageSlice.ts";
import {getCookie, setCookie} from "@coreModule/helpers/context/cookies/cookies.ts";
import {AppDispatch, RootState} from "@coreModule/helpers/redux/store/generalStore.ts";

/**
 * Cookie key used to persist the selected UI language.
 */
const LANGUAGE_COOKIE_NAME = "client-ui-language";
/**
 * Language cookie retention period in seconds (1 year).
 */
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

type SupportedLanguage = {
  languageCode: string;
};

type LanguageProviderProps = {
  /**
   * Descendant React tree that should receive hydrated language state.
   */
  children: ReactNode;
  /**
   * Optional cookie key override (useful for multi-app deployments).
   */
  storageKey?: string;
};

/**
 * Synchronizes Redux language state with a persisted cookie.
 *
 * Lifecycle:
 * - On mount: reads language cookie and hydrates Redux if value is valid.
 * - After hydration: writes Redux language changes back to cookie.
 *
 * Safety guarantees:
 * - Cookie values are validated against `mainConfig.supportedLanguages`.
 * - Invalid/stale cookie values are ignored to avoid loading unsupported locales.
 */
export function LanguageProvider({
  children,
  storageKey = LANGUAGE_COOKIE_NAME,
}: LanguageProviderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const languageCode = useSelector((state: RootState) => state.language.languageCode);
  const [isHydrated, setIsHydrated] = useState(false);

  /**
   * Memoized lookup set for O(1) validation of persisted language codes.
   */
  const supportedLanguageCodes = useMemo(
    () =>
      new Set(
        ((mainConfig.supportedLanguages as SupportedLanguage[] | undefined) ?? []).map(
          (language) => language.languageCode
        )
      ),
    []
  );

  /**
   * One-time hydration pass from cookie to Redux state.
   */
  useEffect(() => {
    const persistedLanguage = getCookie(storageKey);

    if (
      typeof persistedLanguage === "string" &&
      supportedLanguageCodes.has(persistedLanguage)
    ) {
      dispatch(changeLanguage(persistedLanguage));
    }

    setIsHydrated(true);
  }, [dispatch, storageKey, supportedLanguageCodes]);

  /**
   * Persists current Redux language after hydration completes.
   * This prevents a premature write of the default value before cookie read.
   */
  useEffect(() => {
    if (!isHydrated || !supportedLanguageCodes.has(languageCode)) return;
    setCookie(storageKey, languageCode, LANGUAGE_COOKIE_MAX_AGE);
  }, [isHydrated, languageCode, storageKey, supportedLanguageCodes]);

  return <>{children}</>;
}
