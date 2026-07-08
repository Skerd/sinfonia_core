import {useEffect} from 'react'

/**
 * Registers a global keyboard shortcut for `Meta/Ctrl + key`.
 *
 * Behavior:
 * - Listens to `keydown` on `window`.
 * - Triggers when either Command (macOS) or Control (Windows/Linux) is held.
 * - Matches keys case-insensitively.
 * - Calls `preventDefault()` before executing the callback.
 *
 * @param key - Single key to combine with Meta/Ctrl (e.g. `'k'`, `'s'`).
 * @param onCallFunction - Callback executed when the shortcut is triggered.
 */
export function useKeyboardShortcuts(key: string, onCallFunction: () => void) {
    useEffect(() => {
        if (typeof window === 'undefined') return

        const normalizedKey = key.toLowerCase()
        const handler = (e: KeyboardEvent) => {
            const isShortcutPressed =
                (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === normalizedKey

            if (!isShortcutPressed) return

            e.preventDefault()
            onCallFunction()
        }

        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [key, onCallFunction])
}
