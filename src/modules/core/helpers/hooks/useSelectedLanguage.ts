import {useEffect, useState} from 'react'
import {RootState} from '@coreModule/helpers/redux/store/generalStore.ts'
import {useSelector} from 'react-redux'
import mainConfig from '@coreModule/assets/languages/mainConfig.json'

const messages = mainConfig.helper.languageSelect
const defaultLanguageCode = mainConfig.defaults.language || 'en-US'
export type LanguageDictionary = Record<string, unknown>

/**
 * Matches `src/modules/<package>/<rest>` where {@code package} is the first segment under {@code modules/}
 * (e.g. core, realEstate, billing). No dedicated list — new modules pick up routes via the regex.
 */
const SRC_MODULES_TAIL = /^src\/modules\/[^/]+\/(.+)$/i

/**
 * Path segment under `…/assets/languages/<locale>/` for the JSON file (no extension).
 * For `src/modules/<pkg>/anything/Under/Pkg.tsx`, the stem is {@code anything/Under/Pkg} (inside that package root).
 * Legacy module-relative paths (no `src/modules/<pkg>/` prefix) are returned unchanged minus extension.
 */
export function localeJsonStemFromSourcePath(sourcePath: string): string {
    let s = sourcePath.replace(/\\/g, '/').trim()
    s = s.replace(/^\/+/, '')
    s = s.replace(/\.(tsx|ts|jsx|js)$/i, '')
    const m = SRC_MODULES_TAIL.exec(s)
    return m ? m[1] : s
}

/**
 * Builds `${prePath}/${locale}/<stem>.json` for the Vite glob loaders.
 */
export function convertComponentPathToLanguagePath(
    stemUnderLocale: string,
    languageCode: string,
    prePath: string,
): string {
    const stem = stemUnderLocale.replace(/\.(tsx|ts|jsx|js)$/, '')
    return `${prePath}/${languageCode}/${stem}.json`
}

// Cache for loaded component translations
const translationCache = new Map<string, LanguageDictionary>()

// Pre-load all component language files using Vite's glob
// This ensures Vite can statically analyze and bundle all language files
type LanguageModule = { default: LanguageDictionary } | LanguageDictionary;
type LanguageModuleLoader = () => Promise<LanguageModule>;

/**
 * One glob for every `src/modules/<pkg>/assets/languages/<locale>/…/*.json`.
 * Vite requires a static pattern (no runtime folder scan); new modules are included automatically
 * when they add `assets/languages` — no per-module alias entry needed here.
 */
const rawLanguageGlob = import.meta.glob('@/modules/*/assets/languages/*/**/*.json', {
    eager: false,
    import: 'default',
}) as Record<string, LanguageModuleLoader>;

let cachedBundlerLanguageRoots: readonly string[] | undefined

/** Roots bundled by Vite derived from glob keys (`…/<pkg>/assets/languages`). */
function bundlerLanguageAssetRootsOrdered(globKeys: readonly string[]): readonly string[] {
    if (cachedBundlerLanguageRoots) return cachedBundlerLanguageRoots
    const roots = new Set<string>()
    for (const rawKey of globKeys) {
        const n = rawKey.replace(/\\/g, '/')
        const i = n.indexOf('/assets/languages/')
        if (i === -1) continue
        roots.add(`${n.slice(0, i)}/assets/languages`)
    }
    cachedBundlerLanguageRoots = [...roots].sort((a, b) => a.localeCompare(b))
    return cachedBundlerLanguageRoots
}

/** Prepaths to try under `/<locale>/<stem>.json` for loaders. */
function prePathsForSourcePath(sourcePath: string): readonly string[] {
    const n = sourcePath.replace(/\\/g, '/').trim()
    const underSrcModules = /\bsrc\/modules\/([^/]+)\//.exec(n)
    if (underSrcModules?.[1]) {
        const segment = underSrcModules[1]
        return [`/src/modules/${segment}/assets/languages`]
    }
    return bundlerLanguageAssetRootsOrdered(Object.keys(rawLanguageGlob))
}

/** Match glob keys (/src-relative, OS paths) to loaders used by convertComponentPathToLanguagePath output. */
function resolveLanguageModuleLoader(langPathFromConvert: string): LanguageModuleLoader | undefined {
    const normalizedRequest = langPathFromConvert.replace(/\\/g, '/');
    const direct = [
        normalizedRequest,
        normalizedRequest.startsWith('/') ? normalizedRequest.slice(1) : `/${normalizedRequest}`,
    ];
    for (const k of direct) {
        const hit = rawLanguageGlob[k];
        if (hit) return hit;
    }

    const parts = normalizedRequest.split('/assets/languages/');
    const suffixAfterLocaleRoot = parts.length > 1 ? parts[1] : null;
    if (!suffixAfterLocaleRoot) return undefined;
    for (const [key, loader] of Object.entries(rawLanguageGlob)) {
        const keyN = key.replace(/\\/g, '/');
        if (keyN.endsWith(suffixAfterLocaleRoot)) return loader;
    }
    return undefined;
}

/**
 * Removes non-translation metadata keys from loaded language payloads.
 */
function stripTranslationMeta(input: unknown): LanguageDictionary {
    if (!input || typeof input !== 'object') return {}
    if (!('path' in input)) return input as LanguageDictionary
    const {path: _path, ...rest} = input as Record<string, unknown>
    return rest
}

/**
 * Loads a component translation dictionary with ordered fallbacks and caching.
 *
 * Fallback order:
 * 1) requested `languageCode`
 * 2) configured default language from `mainConfig`
 * 3) hard fallback `en-US`
 *
 * Returns an empty object when no file can be loaded.
 */
async function loadComponentLanguage(
    componentPath: string,
    languageCode: string,
): Promise<LanguageDictionary> {
    const cacheKey = `${componentPath}|${languageCode}`

    // Check cache first
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey) ?? {}
    }

    const candidateLanguageCodes = Array.from(
        new Set([languageCode, defaultLanguageCode, 'en-US'].filter(Boolean))
    )

    for (const code of candidateLanguageCodes) {
        const stem = localeJsonStemFromSourcePath(componentPath);
        for (const prePath of prePathsForSourcePath(componentPath)) {
            const langPath = convertComponentPathToLanguagePath(stem, code, prePath);
            const loader = resolveLanguageModuleLoader(langPath);
            if (!loader) continue;
            try {
                const module = await loader();
                const translations = stripTranslationMeta(module);
                translationCache.set(cacheKey, translations);
                return translations;
            } catch {
                // Try next module root or language candidate.
            }
        }
    }

    translationCache.set(cacheKey, {})
    return {}
}


/**
 * Resolves and returns the selected language dictionary for a component.
 * JSON is resolved from `assets/languages` for the matched `src/modules/<pkg>/…` tree. Legacy stems (no {@code src/modules/<pkg>/} prefix) are tried against every bundled language root discovered from Vite globs above.
 *
 * @param where - Component cache key (underscores for slashes, e.g. from `path.replaceAll("/", "_")`).
 * @param initiator - Preferred: `src/modules/<module>/.../*.tsx` source path; drives JSON lookup. If empty, `where` becomes the path (with `_` restored to `/`).
 * @returns Loading/error flags with the currently resolved translation dictionary.
 */
export default function useSelectedLanguage<TLanguage extends LanguageDictionary = LanguageDictionary>(
    where: string,
    initiator: string = ''
) {
    const languageCode = useSelector((state: RootState) => state.language.languageCode)

    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<boolean>(false)
    const [errorDescription, setErrorDescription] = useState<string>('')
    const [currentLanguage, setCurrentLanguage] = useState<TLanguage | null>(null)

    useEffect(() => {
        if (!languageCode || !where) {
            setLoading(false)
            setCurrentLanguage(null)
            return
        }

        const componentPath = initiator || where.replace(/_/g, '/')
        let isActive = true

        setLoading(true)
        setError(false)
        setErrorDescription('')

        loadComponentLanguage(componentPath, languageCode)
            .then((translations) => {
                if (!isActive) return
                setCurrentLanguage(translations as TLanguage)
                setLoading(false)
            })
            .catch(() => {
                if (!isActive) return
                setCurrentLanguage({} as TLanguage)
                const errorMessage = `${messages['failedToLoadComponentLanguage']}'${componentPath}'`
                setErrorDescription(errorMessage)
                setError(true)
                setLoading(false)
            })

        return () => {
            isActive = false
        }
    }, [languageCode, where, initiator])

    return {loading, error, errorDescription, currentLanguage}
}