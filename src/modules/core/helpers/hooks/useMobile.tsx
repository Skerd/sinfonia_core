import React from 'react'

/**
 * Width threshold (in px) used to classify viewport as mobile.
 * Viewports strictly smaller than this breakpoint are considered mobile.
 */
const MOBILE_BREAKPOINT = 768

/**
 * Tracks whether the current viewport is in mobile range.
 *
 * Implementation details:
 * - Uses `matchMedia` to react to viewport width changes.
 * - Initializes from the current media-query match when running in browser.
 * - Uses modern `addEventListener` with an `onchange` fallback.
 */
/**
 * Forces the answer for a subtree, for previews that render at a device width rather than
 * the window's. `null` (the default) means "ask the window", so every existing caller is
 * unaffected. A CSS media query inside a preview frame follows that frame's own viewport;
 * this hook cannot, because the component still runs in the host window — hence the
 * override. See the Studio's `deviceFrame`.
 */
export const MobileOverrideContext = React.createContext<boolean | null>(null)

export function useIsMobile() {
    const override = React.useContext(MobileOverrideContext)
    const [isMobile, setIsMobile] = React.useState<boolean>(() => {
        if (typeof window === 'undefined') return false
        return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
    })

    React.useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
        const onChange = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches)
        }

        // Keep initial state in sync for cases where viewport changed before effect.
        setIsMobile(mql.matches)

        if (typeof mql.addEventListener === 'function') {
            mql.addEventListener('change', onChange)
            return () => mql.removeEventListener('change', onChange)
        }

        mql.onchange = onChange
        return () => {
            mql.onchange = null
        }
    }, [])

    return override ?? isMobile
}
