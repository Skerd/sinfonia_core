import {useCallback, useMemo} from "react";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import useSelectedLanguage, {type LanguageDictionary} from "@baseModule/helpers/hooks/useSelectedLanguage.ts";
import {type ResolveLanguageKey, resolveTranslationKey} from "@coreModule/helpers/hocs/withLanguage.tsx";

export type UseDynamicLanguageResult<TLanguage extends LanguageDictionary = LanguageDictionary> = {
    languageCode: string;
    /** The loaded dictionary, or `null` before it loads / without a path. */
    currentLanguage: TLanguage | null;
    /** The dictionary for this path and language is still loading. */
    loading: boolean;
    /** Same contract as `withLanguage`'s `resolveLanguageKey`. Stable until the dictionary changes. */
    resolveLanguageKey: ResolveLanguageKey;
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
    const languageCode = useSelector((state: RootState) => state.language.languageCode);
    const {currentLanguage, loading} = useSelectedLanguage<TLanguage>(languagePath.replaceAll("/", "_"), languagePath);

    const resolveLanguageKey: ResolveLanguageKey = useCallback(
        (key, returnUndefinedIfNeeded = false) => resolveTranslationKey(currentLanguage, key, returnUndefinedIfNeeded),
        [currentLanguage],
    );

    return useMemo(
        () => ({languageCode, currentLanguage, loading, resolveLanguageKey}),
        [languageCode, currentLanguage, loading, resolveLanguageKey],
    );
}
