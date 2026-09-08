import {getLocalStorageValue, setLocalStorageValue} from '@coreModule/helpers/context/localStorage/localStorageProvider.ts'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

/**
 * How tightly the panel packs information. Set as `data-density` on the
 * document root, where it retunes the `--density-*` and `--grid-card-min`
 * tokens in index.css. Components read those tokens rather than knowing this
 * value exists, which is what stops the two modes drifting apart.
 */
export type Density = 'comfortable' | 'compact'

const DEFAULT_DENSITY: Density = 'comfortable'
const DENSITY_STORAGE_KEY = 'client-ui-density'

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
}

const DensityContext = createContext<DensityProviderState | undefined>(undefined)

export function DensityProvider({children, defaultDensity = DEFAULT_DENSITY}: DensityProviderProps) {
    const [density, _setDensity] = useState<Density>(() => {
        const persisted = getLocalStorageValue(DENSITY_STORAGE_KEY)
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
        setLocalStorageValue(DENSITY_STORAGE_KEY, next)
        _setDensity(next)
    }, [])

    const contextValue = useMemo(() => ({ density, setDensity }), [density, setDensity])

    return <DensityContext value={contextValue}>{children}</DensityContext>
}

export const useDensity = () => {
    const context = useContext(DensityContext)
    if (context === undefined) throw new Error('useDensity must be used within a DensityProvider')
    return context
}
