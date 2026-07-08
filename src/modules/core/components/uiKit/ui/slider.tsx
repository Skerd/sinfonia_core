import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@coreModule/components/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@coreModule/components/uiKit/ui/tooltip"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  showTooltip,
  onValueChange,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  showTooltip?: boolean
}) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  const [currentValues, setCurrentValues] = React.useState<number[]>(_values)
  const [isDragging, setIsDragging] = React.useState(false)
  const [openTooltips, setOpenTooltips] = React.useState<boolean[]>(
    Array.from({ length: _values.length }, () => false)
  )
  const timeoutRefs = React.useRef<NodeJS.Timeout[]>([])

  // For controlled components, use value prop directly
  // For uncontrolled, track the current value
  const displayValues = value !== undefined 
    ? (Array.isArray(value) ? value : [value])
    : currentValues

  React.useEffect(() => {
    if (value !== undefined) {
      setCurrentValues(Array.isArray(value) ? value : [value])
    } else if (defaultValue !== undefined) {
      setCurrentValues(Array.isArray(defaultValue) ? defaultValue : [defaultValue])
    }
  }, [value, defaultValue])

  React.useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout))
    }
  }, [])

  const handleValueChange = React.useCallback((newValues: number[]) => {
    if (showTooltip && value === undefined) {
      // Only track for uncontrolled components
      setCurrentValues(newValues)
    }
    
    // Keep tooltips open during value changes (dragging)
    if (showTooltip && isDragging) {
      setOpenTooltips((prev) => {
        const newState = new Array(newValues.length).fill(true)
        return newState
      })
    }
    
    if (onValueChange) {
      onValueChange(newValues)
    }
  }, [showTooltip, value, onValueChange, isDragging])

  const handlePointerDown = React.useCallback((index: number) => {
    if (showTooltip) {
      setIsDragging(true)
      setOpenTooltips((prev) => {
        const newState = [...prev]
        newState[index] = true
        return newState
      })
    }
  }, [showTooltip])

  const handlePointerUp = React.useCallback(() => {
    if (showTooltip) {
      setIsDragging(false)
      // Keep tooltips open briefly after drag ends, then close
      const timeout = setTimeout(() => {
        setOpenTooltips((prev) => prev.map(() => false))
      }, 200)
      timeoutRefs.current.push(timeout)
    }
  }, [showTooltip])

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      onValueChange={handleValueChange}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => {
        const thumb = (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            onPointerDown={() => handlePointerDown(index)}
            onPointerUp={handlePointerUp}
            className="border-primary ring-ring/50 block size-4 shrink-0 rounded-full border bg-white shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
          />
        )

        if (showTooltip) {
          return (
            <Tooltip 
              key={index}
              open={isDragging ? openTooltips[index] : undefined}
              delayDuration={0}
            >
              <TooltipTrigger asChild>
                {thumb}
              </TooltipTrigger>
              <TooltipContent>
                {displayValues[index] ?? _values[index]}
              </TooltipContent>
            </Tooltip>
          )
        }

        return thumb
      })}
    </SliderPrimitive.Root>
  )
}

export { Slider }
