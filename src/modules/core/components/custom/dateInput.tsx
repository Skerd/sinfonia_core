import * as React from "react"
import { format, isValid, parse } from "date-fns"

import { cn } from "@coreModule/components/lib/utils.ts"
import { Calendar } from "@coreModule/components/ui/calendar.tsx"
import { Input } from "@coreModule/components/ui/input.tsx"
import { Popover, PopoverContent, PopoverTrigger } from "@coreModule/components/ui/popover.tsx"
import useSelectedLanguage, {
  type LanguageDictionary,
} from "@coreModule/helpers/hooks/useSelectedLanguage.ts"
import { Calendar as CalendarIcon, X } from "lucide-react"
import {IconClock} from "@tabler/icons-react";

const LANGUAGE_PATH = "src/modules/core/components/custom/dateInput.tsx"
const DEFAULT_PLACEHOLDER = "Pick a date"

const CALENDAR_SURFACE_CLASS =
  "bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)]"

const TIME_CELL_CLASS = cn(
  "flex h-(--cell-size) w-full snap-center items-center justify-center rounded-(--cell-radius) px-2.5 text-sm font-normal tabular-nums transition-colors select-none",
  "hover:bg-muted hover:text-foreground",
  "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
  "disabled:pointer-events-none disabled:opacity-50",
)

function stripQuotedLiterals(format: string): string {
  return format.replace(/'[^']*'/g, "")
}

/** True when `valueFormat` includes hour/minute (and optionally second) tokens. */
export function formatIncludesTime(valueFormat: string): boolean {
  const f = stripQuotedLiterals(valueFormat)
  return (
    /(^|[^yMd])H{1,2}/.test(f) ||
    /(^|[^yMd])h{1,2}/.test(f) ||
    /K{1,2}|k{1,2}/.test(f) ||
    (f.includes("mm") && /[:T\s]/.test(f))
  )
}

/** True when `valueFormat` includes a seconds token (`ss`). */
export function formatIncludesSeconds(valueFormat: string): boolean {
  return /ss/.test(stripQuotedLiterals(valueFormat))
}

function mergeCalendarDateWithTime(
  selectedDay: Date,
  existing: Date | undefined,
  withSeconds: boolean,
): Date {
  const merged = new Date(selectedDay)
  if (existing && isValid(existing)) {
    merged.setHours(
      existing.getHours(),
      existing.getMinutes(),
      withSeconds ? existing.getSeconds() : 0,
      0,
    )
  } else {
    merged.setHours(0, 0, 0, 0)
  }
  return merged
}

function applyTimeParts(
  base: Date,
  hour: number,
  minute: number,
  second: number,
): Date {
  const d = new Date(base)
  d.setHours(hour, minute, second, 0)
  return d
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES_SECONDS = Array.from({ length: 60 }, (_, i) => i)

type TimeScrollColumnProps = {
  label: string
  values: readonly number[]
  selected: number
  disabled?: boolean
  onSelect: (value: number) => void
}

function TimeScrollColumn({
  label,
  values,
  selected,
  disabled,
  onSelect,
}: TimeScrollColumnProps) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const selectedRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const list = listRef.current
    const selectedEl = selectedRef.current
    if (!list || !selectedEl) return
    // Keep scroll vertical-only — scrollIntoView can nudge parent containers sideways.
    const top =
      selectedEl.offsetTop - list.clientHeight / 2 + selectedEl.clientHeight / 2
    list.scrollTo({ top: Math.max(0, top), behavior: "instant" })
  }, [selected])

  return (
    <div className="flex w-11 shrink-0 flex-col overflow-hidden">
      <div className="flex h-(--cell-size) items-center justify-center px-1 text-[0.8rem] font-normal text-muted-foreground select-none">
        {label}
      </div>
      <div
        ref={listRef}
        className="h-[calc(var(--cell-size)*7.5)] overflow-x-hidden overflow-y-auto overscroll-y-contain scroll-smooth px-0.5 snap-y snap-mandatory [scrollbar-gutter:stable]"
        role="listbox"
        aria-label={label}
      >
        {values.map((v) => {
          const isSelected = v === selected
          return (
            <button
              key={v}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              role="option"
              aria-selected={isSelected}
              disabled={disabled}
              data-selected={isSelected}
              onClick={() => onSelect(v)}
              className={TIME_CELL_CLASS}
            >
              {String(v).padStart(2, "0")}
            </button>
          )
        })}
      </div>
    </div>
  )
}

type DateInputTimePanelProps = {
  dateValue: Date | undefined
  withSeconds: boolean
  disabled?: boolean
  hourLabel: string
  minuteLabel: string
  secondLabel: string
  onTimeChange: (hour: number, minute: number, second: number) => void
  /** When true, omit the left border (used for time-only popovers). */
  standalone?: boolean
}

function DateInputTimePanel({
  dateValue,
  withSeconds,
  disabled,
  hourLabel,
  minuteLabel,
  secondLabel,
  onTimeChange,
  standalone = false,
}: DateInputTimePanelProps) {
  const hour = dateValue && isValid(dateValue) ? dateValue.getHours() : 0
  const minute = dateValue && isValid(dateValue) ? dateValue.getMinutes() : 0
  const second = dateValue && isValid(dateValue) ? dateValue.getSeconds() : 0

  return (
    <div
      className={cn(
        "flex flex-col px-2 gap-y-1.5",
        !standalone && "border-l border-border",
      )}
    >
        <p className="flex items-center justify-center py-1">
            <IconClock />
        </p>
        <div className="flex shrink-0 gap-2 overflow-hidden">
            <TimeScrollColumn
                label={hourLabel}
                values={HOURS}
                selected={hour}
                disabled={disabled}
                onSelect={(h) => onTimeChange(h, minute, second)}
            />
            <TimeScrollColumn
                label={minuteLabel}
                values={MINUTES_SECONDS}
                selected={minute}
                disabled={disabled}
                onSelect={(m) => onTimeChange(hour, m, second)}
            />
            {withSeconds && (
                <TimeScrollColumn
                    label={secondLabel}
                    values={MINUTES_SECONDS}
                    selected={second}
                    disabled={disabled}
                    onSelect={(s) => onTimeChange(hour, minute, s)}
                />
            )}
        </div>
    </div>
  )
}

function parseMonthNames(
  lang: LanguageDictionary | null,
): readonly string[] | undefined {
  const months = lang?.months
  if (
    Array.isArray(months) &&
    months.length === 12 &&
    months.every((x): x is string => typeof x === "string")
  ) {
    return months
  }
  return undefined
}

/** Sunday = 0 … Saturday = 6 (`Date#getDay()`). */
function parseWeekdayNames(
  lang: LanguageDictionary | null,
): readonly string[] | undefined {
  const days = lang?.weekdays
  if (
    Array.isArray(days) &&
    days.length === 7 &&
    days.every((x): x is string => typeof x === "string")
  ) {
    return days
  }
  return undefined
}

function resolvePlaceholder(
  lang: LanguageDictionary | null,
  explicit?: string,
  timeOnly?: boolean,
): string {
  if (explicit != null && explicit !== "") return explicit
  if (timeOnly) {
    const t = lang?.timePlaceholder
    if (typeof t === "string") return t
  }
  const p = lang?.placeholder
  return typeof p === "string" ? p : DEFAULT_PLACEHOLDER
}

type DateInputBase = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "readOnly"
> & {
  /** date-fns pattern for the visible text (defaults to `valueFormat` when it includes time, else `PPP`). */
  displayFormat?: string
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    "mode" | "selected" | "onSelect" | "monthNames" | "weekdayNames"
  >
  /**
   * Time-only picker (no calendar). Requires a string `valueFormat` with hour/minute
   * tokens (e.g. `"HH:mm"`). Reuses the same scroll time panel as datetime mode.
   */
  timeOnly?: boolean
}

/** `Date` values (default). */
export type DateInputProps =
  | (DateInputBase & {
      valueFormat?: undefined
      timeOnly?: false
      value?: Date
      onChange?: (date: Date | undefined) => void
    })
  /** String values for forms, e.g. `valueFormat="yyyy-MM-dd"` or `yyyy-MM-dd'T'HH:mm:ss`. */
  | (DateInputBase & {
      valueFormat: string
      value?: string
      onChange?: (value: string) => void
    })

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  function DateInput(props, ref) {
    const {
      className,
      placeholder,
      displayFormat: displayFormatProp,
      disabled,
      calendarProps,
      valueFormat,
      value,
      onChange,
      timeOnly = false,
      ...inputProps
    } = props

    const resolvedValueFormat =
      valueFormat ?? (timeOnly ? "HH:mm" : undefined)
    const hasTime =
      timeOnly ||
      (resolvedValueFormat ? formatIncludesTime(resolvedValueFormat) : false)
    const withSeconds = resolvedValueFormat
      ? formatIncludesSeconds(resolvedValueFormat)
      : false
    const displayFormat =
      displayFormatProp ??
      (resolvedValueFormat && hasTime
        ? resolvedValueFormat
        : timeOnly
          ? "HH:mm"
          : "PPP")

    const [open, setOpen] = React.useState(false)
    const { currentLanguage } = useSelectedLanguage<LanguageDictionary>(
      LANGUAGE_PATH.replace(/\//g, "_").replace(/\.(tsx|ts)$/, ""),
      LANGUAGE_PATH,
    )

    const monthNames = parseMonthNames(currentLanguage)
    const weekdayNames = parseWeekdayNames(currentLanguage)
    const resolvedPlaceholder = resolvePlaceholder(
      currentLanguage,
      placeholder,
      timeOnly,
    )
    const hourLabel = typeof currentLanguage?.hourLabel === "string" ? currentLanguage.hourLabel : "Hr"
    const minuteLabel = typeof currentLanguage?.minuteLabel === "string" ? currentLanguage.minuteLabel : "Min"
    const secondLabel = typeof currentLanguage?.secondLabel === "string" ? currentLanguage.secondLabel : "Sec"

    const dateValue = React.useMemo(() => {
      if (resolvedValueFormat) {
        const s = typeof value === "string" ? value : ""
        if (!s) return undefined
        let d = parse(s, resolvedValueFormat, new Date())
        // Native <input type="time"> often yields HH:mm:ss — accept that in time-only mode.
        if (!isValid(d) && timeOnly && /^\d{1,2}:\d{2}/.test(s)) {
          d = parse(s.slice(0, 5), "HH:mm", new Date())
        }
        return isValid(d) ? d : undefined
      }
      const d = value as Date | undefined
      return d && isValid(d) ? d : undefined
    }, [value, resolvedValueFormat, timeOnly])

    const emitStringValue = React.useCallback(
      (d: Date | undefined) => {
        if (!resolvedValueFormat) return
        const out = d && isValid(d) ? format(d, resolvedValueFormat) : ""
        ;(onChange as ((v: string) => void) | undefined)?.(out)
      },
      [onChange, resolvedValueFormat],
    )

    const handleTimePartChange = React.useCallback(
      (hour: number, minute: number, second: number) => {
        const base =
          dateValue && isValid(dateValue) ? new Date(dateValue) : new Date()
        emitStringValue(
          applyTimeParts(base, hour, minute, withSeconds ? second : 0),
        )
      },
      [dateValue, emitStringValue, withSeconds],
    )

    const displayValue =
      dateValue && isValid(dateValue)
        ? format(dateValue, displayFormat)
        : ""

    const hasValue = displayValue.length > 0
    const canClear = hasValue && !disabled
    const clearLabel =
      typeof currentLanguage?.clear === "string"
        ? currentLanguage.clear
        : "Clear"

    const clearValue = React.useCallback(() => {
      if (disabled) return
      if (resolvedValueFormat) {
        emitStringValue(undefined)
      } else {
        ;(onChange as ((d: Date | undefined) => void) | undefined)?.(undefined)
      }
    }, [disabled, resolvedValueFormat, emitStringValue, onChange])

    const handleClear = React.useCallback(
      (event: React.MouseEvent | React.PointerEvent) => {
        event.preventDefault()
        event.stopPropagation()
        clearValue()
      },
      [clearValue],
    )

    const EndIcon = timeOnly ? IconClock : CalendarIcon

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <div className={cn("relative w-full", className)}>
          <PopoverTrigger asChild>
            <Input
              ref={ref}
              type="text"
              readOnly
              disabled={disabled}
              value={displayValue}
              placeholder={resolvedPlaceholder}
              className={cn(
                "h-8 cursor-pointer placeholder:text-sm",
                canClear ? "pr-14" : "pr-10",
              )}
              aria-haspopup="dialog"
              {...inputProps}
            />
          </PopoverTrigger>
          <div
            className="pointer-events-none absolute inset-y-0 end-2 flex shrink-0 items-center gap-1"
          >
            {canClear ? (
              <span
                role="button"
                tabIndex={-1}
                aria-label={clearLabel}
                className="pointer-events-auto rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                onPointerDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                onClick={handleClear}
              >
                <X className="h-4 w-4 hover:cursor-pointer" />
              </span>
            ) : null}
            <EndIcon
              className="h-4 w-4 shrink-0 text-muted-foreground/50 opacity-100 me-1"
              aria-hidden
            />
          </div>
        </div>
        <PopoverContent className="w-auto p-0" align="start">
          <div
            className={cn(
              "flex w-fit",
              CALENDAR_SURFACE_CLASS,
              hasTime && !timeOnly && "pr-0",
            )}
          >
            {!timeOnly && (
              <Calendar
                {...calendarProps}
                className={cn(
                  "bg-transparent p-0 in-data-[slot=popover-content]:bg-transparent",
                  calendarProps?.className,
                )}
                mode="single"
                selected={dateValue}
                monthNames={monthNames}
                weekdayNames={weekdayNames}
                captionLayout={calendarProps?.captionLayout ?? "dropdown"}
                onSelect={(d) => {
                  if (resolvedValueFormat) {
                    if (!d || !isValid(d)) {
                      emitStringValue(undefined)
                      if (!hasTime) setOpen(false)
                      return
                    }
                    const merged = hasTime
                      ? mergeCalendarDateWithTime(d, dateValue, withSeconds)
                      : d
                    emitStringValue(merged)
                    if (!hasTime) setOpen(false)
                  } else {
                    ;(onChange as ((d: Date | undefined) => void) | undefined)?.(
                      d,
                    )
                    setOpen(false)
                  }
                }}
              />
            )}
            {hasTime && resolvedValueFormat && (
              <DateInputTimePanel
                dateValue={dateValue}
                withSeconds={withSeconds}
                disabled={disabled}
                hourLabel={hourLabel}
                minuteLabel={minuteLabel}
                secondLabel={secondLabel}
                onTimeChange={handleTimePartChange}
                standalone={timeOnly}
              />
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  },
)

DateInput.displayName = "DateInput"
