import {useMemo} from "react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useDynamicLanguage} from "@coreModule/components/entityPage/useDynamicLanguage.ts";

/**
 * Preview label resolution.
 *
 * A `ViewConfig` stores language *keys*, and which dictionary resolves them depends on
 * the page hosting the view (`withLanguage(path)` / `sheetLanguagePath`) — the config
 * itself does not say. So the Studio defaults to showing the raw key, which is what a
 * developer binding `form.nameLabel` actually wants to see, and only resolves against a
 * real dictionary when they supply the path.
 */
export function useStudioLanguage(languagePath: string): {
    resolveLanguageKey: ResolveLanguageKey;
    languageCode: string;
} {
    /* `useDynamicLanguage` is a hook: it must run unconditionally, path or not. */
    const dynamic = useDynamicLanguage(languagePath);

    const identity = useMemo<ResolveLanguageKey>(
        () => (key: string, returnUndefinedIfNeeded = false) =>
            key ? key : returnUndefinedIfNeeded ? null : "",
        [],
    );

    return {
        resolveLanguageKey: languagePath.trim() ? dynamic.resolveLanguageKey : identity,
        languageCode: dynamic.languageCode,
    };
}
