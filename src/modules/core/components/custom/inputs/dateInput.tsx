import * as React from "react"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"

import { cn } from "@coreModule/components/lib/utils.ts"
import {
  calendarDayUtc,
  DATE_FORMATS,
  formatDate,
  fromZonedWallClock,
  toZonedWallClockDate,
} from "@coreModule/helpers/general/dateTime.ts"
import { Calendar } from "@coreModule/components/ui/calendar.tsx"
import { Input } from "@coreModule/components/ui/input.tsx"
import { useDrawerPortalContainer } from "@coreModule/components/ui/drawer.tsx"
import { Popover, PopoverContent, PopoverTrigger } from "@coreModule/components/ui/popover.tsx"
import useSelectedLanguage, {
  type LanguageDictionary,
} from "@coreModule/helpers/hooks/useSelectedLanguage.ts"
import { IconCalendar, IconClock, IconX } from "@tabler/icons-react"
import {Button} from "@coreModule/components/ui/button.tsx";

dayjs.extend(customParseFormat)

const LANGUAGE_PATH = "src/modules/core/components/custom/inputs/dateInput.tsx"
const DEFAULT_PLACEHOLDER = "Pick a date"

const CALENDAR_SURFACE_CLASS =
  "bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)]"

const TIME_CELL_CLASS = cn(
  "flex h-(--cell-size) w-full snap-center items-center justify-center rounded-(--cell-radius) px-2.5 text-sm font-normal tabular-nums transition-colors select-none",
  "hover:bg-muted hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
  "disabled:pointer-events-none disabled:opacity-50",
)

/** dayjs escapes literal text in brackets: `YYYY-MM-DD[T]HH:mm`. */
function stripQuotedLiterals(pattern: string): string {
  return pattern.replace(/\[[^\]]*\]/g, "")
}

function isValid(date: Date): boolean {
  return !Number.isNaN(date.getTime())
}

/** True when `valueFormat` includes hour/minute (and optionally second) tokens. */
export function formatIncludesTime(valueFormat: string): boolean {
  const f = stripQuotedLiterals(valueFormat)
  return (
    /(^|[^YMD])H{1,2}/.test(f) ||
    /(^|[^YMD])h{1,2}/.test(f) ||
    /K{1,2}|k{1,2}/.test(f) ||
    (f.includes("mm") && /[:T\s]/.test(f))
  )
}

/** True when `valueFormat` includes a seconds token (`ss`). */
export function formatIncludesSeconds(valueFormat: string): boolean {
  return /ss/.test(stripQuotedLiterals(valueFormat))
}

/** dayjs pattern (`YYYY-MM-DD`, `DD.MM.YYYY`, `HH:mm`); patterns come from view-engine JSON too. */
function safeFormat(date: Date, pattern: string): string {
  const value = dayjs(date)
  return value.isValid() ? value.format(pattern) : ""
}

/** Strict: the value must match the whole pattern. */
function safeParse(value: string, pattern: string): Date | undefined {
  const parsed = dayjs(value, pattern, true)
  return parsed.isValid() ? parsed.toDate() : undefined
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
/** `HOURS` plus 24, the end-of-day hour offered by `allowEndOfDay`. */
const HOURS_WITH_END_OF_DAY = [...HOURS, 24]
const END_OF_DAY_HOUR = 24
const MINUTES_SECONDS = Array.from({ length: 60 }, (_, i) => i)
/** At 24 the clock stops: only :00 (and :00 seconds) exist. */
const ZERO_ONLY = [0]
/** Rows travelled by PageUp/PageDown in a time column. */
const TIME_PAGE_STEP = 5

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
  /** Set by the keyboard handler so focus follows the selection it just moved. */
  const refocusRef = React.useRef(false)

  React.useLayoutEffect(() => {
    const list = listRef.current
    const selectedEl = selectedRef.current
    if (!list || !selectedEl) return

    if (refocusRef.current) {
      refocusRef.current = false
      selectedEl.focus({ preventScroll: true })
    }

    // Already in view (the common case right after a click): scrolling now would only yank the
    // list out from under the pointer. Otherwise centre it — `scrollIntoView` is avoided because
    // it can nudge parent containers sideways.
    const top = selectedEl.offsetTop
    const bottom = top + selectedEl.offsetHeight
    if (top >= list.scrollTop && bottom <= list.scrollTop + list.clientHeight) return
    list.scrollTop = Math.max(0, top - list.clientHeight / 2 + selectedEl.offsetHeight / 2)
  }, [selected])

  const moveSelection = (delta: number) => {
    const current = Math.max(0, values.indexOf(selected))
    const next = values[Math.min(values.length - 1, Math.max(0, current + delta))]
    if (next === selected) return
    refocusRef.current = true
    onSelect(next)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const step: Record<string, number | undefined> = {
      ArrowDown: 1,
      ArrowUp: -1,
      PageDown: TIME_PAGE_STEP,
      PageUp: -TIME_PAGE_STEP,
      Home: -values.length,
      End: values.length,
    }
    const delta = step[event.key]
    if (delta === undefined) return
    event.preventDefault()
    // Home/End still have to cross the list from wherever the selection currently sits.
    moveSelection(delta)
  }

  return (
    <div className="flex w-11 shrink-0 flex-col overflow-hidden">
      <div className="flex h-(--cell-size) items-center justify-center px-1 text-[0.8rem] font-normal text-muted-foreground select-none">
        {label}
      </div>
      <div
        ref={listRef}
        className="h-[calc(var(--cell-size)*7.5)] overflow-x-hidden overflow-y-auto overscroll-y-contain scroll-smooth px-0.5 snap-y snap-mandatory [scrollbar-gutter:stable]"
        role="listbox"
        tabIndex={-1}
        aria-label={label}
        onKeyDown={handleKeyDown}
      >
        {values.map((v) => {
          const isSelected = v === selected
          return (
            <Button variant="bare"
              key={v}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              role="option"
              aria-selected={isSelected}
              // Roving tabindex: one stop per column instead of 60.
              tabIndex={isSelected ? 0 : -1}
              disabled={disabled}
              data-selected={isSelected}
              onClick={() => onSelect(v)}
              className={TIME_CELL_CLASS}
            >
              {String(v).padStart(2, "0")}
            </Button>
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
  /** Offer hour 24 after 23 (see `DateInput` `allowEndOfDay`). */
  allowEndOfDay?: boolean
  /** The current value is the end of the day (`24:00`), which a `Date` cannot hold. */
  endOfDay?: boolean
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
  allowEndOfDay = false,
  endOfDay = false,
}: DateInputTimePanelProps) {
  const time = dateValue && isValid(dateValue) ? dateValue : undefined
  const hour = endOfDay ? END_OF_DAY_HOUR : (time?.getHours() ?? 0)
  const minute = endOfDay ? 0 : (time?.getMinutes() ?? 0)
  const second = endOfDay ? 0 : (time?.getSeconds() ?? 0)
  const subHourValues = endOfDay ? ZERO_ONLY : MINUTES_SECONDS

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
          values={allowEndOfDay ? HOURS_WITH_END_OF_DAY : HOURS}
          selected={hour}
          disabled={disabled}
          onSelect={(h) => onTimeChange(h, minute, second)}
        />
        <TimeScrollColumn
          label={minuteLabel}
          values={subHourValues}
          selected={minute}
          disabled={disabled}
          onSelect={(m) => onTimeChange(hour, m, second)}
        />
        {withSeconds && (
          <TimeScrollColumn
            label={secondLabel}
            values={subHourValues}
            selected={second}
            disabled={disabled}
            onSelect={(s) => onTimeChange(hour, minute, s)}
          />
        )}
      </div>
    </div>
  )
}

/** A dictionary entry when it is a non-empty string, else `undefined`. */
function dictText(
  lang: LanguageDictionary | null,
  key: string,
): string | undefined {
  const value = lang?.[key]
  return typeof value === "string" && value !== "" ? value : undefined
}

/** A dictionary entry when it is a string list of exactly `length` entries. */
function dictStringList(
  lang: LanguageDictionary | null,
  key: string,
  length: number,
): readonly string[] | undefined {
  const value = lang?.[key]
  if (
    Array.isArray(value) &&
    value.length === length &&
    value.every((x): x is string => typeof x === "string")
  ) {
    return value
  }
  return undefined
}

function resolvePlaceholder(
  lang: LanguageDictionary | null,
  explicit?: string,
  timeOnly?: boolean,
): string {
  if (explicit != null && explicit !== "") return explicit
  const fromDictionary =
    (timeOnly ? dictText(lang, "timePlaceholder") : undefined) ??
    dictText(lang, "placeholder")
  return fromDictionary ?? DEFAULT_PLACEHOLDER
}

/** Local calendar day from `YYYY-MM-DD` (avoids UTC-shift from `Date` parsing). */
function parseIsoDayLocal(iso?: string): Date | undefined {
  const s = iso?.trim() ?? ""
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined
  const [y, m, d] = s.split("-").map((x) => Number.parseInt(x, 10))
  const dt = new Date(y, m - 1, d)
  return isValid(dt) ? dt : undefined
}

function localDateFromYmd(ymd: string): Date | undefined {
  const [y, m, d] = ymd.split("-").map((x) => Number.parseInt(x, 10))
  if ([y, m, d].some((n) => Number.isNaN(n))) return undefined
  const dt = new Date(y, m - 1, d)
  return isValid(dt) ? dt : undefined
}

/** True when the string encodes an instant (`Z` or numeric offset), not a naive local datetime. */
function hasExplicitOffset(value: string): boolean {
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value.trim())
}

function wallClockFromInstant(instant: Date, timeZone: string | undefined): Date | undefined {
  const wall = toZonedWallClockDate(instant, timeZone)
  return wall && isValid(wall) ? wall : undefined
}

function instantFromWallClock(wall: Date, timeZone: string | undefined): Date {
  return (
    fromZonedWallClock(
      timeZone,
      wall.getFullYear(),
      wall.getMonth() + 1,
      wall.getDate(),
      wall.getHours(),
      wall.getMinutes(),
      wall.getSeconds(),
    ) ?? wall
  )
}

/** First day of `date`'s month — the granularity react-day-picker navigation bounds use. */
function startOfMonthDay(date: Date | undefined): Date | undefined {
  return date ? new Date(date.getFullYear(), date.getMonth(), 1) : undefined
}

type DateInputBase = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "readOnly"
> & {
  /** dayjs pattern for the visible text (defaults to `valueFormat` when it includes time, else the localized long date). */
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
  /**
   * Time-only mode: offer `24:00` (`24:00:00` with seconds) after `23:59` as the end of the day,
   * for the end of a window that runs until midnight (core `WeeklyHoursSlotDef` `endTime`). The
   * value round-trips as that string, never as `00:00`. Leave it off for start times. Ignored
   * outside `timeOnly`. ViewConfig: `widgetProps.allowEndOfDay: true` on a time-only `#DateInput`.
   */
  allowEndOfDay?: boolean
  /**
   * IANA timezone for datetime (not date-only) values. Wall-clock pick/display use this
   * zone; the stored value is an ISO instant. Falls back to the runtime timezone.
   */
  timeZone?: string
  /** Inclusive `YYYY-MM-DD` lower bound for the calendar (unless `minDateExclusive`). */
  minDate?: string
  /** Inclusive `YYYY-MM-DD` upper bound for the calendar (unless `maxDateExclusive`). */
  maxDate?: string
  minDateExclusive?: boolean
  maxDateExclusive?: boolean
  /**
   * Show the clear (×) button once a value is set (default `true`). Turn it off where a value is always
   * required and an empty one is ignored (a day picker that must show some day), so no control does nothing.
   */
  clearable?: boolean
}

/** `Date` values (default). */
export type DateInputProps =
  | (DateInputBase & {
      valueFormat?: undefined
      timeOnly?: false
      value?: Date
      onChange?: (date: Date | undefined) => void
    })
  /** String values for forms, e.g. `valueFormat="YYYY-MM-DD"` or `YYYY-MM-DD[T]HH:mm:ss` (dayjs tokens). */
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
      allowEndOfDay: allowEndOfDayProp = false,
      minDate,
      maxDate,
      minDateExclusive = false,
      maxDateExclusive = false,
      timeZone,
      clearable = true,
      // View-engine field links — consumed by FormBoundDateInput; strip so they never hit the DOM.
      minDateField: _minDateField,
      maxDateField: _maxDateField,
      ...inputProps
    } = props as typeof props & { minDateField?: string; maxDateField?: string }

    const resolvedValueFormat = valueFormat ?? (timeOnly ? "HH:mm" : undefined)
    // A caller on `Date` values has no `valueFormat`, so the display pattern is the only place
    // left that can ask for a time panel.
    const timeFormat = resolvedValueFormat ?? displayFormatProp ?? ""
    const hasTime = timeOnly || formatIncludesTime(timeFormat)
    const withSeconds = formatIncludesSeconds(timeFormat)
    const allowEndOfDay = timeOnly && allowEndOfDayProp
    const endOfDayValue = withSeconds ? "24:00:00" : "24:00"
    const isEndOfDay =
      allowEndOfDay && typeof value === "string" && value.trim() === endOfDayValue
    // No pattern: a plain date shows as the localized long date.
    const displayFormat: string | undefined =
      displayFormatProp ??
      (resolvedValueFormat && hasTime
        ? resolvedValueFormat
        : timeOnly
          ? "HH:mm"
          : undefined)

    const [open, setOpen] = React.useState(false)
    const drawerPortalContainer = useDrawerPortalContainer()
    const { currentLanguage } = useSelectedLanguage<LanguageDictionary>(LANGUAGE_PATH)

    const monthNames = dictStringList(currentLanguage, "months", 12)
    /** Sunday = 0 … Saturday = 6 (`Date#getDay()`). */
    const weekdayNames = dictStringList(currentLanguage, "weekdays", 7)
    const resolvedPlaceholder = resolvePlaceholder(
      currentLanguage,
      placeholder,
      timeOnly,
    )
    const hourLabel = dictText(currentLanguage, "hourLabel") ?? "Hr"
    const minuteLabel = dictText(currentLanguage, "minuteLabel") ?? "Min"
    const secondLabel = dictText(currentLanguage, "secondLabel") ?? "Sec"
    const clearLabel = dictText(currentLanguage, "clear") ?? "Clear"

    const dateValue = React.useMemo(() => {
      if (isEndOfDay) return undefined
      if (value instanceof Date) return isValid(value) ? value : undefined
      if (!resolvedValueFormat) return undefined
      const s = typeof value === "string" ? value.trim() : ""
      if (!s) return undefined

      if (!timeOnly && !hasTime) {
        const ymd = calendarDayUtc(s)
        return ymd ? localDateFromYmd(ymd) : undefined
      }

      if (!timeOnly && hasTime && hasExplicitOffset(s)) {
        const instant = new Date(s)
        if (!isValid(instant)) return undefined
        return wallClockFromInstant(instant, timeZone) ?? instant
      }

      const exact = safeParse(s, resolvedValueFormat)
      if (exact) {
        if (timeOnly || !hasTime) return exact
        const instant = instantFromWallClock(exact, timeZone)
        return wallClockFromInstant(instant, timeZone) ?? exact
      }
      // Native <input type="time"> often yields HH:mm:ss — accept that in time-only mode.
      if (timeOnly && /^\d{1,2}:\d{2}/.test(s)) {
        const time = safeParse(s.slice(0, 5), "HH:mm")
        if (time) return time
      }
      const iso = dayjs(s).toDate()
      if (!isValid(iso)) return undefined
      if (!timeOnly && hasTime) return wallClockFromInstant(iso, timeZone) ?? iso
      return iso
    }, [isEndOfDay, value, resolvedValueFormat, timeOnly, hasTime, timeZone])

    /** Emits in whichever shape this instance was configured for: formatted string, ISO instant, or `Date`. */
    const emitValue = React.useCallback(
      (d: Date | undefined) => {
        const next = d && isValid(d) ? d : undefined
        if (resolvedValueFormat) {
          ;(onChange as ((v: string) => void) | undefined)?.(
            next
              ? !timeOnly && hasTime
                ? instantFromWallClock(next, timeZone).toISOString()
                : safeFormat(next, resolvedValueFormat)
              : "",
          )
          return
        }
        ;(onChange as ((d: Date | undefined) => void) | undefined)?.(next)
      },
      [onChange, resolvedValueFormat, timeOnly, hasTime, timeZone],
    )

    const handleTimePartChange = React.useCallback(
      (hour: number, minute: number, second: number) => {
        if (allowEndOfDay && hour === END_OF_DAY_HOUR) {
          // Only string values reach here (time-only always has a `valueFormat`).
          ;(onChange as ((v: string) => void) | undefined)?.(endOfDayValue)
          return
        }
        const base =
          dateValue && isValid(dateValue) ? new Date(dateValue) : new Date()
        emitValue(applyTimeParts(base, hour, minute, withSeconds ? second : 0))
      },
      [allowEndOfDay, dateValue, emitValue, endOfDayValue, onChange, withSeconds],
    )

    const handleDaySelect = React.useCallback(
      (day: Date | undefined) => {
        if (!day || !isValid(day)) {
          emitValue(undefined)
        } else {
          emitValue(
            hasTime
              ? mergeCalendarDateWithTime(day, dateValue, withSeconds)
              : day,
          )
        }
        // Datetime pickers stay open so the time columns can still be used.
        if (!hasTime) setOpen(false)
      },
      [dateValue, emitValue, hasTime, withSeconds],
    )

    const handleClear = React.useCallback(
      (event: React.MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        if (disabled) return
        emitValue(undefined)
      },
      [disabled, emitValue],
    )

    const displayValue = isEndOfDay
      ? endOfDayValue
      : !dateValue || !isValid(dateValue)
      ? ""
      : displayFormat
        ? safeFormat(dateValue, displayFormat)
        : formatDate(dateValue, { format: DATE_FORMATS.longDate })
    const canClear = clearable && displayValue.length > 0

    const rangeCalendarProps = React.useMemo(() => {
      const minBound = parseIsoDayLocal(minDate)
      const maxBound = parseIsoDayLocal(maxDate)
      const lowerNav = minBound && minDateExclusive ? dayjs(minBound).add(1, "day").toDate() : minBound
      const upperNav = maxBound && maxDateExclusive ? dayjs(maxBound).subtract(1, "day").toDate() : maxBound
      const matchers: Array<{ before: Date } | { after: Date }> = []
      if (lowerNav) matchers.push({ before: lowerNav })
      if (upperNav) matchers.push({ after: upperNav })
      return {
        disabled: matchers.length > 0 ? matchers : undefined,
        startMonth: startOfMonthDay(lowerNav),
        endMonth: startOfMonthDay(upperNav),
      }
    }, [minDate, maxDate, minDateExclusive, maxDateExclusive])

    /** The caller's own matchers keep applying on top of the min/max bounds. */
    const calendarDisabled = React.useMemo(() => {
      const own = calendarProps?.disabled
      if (own == null) return rangeCalendarProps.disabled
      return [rangeCalendarProps.disabled, own]
        .flat()
        .filter((matcher): matcher is NonNullable<typeof matcher> => matcher != null)
    }, [calendarProps?.disabled, rangeCalendarProps.disabled])

    const EndIcon = timeOnly ? IconClock : IconCalendar

    return (
      <Popover modal open={open} onOpenChange={setOpen}>
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
          <div className="pointer-events-none absolute inset-y-0 end-2 flex shrink-0 items-center gap-1">
            {canClear ? (
              <Button variant="bare"
                type="button"
                aria-label={clearLabel}
                title={clearLabel}
                disabled={disabled}
                className={cn(
                  "rounded-sm p-0.5 text-muted-foreground",
                  disabled
                    ? "cursor-not-allowed opacity-50 disabled:pointer-events-auto"
                    : "pointer-events-auto cursor-pointer hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                )}
                // The trigger sits underneath; clearing must not also open the calendar.
                onPointerDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                onClick={handleClear}
              >
                <IconX className="h-4 w-4" />
              </Button>
            ) : null}
            <EndIcon
              className="h-4 w-4 shrink-0 text-muted-foreground/50 me-1"
              aria-hidden
            />
          </div>
        </div>
        <PopoverContent
          className="w-auto overflow-visible p-0"
          align="start"
          container={drawerPortalContainer?.current ?? undefined}
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
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
                // `selected` alone does not drive the visible month, so a stored date far from
                // today used to open on today's page with nothing selected in sight. The popover
                // unmounts on close, so this re-homes the calendar on every open.
                defaultMonth={calendarProps?.defaultMonth ?? dateValue}
                disabled={calendarDisabled}
                startMonth={calendarProps?.startMonth ?? rangeCalendarProps.startMonth}
                endMonth={calendarProps?.endMonth ?? rangeCalendarProps.endMonth}
                onSelect={handleDaySelect}
              />
            )}
            {hasTime && (
              <DateInputTimePanel
                dateValue={dateValue}
                withSeconds={withSeconds}
                disabled={disabled}
                hourLabel={hourLabel}
                minuteLabel={minuteLabel}
                secondLabel={secondLabel}
                onTimeChange={handleTimePartChange}
                standalone={timeOnly}
                allowEndOfDay={allowEndOfDay}
                endOfDay={isEndOfDay}
              />
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  },
)

DateInput.displayName = "DateInput"
