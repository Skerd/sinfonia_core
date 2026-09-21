import {createContext, useContext, useSyncExternalStore} from 'react'

/** Viewports strictly narrower than this (in px) are considered mobile. */
export const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * Forces the answer for a subtree, for previews that render at a device width rather than
 * the window's. `null` (the default) means "ask the window", so every existing caller is
 * unaffected. A CSS media query inside a preview frame follows that frame's own viewport;
 * this hook cannot, because the component still runs in the host window — hence the
 * override. See the Studio's `deviceFrame`.
 */
export const MobileOverrideContext = createContext<boolean | null>(null)

const hasMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'

function subscribe(onChange: () => void) {
    if (!hasMatchMedia()) return () => {}
    const mql = window.matchMedia(MOBILE_QUERY)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
}

const getSnapshot = () => hasMatchMedia() && window.matchMedia(MOBILE_QUERY).matches
const getServerSnapshot = () => false

/**
 * Whether the viewport is narrower than {@link MOBILE_BREAKPOINT}, updating as it resizes.
 * A {@link MobileOverrideContext} value above the caller takes precedence.
 * Returns `false` where `matchMedia` is unavailable (SSR, jsdom).
 */
export function useIsMobile(): boolean {
    const override = useContext(MobileOverrideContext)
    const isMobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
    return override ?? isMobile
}
