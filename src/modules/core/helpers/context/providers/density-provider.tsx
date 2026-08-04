import { getCookie, setCookie } from '@coreModule/helpers/context/cookies/cookies.ts'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

/**
 * How tightly the panel packs information. Set as `data-density` on the
 * document root, where it retunes the `--density-*` and `--grid-card-min`
 * tokens in index.css. Components read those tokens rather than knowing this
 * value exists, which is what stops the two modes drifting apart.
 */
export type Density = 'comfortable' | 'compact'

const DEFAULT_DENSITY: Density = 'comfortable'
const DENSITY_COOKIE_NAME = 'client-ui-density'
const DENSITY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

const VALID_DENSITIES: readonly Density[] = ['comfortable', 'compact']

function isDensity(value: unknown): value is Density {
    return typeof value === 'string' && VALID_DENSITIES.includes(value as Density)
}

type DensityProviderState = {
    density: Density
    setDensity: (density: Density) => void
}

type DensityProviderProps = {
    children: ReactNode
    defaultDensity?: Density
    storageKey?: string
}

const DensityContext = createContext<DensityProviderState | undefined>(undefined)

export function DensityProvider({
    children,
    defaultDensity = DEFAULT_DENSITY,
    storageKey = DENSITY_COOKIE_NAME,
}: DensityProviderProps) {
    const [density, _setDensity] = useState<Density>(() => {
        const persisted = getCookie(storageKey)
        return isDensity(persisted) ? persisted : defaultDensity
    })

    useEffect(() => {
        if (typeof document === 'undefined') return
        // Comfortable is the token default, so it is expressed as the absence of
        // the attribute rather than a second selector that has to stay in sync.
        if (density === 'comfortable') {
            document.documentElement.removeAttribute('data-density')
        } else {
            document.documentElement.setAttribute('data-density', density)
        }
    }, [density])

    const setDensity = useCallback((next: Density) => {
        setCookie(storageKey, next, DENSITY_COOKIE_MAX_AGE)
        _setDensity(next)
    }, [storageKey])

    const contextValue = useMemo(() => ({ density, setDensity }), [density, setDensity])

    return <DensityContext value={contextValue}>{children}</DensityContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDensity = () => {
    const context = useContext(DensityContext)
    if (context === undefined) throw new Error('useDensity must be used within a DensityProvider')
    return context
}
