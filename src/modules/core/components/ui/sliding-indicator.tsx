import * as React from "react"

import { cn } from "@coreModule/components/lib/utils.ts"

type Box = { left: number; top: number; width: number; height: number }

/**
 * The highlight behind the active item of a row (header links, tabs) that slides to the next active item instead of
 * jumping. Put it first inside the row: the row is its positioned parent, the items are positioned (`relative`) so
 * they paint over it, and the active item carries `data-indicator-active` (or matches `activeSelector`, e.g. the
 * `aria-current="page"` a `NavLink` sets). `activeKey` changes whenever another item becomes active. Nothing is drawn
 * while no item is active.
 */
function SlidingIndicator({
  activeKey,
  activeSelector = "[data-indicator-active]",
  className,
}: {
  activeKey: string | undefined
  activeSelector?: string
  className?: string
}) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [box, setBox] = React.useState<Box | null>(null)
  // The first box of a row appears in place; only a move between items slides.
  const [slides, setSlides] = React.useState(false)

  React.useLayoutEffect(() => {
    const row = ref.current?.parentElement
    if (!row) return
    const measure = () => {
      const active = row.querySelector<HTMLElement>(activeSelector)
      setBox(active ? { left: active.offsetLeft, top: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight } : null)
    }
    measure()
    // Fonts arriving and the window resizing move the items.
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    return () => observer.disconnect()
  }, [activeKey, activeSelector])

  React.useEffect(() => {
    if (!box) {
      setSlides(false)
      return
    }
    const frame = requestAnimationFrame(() => setSlides(true))
    return () => cancelAnimationFrame(frame)
  }, [box])

  return (
    <span
      ref={ref}
      aria-hidden
      data-slot="sliding-indicator"
      className={cn(
        "pointer-events-none absolute top-0 left-0",
        slides && "transition-[transform,width,height] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        !box && "hidden",
        className
      )}
      style={box ? { transform: `translate(${box.left}px, ${box.top}px)`, width: box.width, height: box.height } : undefined}
    />
  )
}

export { SlidingIndicator }
