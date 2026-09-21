import {useSyncExternalStore} from 'react'

const HOVER_QUERY = '(hover: hover) and (pointer: fine)'

const hasMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'

function subscribe(onChange: () => void) {
    if (!hasMatchMedia()) return () => {}
    const mql = window.matchMedia(HOVER_QUERY)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
}

const getSnapshot = () => !hasMatchMedia() || window.matchMedia(HOVER_QUERY).matches
const getServerSnapshot = () => true

/**
 * Whether the primary pointer can hover (a mouse/trackpad), updating live if the
 * device changes (e.g. a 2-in-1 switching between mouse and touch).
 *
 * Deliberately NOT derived from viewport width / {@link useIsMobile}: those answer
 * "is the screen small" (a layout question -- collapse the sidebar), not "can this
 * pointer hover" (an interaction question). A narrow-but-not-maximized desktop
 * browser window is small by the former and hover-capable by the latter; treating
 * width as a hover proxy silently drops hover-only affordances (a tooltip peek, say)
 * for any mouse user whose window happens to be narrow.
 */
export function useCanHover(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
