import {createContext, useCallback, useMemo} from "react";
import useSelectedLanguage, {LanguageDictionary} from "@coreModule/helpers/hooks/useSelectedLanguage.ts";

/**
 * Supported translation payload values.
 * Language entries can be primitives, nested dictionaries, or arrays.
 */
export type TranslationValue = string | number | boolean | null | LanguageDictionary | TranslationValue[] | any;

/**
 * Resolves a translation key from the loaded language object.
 *
 * Typed as text, because nearly every call renders a string: `resolveLanguageKey("title")` is a
 * `string`, and with `returnUndefinedIfNeeded` it is `string | null`. That makes the `as string`
 * cast at call sites unnecessary. Keys holding an object or array (enum maps, step lists) are
 * read with {@link ResolveLanguageValue} instead, which types the shape you expect.
 *
 * @param key dot-notation key (example: `auth.login.title`)
 * @param returnUndefinedIfNeeded if true, missing keys return `null` instead of a placeholder
 * @returns resolved translation text, `null`, or fallback placeholder (`---key---`)
 */
export type ResolveLanguageKey = {
    (key: string, returnUndefinedIfNeeded?: false): string;
    (key: string, returnUndefinedIfNeeded: boolean | undefined): string | null;
};

/**
 * Reads a translation key that holds structured data (an object or array), such as an enum map or
 * a list of steps. Missing keys yield `null` rather than the `---key---` placeholder, which would
 * be a string in a place that expects a shape.
 *
 * @example const steps = resolveLanguageValue<Record<string, string>>("steps") ?? {};
 */
export type ResolveLanguageValue = <TValue = TranslationValue>(key: string) => TValue | null;

/**
 * Producer side of {@link ResolveLanguageKey}: the shape a resolver *implementation* has, for the
 * HOC itself and for wrappers that re-map keys before delegating (`axios.` prefixes, parent-first
 * lookups). Implementations legitimately return `null`, so they cannot satisfy the caller-facing
 * overloads, which promise a `string` when `returnUndefinedIfNeeded` is not set. Declare an
 * implementation as this type; it stays assignable to `ResolveLanguageKey` for callers.
 */
export type ResolveLanguageKeyImpl = (key: string, returnUndefinedIfNeeded?: boolean) => TranslationValue;

/**
 * Walks a dot-notation `key` (`auth.login.title`, `options.0`) through a language dictionary.
 * Any value that exists is returned as-is — strings (including `""`), numbers, booleans, objects
 * and arrays. A missing key (or `null`) yields `null` when `returnUndefinedIfNeeded`, otherwise
 * the `---key---` placeholder that makes untranslated copy obvious.
 *
 * `pending` marks a dictionary that has not loaded yet: missing keys then yield `""` instead of
 * the placeholder, so a first render does not flash `---key---` for copy that is on its way.
 */
export function resolveTranslationKey(
    dictionary: unknown,
    key: string,
    returnUndefinedIfNeeded = false,
    pending = false,
): TranslationValue {
    let value: unknown = dictionary;
    for (const segment of key.split(".")) {
        if (value == null || typeof value !== "object") {
            value = undefined;
            break;
        }
        value = (value as Record<string, unknown>)[segment];
    }
    if (value == null) {
        if (returnUndefinedIfNeeded) return null;
        return pending ? "" : `---${key}---`;
    }
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
    resolveLanguageKey: ResolveLanguageKey,
    /** Reads keys holding an object or array. */
    resolveLanguageValue: ResolveLanguageValue
}

/**
 * Higher-order component that injects language context and translation helpers.
 *
 * Responsibilities:
 * - Loads language data (and the active language code) through `useSelectedLanguage`.
 * - Injects `currentLanguage`, `languageCode`, `resolveLanguageKey`, `resolveLanguageValue`,
 *   and `withLanguage` metadata.
 * - Publishes {@link LanguageResolveContext} for nested widgets that must resolve enums
 *   from this component's language file (card/sheet), not their own.
 *
 * Fallback behavior:
 * - Missing keys return `---<key>---` by default to make untranslated copy obvious in UI.
 * - While the first dictionary is still loading, missing keys return `""` instead.
 * - When `returnUndefinedIfNeeded` is true, missing keys return `null`.
 * - This HOC does not merge parent dictionaries; each wrapper keeps its own file only.
 *
 * @template TLanguage shape of the loaded language dictionary
 * @param componentFilePath Source path from repo `src/` onward, same module as bundled JSON stem, e.g. `src/modules/core/components/custom/files/singleFile.tsx` or `src/modules/realEstate/...`.
 *   It should be the wrapping file's own path; sharing another file's dictionary must be listed in `tests/withLanguagePaths.test.ts`.
 */
const withLanguage = (componentFilePath: string) => (WrappedComponent: any) => {

    function EnhancedComponent_WithLanguage(props: any) {

        const {currentLanguage, languageCode, loading} = useSelectedLanguage(componentFilePath);
        /* Nothing loaded yet: keys resolve to "" instead of flashing `---key---`. */
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
                    resolveLanguageValue={resolveLanguageValue}
                    withLanguage={withLanguageData}
                />
            </LanguageResolveContext.Provider>
        )
    }

    EnhancedComponent_WithLanguage.displayName =
        `withLanguage(${WrappedComponent?.displayName ?? WrappedComponent?.name ?? "Component"})`;

    return EnhancedComponent_WithLanguage;
}

export default withLanguage;
