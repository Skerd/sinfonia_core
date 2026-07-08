import {useSelector} from 'react-redux';
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import useSelectedLanguage, {LanguageDictionary} from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import {useCallback, useMemo, useRef} from "react";
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
 *
 * Fallback behavior:
 * - Missing keys return `---<key>---` by default to make untranslated copy obvious in UI.
 * - When `returnUndefinedIfNeeded` is true, missing keys return `null`.
 *
 * @template TLanguage shape of the loaded language dictionary
 * @param componentFilePath Source path from repo `src/` onward, same module as bundled JSON stem, e.g. `src/modules/core/components/custom/files/singleFile.tsx` or `src/modules/realEstate/...`.
 */
const withLanguage = (componentFilePath: string) => (WrappedComponent: any) => {

    function EnhancedComponent_WithLanguage(props: any) {

        const languageCode = useSelector((state: RootState) => state.language.languageCode);

        const {currentLanguage} = useSelectedLanguage(componentFilePath.replaceAll("/", "_"), componentFilePath);

        const keyPathCache = useRef<Map<string, string[]>>(new Map());

        const getKeyPath = useCallback((key: string): string[] => {
            const cachedPath = keyPathCache.current.get(key);
            if (cachedPath) {
                return cachedPath;
            }
            const path = key.split(".");
            keyPathCache.current.set(key, path);
            return path;
        }, []);

        const resolveLanguageKey: ResolveLanguageKey = useCallback((key, returnUndefinedIfNeeded = false) => {
            try {
                const keySplits = getKeyPath(key);
                let returnThis: unknown = currentLanguage;
                for (let i = 0; i < keySplits.length; i++) {
                    if (returnThis == null || typeof returnThis !== "object") {
                        throw new Error("Missing translation key");
                    }
                    returnThis = (returnThis as Record<string, unknown>)[keySplits[i]];
                }
                if (typeof returnThis !== "string") {
                    if (!returnThis) {
                        throw new Error("Missing translation value");
                    }
                    return returnThis as TranslationValue;
                }
                return returnThis;
            } catch {
                if (returnUndefinedIfNeeded) {
                    return null;
                } else {
                    return (`---${key}---`);
                }
            }
        }, [currentLanguage, getKeyPath]);

        const withLanguageData = useMemo(() => ({
            languageCode,
            path: componentFilePath,
        }), [languageCode]);

        return (
            <WrappedComponent
                {...props}
                currentLanguage={currentLanguage}
                languageCode={languageCode}
                resolveLanguageKey={resolveLanguageKey}
                withLanguage={withLanguageData}
            />
        )
    }

    return EnhancedComponent_WithLanguage;
}

export default withLanguage;
