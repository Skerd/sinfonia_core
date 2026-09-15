import {createContext, useCallback, useMemo} from "react";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import useSelectedLanguage, {LanguageDictionary} from "@baseModule/helpers/hooks/useSelectedLanguage.ts";

/**
 * Supported translation payload values.
 * Language entries can be primitives, nested dictionaries, or arrays.
 */
export type TranslationValue = string | number | boolean | null | LanguageDictionary | TranslationValue[] | any;

/**
 * Resolves a translation key from the loaded language object.
 *
 * @param key dot-notation key (example: `auth.login.title`)
 * @param returnUndefinedIfNeeded if true, missing keys return `null` instead of a placeholder
 * @returns resolved translation value, `null`, or fallback placeholder (`---key---`)
 */
export type ResolveLanguageKey = (key: string, returnUndefinedIfNeeded?: boolean) => TranslationValue;

/**
 * Walks a dot-notation `key` (`auth.login.title`, `options.0`) through a language dictionary.
 * Any value that exists is returned as-is — strings (including `""`), numbers, booleans, objects
 * and arrays. A missing key (or `null`) yields `null` when `returnUndefinedIfNeeded`, otherwise
 * the `---key---` placeholder that makes untranslated copy obvious.
 */
export function resolveTranslationKey(
    dictionary: unknown,
    key: string,
    returnUndefinedIfNeeded = false,
): TranslationValue {
    let value: unknown = dictionary;
    for (const segment of key.split(".")) {
        if (value == null || typeof value !== "object") {
            value = undefined;
            break;
        }
        value = (value as Record<string, unknown>)[segment];
    }
    if (value == null) return returnUndefinedIfNeeded ? null : `---${key}---`;
    return value as TranslationValue;
}

/**
 * Nearest ancestor card/sheet/page dictionary. Nested widgets (e.g. `DisplayValue`)
 * read this so enum maps stay in that entity's language file.
 */
export const LanguageResolveContext = createContext<ResolveLanguageKey | null>(null);

/**
 * Props injected by `withLanguage` into wrapped components.
 *
 * @template TLanguage shape of the active language dictionary
 */
export type WithLanguageType<TLanguage extends LanguageDictionary = LanguageDictionary> = {
    currentLanguage: TLanguage | null,
    languageCode: string,
    resolveLanguageKey: ResolveLanguageKey
}

/**
 * Higher-order component that injects language context and translation helpers.
 *
 * Responsibilities:
 * - Reads the active language code from Redux.
 * - Loads language data through `useSelectedLanguage`.
 * - Injects `currentLanguage`, `languageCode`, `resolveLanguageKey`, and `withLanguage` metadata.
 * - Publishes {@link LanguageResolveContext} for nested widgets that must resolve enums
 *   from this component's language file (card/sheet), not their own.
 *
 * Fallback behavior:
 * - Missing keys return `---<key>---` by default to make untranslated copy obvious in UI.
 * - When `returnUndefinedIfNeeded` is true, missing keys return `null`.
 * - This HOC does not merge parent dictionaries; each wrapper keeps its own file only.
 *
 * @template TLanguage shape of the loaded language dictionary
 * @param componentFilePath Source path from repo `src/` onward, same module as bundled JSON stem, e.g. `src/modules/core/components/custom/files/singleFile.tsx` or `src/modules/realEstate/...`.
 */
const withLanguage = (componentFilePath: string) => (WrappedComponent: any) => {

    function EnhancedComponent_WithLanguage(props: any) {

        const languageCode = useSelector((state: RootState) => state.language.languageCode);

        const {currentLanguage} = useSelectedLanguage(componentFilePath.replaceAll("/", "_"), componentFilePath);

        const resolveLanguageKey: ResolveLanguageKey = useCallback(
            (key, returnUndefinedIfNeeded = false) => resolveTranslationKey(currentLanguage, key, returnUndefinedIfNeeded),
            [currentLanguage],
        );

        const withLanguageData = useMemo(() => ({
            languageCode,
            path: componentFilePath,
        }), [languageCode]);

        return (
            <LanguageResolveContext.Provider value={resolveLanguageKey}>
                <WrappedComponent
                    {...props}
                    currentLanguage={currentLanguage}
                    languageCode={languageCode}
                    resolveLanguageKey={resolveLanguageKey}
                    withLanguage={withLanguageData}
                />
            </LanguageResolveContext.Provider>
        )
    }

    return EnhancedComponent_WithLanguage;
}

export default withLanguage;
