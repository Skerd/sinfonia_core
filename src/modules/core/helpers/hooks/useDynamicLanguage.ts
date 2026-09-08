import {useCallback, useRef} from "react";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import useSelectedLanguage from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import type {ResolveLanguageKey, TranslationValue} from "@coreModule/helpers/hocs/withLanguage.tsx";

/**
 * Drop-in hook equivalent of the withLanguage HOC but with a dynamic path.
 * Use inside components that need language loaded from a path known only at runtime.
 */
export function useDynamicLanguage(languagePath: string) {
    const languageCode = useSelector((state: RootState) => state.language.languageCode);
    const {currentLanguage} = useSelectedLanguage(languagePath.replaceAll("/", "_"), languagePath);
    const keyPathCache = useRef<Map<string, string[]>>(new Map());

    const getKeyPath = useCallback((key: string): string[] => {
        const cached = keyPathCache.current.get(key);
        if (cached) return cached;
        const path = key.split(".");
        keyPathCache.current.set(key, path);
        return path;
    }, []);

    const resolveLanguageKey: ResolveLanguageKey = useCallback((key, returnUndefinedIfNeeded = false) => {
        try {
            const keySplits = getKeyPath(key);
            let value: unknown = currentLanguage;
            for (const segment of keySplits) {
                if (value == null || typeof value !== "object") throw new Error();
                value = (value as Record<string, unknown>)[segment];
            }
            if (typeof value !== "string") {
                if (!value) throw new Error();
                return value as TranslationValue;
            }
            return value;
        } catch {
            return returnUndefinedIfNeeded ? null : `---${key}---`;
        }
    }, [currentLanguage, getKeyPath]);

    return {languageCode, currentLanguage, resolveLanguageKey};
}
