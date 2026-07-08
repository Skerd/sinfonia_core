import * as React from "react"
import { format, isValid, parse } from "date-fns"

import { cn } from "@coreModule/components/lib/utils.ts"
import { Calendar } from "@coreModule/components/ui/calendar.tsx"
import { Input } from "@coreModule/components/ui/input.tsx"
import { Popover, PopoverContent, PopoverTrigger } from "@coreModule/components/ui/popover.tsx"
import useSelectedLanguage, {
  type LanguageDictionary,
} from "@coreModule/helpers/hooks/useSelectedLanguage.ts"
import {IconClock} from "@tabler/icons-react";

const LANGUAGE_PATH = "src/modules/core/components/custom/dateInput.tsx"
const DEFAULT_PLACEHOLDER = "Pick a date"

const CALENDAR_SURFACE_CLASS =
  "bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)]"

const TIME_CELL_CLASS = cn(
  "flex h-(--cell-size) w-full min-w-(--cell-size) snap-center items-center justify-center rounded-(--cell-radius) text-sm font-normal transition-colors select-none",
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
  const selectedRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center", behavior: "instant" })
  }, [selected])

  return (
    <div className="flex min-w-(--cell-size) flex-col grow]:">
      <div className="flex h-(--cell-size) items-center justify-center text-[0.8rem] font-normal text-muted-foreground select-none">
        {label}
      </div>
      <div
        className="h-[calc(var(--cell-size)*7.5)] overflow-y-auto overscroll-contain scroll-smooth px-0.5 snap-y snap-mandatory"
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
}

function DateInputTimePanel({
  dateValue,
  withSeconds,
  disabled,
  hourLabel,
  minuteLabel,
  secondLabel,
  onTimeChange,
}: DateInputTimePanelProps) {
  const hour = dateValue && isValid(dateValue) ? dateValue.getHours() : 0
  const minute = dateValue && isValid(dateValue) ? dateValue.getMinutes() : 0
  const second = dateValue && isValid(dateValue) ? dateValue.getSeconds() : 0

  return (
    <div className="flex flex-col border-l border-border px-2 space-y-1.5">
        <p className="flex items-center justify-center py-1">
            <IconClock />
        </p>
        <div className="flex space-x-2 grow">
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
): string {
  if (explicit != null && explicit !== "") return explicit
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
}

/** `Date` values (default). */
export type DateInputProps =
  | (DateInputBase & {
      valueFormat?: undefined
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
      ...inputProps
    } = props

    const hasTime = valueFormat ? formatIncludesTime(valueFormat) : false
    const withSeconds = valueFormat ? formatIncludesSeconds(valueFormat) : false
    const displayFormat =
      displayFormatProp ?? (valueFormat && hasTime ? valueFormat : "PPP")

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
    )
    const hourLabel = typeof currentLanguage?.hourLabel === "string" ? currentLanguage.hourLabel : "Hr"
    const minuteLabel = typeof currentLanguage?.minuteLabel === "string" ? currentLanguage.minuteLabel : "Min"
    const secondLabel = typeof currentLanguage?.secondLabel === "string" ? currentLanguage.secondLabel : "Sec"

    const dateValue = React.useMemo(() => {
      if (valueFormat) {
        const s = typeof value === "string" ? value : ""
        if (!s) return undefined
        const d = parse(s, valueFormat, new Date())
        return isValid(d) ? d : undefined
      }
      const d = value as Date | undefined
      return d && isValid(d) ? d : undefined
    }, [value, valueFormat])

    const emitStringValue = React.useCallback(
      (d: Date | undefined) => {
        if (!valueFormat) return
        const out = d && isValid(d) ? format(d, valueFormat) : ""
        ;(onChange as ((v: string) => void) | undefined)?.(out)
      },
      [onChange, valueFormat],
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

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Input
            ref={ref}
            type="text"
            readOnly
            disabled={disabled}
            value={displayValue}
            placeholder={resolvedPlaceholder}
            className={cn("h-8 cursor-pointer placeholder:text-sm", className)}
            aria-haspopup="dialog"
            {...inputProps}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div
            className={cn(
              "flex w-fit",
              CALENDAR_SURFACE_CLASS,
              hasTime && "pr-0",
            )}
          >
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
                if (valueFormat) {
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
            {hasTime && valueFormat && (
              <DateInputTimePanel
                dateValue={dateValue}
                withSeconds={withSeconds}
                disabled={disabled}
                hourLabel={hourLabel}
                minuteLabel={minuteLabel}
                secondLabel={secondLabel}
                onTimeChange={handleTimePartChange}
              />
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  },
)

DateInput.displayName = "DateInput"
