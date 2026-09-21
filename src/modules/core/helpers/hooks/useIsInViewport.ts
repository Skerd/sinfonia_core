import {RefObject, useEffect, useRef, useState} from 'react'

export type UseIsInViewportOptions = {
    /** Fraction of the target (0–1) that must be visible to count as in view. Default `0.01`. */
    threshold?: number;
    /** Grows or shrinks the root's box, e.g. `"200px"` to report in-view before the target scrolls in. Default `"0px"`. */
    rootMargin?: string;
};

type ObservedTarget = {
    observer: IntersectionObserver;
    element: HTMLElement;
    root: HTMLElement | null;
    optionsKey: string;
};

/**
 * Observes whether an element is currently visible within a viewport/root container.
 *
 * Notes:
 * - Refs do not trigger renders, so the attached target/root nodes are compared after every commit
 *   and the observer is rebuilt only when one of them (or the options) actually changed. This picks up
 *   targets that mount later or are replaced (conditional render / async UI) and roots attached after
 *   the first render.
 * - Returns `false` while the target is missing, and when `IntersectionObserver` is unavailable.
 *
 * @param ref - Ref of the target element to observe.
 * @param rootRef - Optional ref of a scrollable root container. Defaults to browser viewport.
 * @param options - Intersection threshold and root margin.
 * @returns `true` when the target element intersects the root, otherwise `false`.
 */
export default function useIsInViewport(
    ref: RefObject<HTMLElement | null>,
    rootRef?: RefObject<HTMLElement | null>,
    {threshold = 0.01, rootMargin = "0px"}: UseIsInViewportOptions = {},
): boolean {
    const [isInView, setIsInView] = useState(false)
    const observedRef = useRef<ObservedTarget | null>(null)

    // Runs after every commit on purpose (see the note above). It cannot loop: `setIsInView` is only
    // reached when the observed node changed, and the next commit then matches and returns early.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') {
            return
        }

        const element = ref.current
        const root = rootRef?.current ?? null
        const optionsKey = `${threshold}|${rootMargin}`
        const observed = observedRef.current

        if (observed && observed.element === element && observed.root === root && observed.optionsKey === optionsKey) {
            return
        }

        observed?.observer.disconnect()
        observedRef.current = null

        if (!element) {
            if (observed) setIsInView(false)
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const latest = entries[entries.length - 1]
                if (latest) setIsInView(latest.isIntersecting)
            },
            {root, rootMargin, threshold},
        )
        observer.observe(element)
        observedRef.current = {observer, element, root, optionsKey}
    })

    useEffect(() => {
        return () => {
            observedRef.current?.observer.disconnect()
            observedRef.current = null
        }
    }, [])

    return isInView
}
