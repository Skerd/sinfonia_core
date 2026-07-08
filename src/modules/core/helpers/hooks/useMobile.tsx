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
export function useIsMobile() {
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

    return isMobile
}
