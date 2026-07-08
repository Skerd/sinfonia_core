import {RefObject, useEffect} from 'react'

/**
 * Invokes `handler` when a pointer interaction happens outside the target element.
 *
 * Notes:
 * - Uses `pointerdown` to cover mouse, touch, and pen input with one listener.
 * - No-op during SSR/non-DOM environments.
 *
 * @param ref - Ref of the element considered as the "inside" region.
 * @param handler - Callback executed when interaction occurs outside `ref.current`.
 */
export function useOutsideClick(
    ref: RefObject<HTMLElement | null>,
    handler: () => void
) {
    useEffect(() => {
        if (typeof document === 'undefined') return

        const listener = (event: PointerEvent) => {
            const element = ref.current
            const target = event.target

            if (!element) return
            if (!(target instanceof Node)) return
            if (element.contains(target)) return

            handler()
        }

        document.addEventListener('pointerdown', listener)

        return () => {
            document.removeEventListener('pointerdown', listener)
        }
    }, [ref, handler])
}
