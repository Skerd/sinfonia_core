import {useEffect, useState} from 'react'
import {RootState} from '@baseModule/helpers/redux/store/generalStore.ts'
import {useSelector} from 'react-redux'
import mainConfig from '@coreModule/assets/languages/mainConfig.json'
import {filterGlobByEnabledModules} from '@baseModule/helpers/modules/enabledModules.ts'
import {applyModuleMenuContributions} from '@baseModule/helpers/moduleContributions/loadMenuLanguageContributions.ts'
import {applyModuleRolesPermissionsContributions} from '@baseModule/helpers/moduleContributions/loadRolesPermissionsContributions.ts'

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

type LanguageModule = { default: LanguageDictionary } | LanguageDictionary
export type LanguageModuleLoader = () => Promise<LanguageModule>

export type LanguageLoadResult = {
    dictionary: LanguageDictionary
    /** A language file existed but could not be loaded (e.g. a failed chunk request). Such results are not cached. */
    failed: boolean
}

export type ComponentLanguageLoader = {
    /** Resolves a component dictionary with fallbacks. Concurrent calls for the same component and locale share one load. */
    load: (componentPath: string, languageCode: string) => Promise<LanguageLoadResult>
    /** The cached dictionary, if this component and locale already loaded (including "no file" → `{}`). */
    peek: (componentPath: string, languageCode: string) => LanguageDictionary | undefined
    /** Drops cached and in-flight results. */
    clear: () => void
}

type ComponentLanguageLoaderOptions = {
    /** Vite glob of language JSON files: key is the file path, value loads the parsed JSON. */
    glob: Record<string, LanguageModuleLoader>
    /** Locale tried after the requested one (then `en-US`). */
    defaultLanguageCode: string
    /** Post-processing applied to a loaded dictionary, given the locale that was actually loaded. */
    transform?: (dictionary: LanguageDictionary, languageCode: string) => LanguageDictionary
}

const EMPTY_DICTIONARY: LanguageDictionary = Object.freeze({})

/** Glob keys and requested paths reduced to `src/modules/…`, so `/src/…`, `src/…` and absolute OS paths compare equal. */
function languageIndexKey(path: string): string {
    const normalized = path.replace(/\\/g, '/')
    const start = normalized.indexOf('src/modules/')
    return start >= 0 ? normalized.slice(start) : normalized.replace(/^\/+/, '')
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
 * Creates a component language loader over a glob of JSON files.
 *
 * Fallback order: requested `languageCode` → `defaultLanguageCode` → `en-US`. A component under
 * `src/modules/<pkg>/…` only reads that package's `assets/languages`; legacy stems (no package
 * prefix) try every package root, in path order. Missing files resolve to `{}`.
 */
export function createComponentLanguageLoader({
    glob,
    defaultLanguageCode: fallbackLanguageCode,
    transform = (dictionary) => dictionary,
}: ComponentLanguageLoaderOptions): ComponentLanguageLoader {
    const loaders = new Map<string, LanguageModuleLoader>()
    for (const [key, loader] of Object.entries(glob)) {
        loaders.set(languageIndexKey(key), loader)
    }

    /* Every `…/assets/languages` root, in path order: the search list for legacy stems without a package. */
    const rootSet = new Set<string>()
    for (const key of loaders.keys()) {
        const index = key.indexOf('/assets/languages/')
        if (index !== -1) rootSet.add(`${key.slice(0, index)}/assets/languages`)
    }
    const languageRoots = [...rootSet].sort((a, b) => a.localeCompare(b))

    const dictionaries = new Map<string, LanguageDictionary>()
    const inFlight = new Map<string, Promise<LanguageLoadResult>>()

    const rootsFor = (componentPath: string): readonly string[] => {
        const pkg = /\bsrc\/modules\/([^/]+)\//.exec(componentPath.replace(/\\/g, '/'))?.[1]
        return pkg ? [`src/modules/${pkg}/assets/languages`] : languageRoots
    }

    const resolve = async (componentPath: string, languageCode: string): Promise<LanguageLoadResult> => {
        const stem = localeJsonStemFromSourcePath(componentPath)
        const roots = rootsFor(componentPath)
        const codes = [...new Set([languageCode, fallbackLanguageCode, 'en-US'].filter(Boolean))]
        let failed = false

        for (const code of codes) {
            for (const root of roots) {
                const loader = loaders.get(languageIndexKey(convertComponentPathToLanguagePath(stem, code, root)))
                if (!loader) continue
                try {
                    const module = await loader()
                    return {dictionary: transform(stripTranslationMeta(module), code), failed: false}
                } catch {
                    // Try the next root or language; remember the failure so it is not cached as "no file".
                    failed = true
                }
            }
        }
        return {dictionary: EMPTY_DICTIONARY, failed}
    }

    return {
        load(componentPath, languageCode) {
            const cacheKey = `${componentPath}|${languageCode}`
            const cached = dictionaries.get(cacheKey)
            if (cached) return Promise.resolve({dictionary: cached, failed: false})

            const pending = inFlight.get(cacheKey)
            if (pending) return pending

            const request = resolve(componentPath, languageCode).then((result) => {
                if (inFlight.get(cacheKey) === request) {
                    inFlight.delete(cacheKey)
                    if (!result.failed) dictionaries.set(cacheKey, result.dictionary)
                }
                return result
            })
            inFlight.set(cacheKey, request)
            return request
        },
        peek(componentPath, languageCode) {
            return dictionaries.get(`${componentPath}|${languageCode}`)
        },
        clear() {
            dictionaries.clear()
            inFlight.clear()
        },
    }
}

/**
 * One glob for every `src/modules/<pkg>/assets/languages/<locale>/…/*.json`.
 * Vite requires a static pattern (no runtime folder scan); new modules are included automatically
 * when they add `assets/languages` — no per-module alias entry needed here.
 */
const rawLanguageGlob = filterGlobByEnabledModules(
    import.meta.glob('@/modules/*/assets/languages/*/**/*.json', {
        eager: false,
        import: 'default',
    }) as Record<string, LanguageModuleLoader>,
)

/** The app-wide loader behind {@link useSelectedLanguage}; module menu and roles contributions are merged in. */
export const componentLanguageLoader = createComponentLanguageLoader({
    glob: rawLanguageGlob,
    defaultLanguageCode,
    transform: (dictionary, languageCode) =>
        applyModuleRolesPermissionsContributions(applyModuleMenuContributions(dictionary, languageCode), languageCode),
})

type SelectedLanguageState = {
    requestKey: string
    componentPath: string
    dictionary: LanguageDictionary | null
    loading: boolean
    error: boolean
}

function stateFor(
    requestKey: string,
    componentPath: string,
    languageCode: string,
    previous?: SelectedLanguageState,
): SelectedLanguageState {
    if (!requestKey) return {requestKey, componentPath, dictionary: null, loading: false, error: false}

    const cached = componentLanguageLoader.peek(componentPath, languageCode)
    if (cached) return {requestKey, componentPath, dictionary: cached, loading: false, error: false}

    // Same component in a new language: keep showing the previous strings until the new ones arrive.
    const keep = previous?.componentPath === componentPath ? previous.dictionary : null
    return {requestKey, componentPath, dictionary: keep, loading: true, error: false}
}

/**
 * Resolves and returns the selected language dictionary for a component.
 * JSON is resolved from `assets/languages` for the matched `src/modules/<pkg>/…` tree. Legacy stems (no {@code src/modules/<pkg>/} prefix) are tried against every bundled language root discovered from Vite globs above.
 *
 * Already-loaded dictionaries are returned on the first render (no placeholder flash), and a
 * language switch keeps the previous dictionary until the new one is ready.
 *
 * @param componentPath - `src/modules/<module>/.../*.tsx` source path that drives the JSON lookup. Empty loads nothing.
 * @returns The active language code, loading/error flags and the currently resolved translation dictionary.
 */
export default function useSelectedLanguage<TLanguage extends LanguageDictionary = LanguageDictionary>(
    componentPath: string,
) {
    const languageCode = useSelector((state: RootState) => state.language.languageCode)
    const requestKey = languageCode && componentPath ? `${componentPath}|${languageCode}` : ''

    const [state, setState] = useState<SelectedLanguageState>(() => stateFor(requestKey, componentPath, languageCode))

    // Adjust during render when the request changes, so the returned value never lags a render behind.
    let current = state
    if (state.requestKey !== requestKey) {
        current = stateFor(requestKey, componentPath, languageCode, state)
        setState(current)
    }

    useEffect(() => {
        if (!requestKey) return
        let active = true

        componentLanguageLoader.load(componentPath, languageCode).then(({dictionary, failed}) => {
            if (!active) return
            setState((previous) => {
                if (previous.requestKey !== requestKey) return previous
                if (!previous.loading && previous.dictionary === dictionary && previous.error === failed) return previous
                return {...previous, dictionary, loading: false, error: failed}
            })
        })

        return () => {
            active = false
        }
    }, [requestKey, componentPath, languageCode])

    return {
        languageCode,
        loading: current.loading,
        error: current.error,
        errorDescription: current.error ? `${messages['failedToLoadComponentLanguage']}'${componentPath}'` : '',
        currentLanguage: current.dictionary as TLanguage | null,
    }
}
