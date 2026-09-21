import {useEffect, useRef} from 'react'

type KeyboardShortcutOptions = {
    /** Register the listener at all. Default `true`. */
    enabled?: boolean
    /** Require Shift to be held (and reject it when false). Default `false`. */
    shift?: boolean
    /** Require Alt/Option to be held (and reject it when false). Default `false`. */
    alt?: boolean
    /** Fire while focus is in an input/textarea/select/contenteditable. Default `false`. */
    allowInEditable?: boolean
}

function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false
    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Registers a global keyboard shortcut for `Meta/Ctrl + key` while the component is mounted.
 *
 * Behavior:
 * - Listens to `keydown` on `window`.
 * - Triggers when either Command (macOS) or Control (Windows/Linux) is held.
 * - Shift/Alt must match the options exactly (so `⌘⇧E` does not trigger a `⌘E` shortcut).
 * - Matches keys case-insensitively.
 * - Ignores key repeat, IME composition, events already handled by another shortcut,
 *   and (by default) events coming from editable fields.
 * - Calls `preventDefault()` before executing the callback.
 * - Always invokes the latest `callback` without re-subscribing, so inline arrows are fine.
 *
 * Note: with `shift`/`alt`, `e.key` is the modified character (e.g. `⇧1` → `!`), so pass that.
 *
 * @param key - Single key to combine with Meta/Ctrl (e.g. `'k'`, `'s'`, `'Backspace'`).
 * @param callback - Callback executed when the shortcut is triggered.
 * @param options - See {@link KeyboardShortcutOptions}.
 */
export function useKeyboardShortcuts(
    key: string,
    callback: (e: KeyboardEvent) => void,
    {
        enabled = true,
        shift = false,
        alt = false,
        allowInEditable = false
    }: KeyboardShortcutOptions = {}
) {
    const callbackRef = useRef(callback)
    callbackRef.current = callback

    useEffect(() => {
        if (!enabled) return

        const normalizedKey = key.toLowerCase()
        const handler = (e: KeyboardEvent) => {
            if (e.defaultPrevented || e.repeat || e.isComposing) return
            if (!(e.metaKey || e.ctrlKey)) return
            if (e.shiftKey !== shift || e.altKey !== alt) return
            if (e.key.toLowerCase() !== normalizedKey) return
            if (!allowInEditable && isEditableTarget(e.target)) return

            e.preventDefault()
            callbackRef.current(e)
        }

        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [key, enabled, shift, alt, allowInEditable])
}
