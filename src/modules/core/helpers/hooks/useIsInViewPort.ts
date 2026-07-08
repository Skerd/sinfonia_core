import {RefObject, useEffect, useState} from 'react'

/**
 * Observes whether an element is currently visible within a viewport/root container.
 *
 * Notes:
 * - Uses `IntersectionObserver` with a small threshold (`0.01`) for near-immediate detection.
 * - Falls back to `false` when the element is missing or browser APIs are unavailable.
 * - Re-subscribes after each layout so targets that mount later (conditional render / async UI)
 *   are observed; `ref` / `rootRef` object identity is stable, so `[ref]` effect deps would not rerun.
 *
 * @param ref - Ref of the target element to observe.
 * @param rootRef - Optional ref of a scrollable root container. Defaults to browser viewport.
 * @returns `true` when the target element intersects the root viewport, otherwise `false`.
 */
export default function useIsInViewport(
    ref: RefObject<HTMLElement | null>,
    rootRef?: RefObject<HTMLElement | null>
) {
    const [isInView, setIsInView] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
            return
        }

        const element = ref.current
        if (!element) {
            setIsInView(false)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => setIsInView(entry.isIntersecting),
            {
                root: rootRef?.current ?? null,
                threshold: 0.01,
            }
        )

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [rootRef, ref.current])

    return isInView
}
