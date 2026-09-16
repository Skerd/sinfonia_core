import {usePersistedPreference} from '@baseModule/helpers/context/localStorage/usePersistedPreference.ts'
import {createContext, useContext, useLayoutEffect, useMemo, ReactNode} from 'react'

/**
 * How tightly the panel packs information. Set as `data-density` on the
 * document root, where it retunes the `--density-*` and `--grid-card-min`
 * tokens in index.css. Components read those tokens rather than knowing this
 * value exists, which is what stops the two modes drifting apart.
 */
export type Density = 'comfortable' | 'compact'

export const DENSITIES: readonly Density[] = ['comfortable', 'compact']
export const DENSITY_STORAGE_KEY = 'client-ui-density'
const DEFAULT_DENSITY: Density = 'comfortable'

export function isDensity(value: unknown): value is Density {
    return typeof value === 'string' && DENSITIES.includes(value as Density)
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
    const [density, setDensity] = usePersistedPreference(DENSITY_STORAGE_KEY, isDensity, defaultDensity)

    // Layout effect so a switch lands before paint, not one frame after it.
    useLayoutEffect(() => {
        if (typeof document === 'undefined') return
        // Comfortable is the token default, so it is expressed as the absence of
        // the attribute rather than a second selector that has to stay in sync.
        if (density === 'comfortable') {
            document.documentElement.removeAttribute('data-density')
        } else {
            document.documentElement.setAttribute('data-density', density)
        }
    }, [density])

    const contextValue = useMemo(() => ({density, setDensity}), [density, setDensity])

    return <DensityContext value={contextValue}>{children}</DensityContext>
}

export const useDensity = () => {
    const context = useContext(DensityContext)
    if (context === undefined) throw new Error('useDensity must be used within a DensityProvider')
    return context
}
