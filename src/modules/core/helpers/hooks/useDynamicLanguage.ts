import {useCallback, useMemo} from "react";
import useSelectedLanguage, {type LanguageDictionary} from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import {type ResolveLanguageKey, type ResolveLanguageValue, resolveTranslationKey} from "@coreModule/helpers/hocs/withLanguage.tsx";

export type UseDynamicLanguageResult<TLanguage extends LanguageDictionary = LanguageDictionary> = {
    languageCode: string;
    /** The loaded dictionary, or `null` before it loads / without a path. */
    currentLanguage: TLanguage | null;
    /** The dictionary for this path and language is still loading. */
    loading: boolean;
    /** Same contract as `withLanguage`'s `resolveLanguageKey`. Stable until the dictionary changes. */
    resolveLanguageKey: ResolveLanguageKey;
    /** Same contract as `withLanguage`'s `resolveLanguageValue`, for keys holding an object or array. */
    resolveLanguageValue: ResolveLanguageValue;
};

/**
 * Hook equivalent of the `withLanguage` HOC for a language path known only at runtime.
 * An empty path loads nothing, so every key resolves to its placeholder (or `null`).
 * The returned object is memoized, so it is safe to depend on.
 *
 * @param languagePath Source path whose language JSON to load, e.g. `src/modules/core/.../citySheetView.tsx`.
 */
export function useDynamicLanguage<TLanguage extends LanguageDictionary = LanguageDictionary>(
    languagePath: string,
): UseDynamicLanguageResult<TLanguage> {
    const {currentLanguage, languageCode, loading} = useSelectedLanguage<TLanguage>(languagePath);
    const pending = loading && currentLanguage === null;

    const resolveLanguageKey: ResolveLanguageKey = useCallback(
        (key: string, returnUndefinedIfNeeded: boolean = false) =>
            resolveTranslationKey(currentLanguage, key, returnUndefinedIfNeeded, pending),
        [currentLanguage, pending],
    );

    const resolveLanguageValue: ResolveLanguageValue = useCallback(
        (key) => resolveTranslationKey(currentLanguage, key, true),
        [currentLanguage],
    );

    return useMemo(
        () => ({languageCode, currentLanguage, loading, resolveLanguageKey, resolveLanguageValue}),
        [languageCode, currentLanguage, loading, resolveLanguageKey, resolveLanguageValue],
    );
}
