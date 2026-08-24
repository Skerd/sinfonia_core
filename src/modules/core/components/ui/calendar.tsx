import * as React from "react"
import {
  DateLib,
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type DropdownProps,
  type Locale,
} from "react-day-picker"

import { cn } from "@coreModule/components/lib/utils.ts"
import { Button, buttonVariants } from "@coreModule/components/ui/button.tsx"
import { IconChevronLeft, IconChevronRight, IconChevronDown } from "@tabler/icons-react"

/** Year dropdown span when callers do not set explicit navigation bounds. */
export const CALENDAR_DROPDOWN_YEARS_BACK = 100
export const CALENDAR_DROPDOWN_YEARS_FORWARD = 100

function captionHasYearDropdown(
  captionLayout: React.ComponentProps<typeof DayPicker>["captionLayout"],
): boolean {
  return captionLayout === "dropdown" || captionLayout === "dropdown-years"
}

function resolveDropdownNavBounds(
  props: Pick<
    React.ComponentProps<typeof DayPicker>,
    "captionLayout" | "startMonth" | "endMonth" | "today"
  >,
): Pick<React.ComponentProps<typeof DayPicker>, "startMonth" | "endMonth"> {
  if (!captionHasYearDropdown(props.captionLayout)) {
    return {}
  }

  const anchor = props.today ?? new Date()
  const year = anchor.getFullYear()
  const bounds: Pick<React.ComponentProps<typeof DayPicker>, "startMonth" | "endMonth"> = {}

  if (props.startMonth == null) {
    bounds.startMonth = new Date(year - CALENDAR_DROPDOWN_YEARS_BACK, 0, 1)
  }
  if (props.endMonth == null) {
    bounds.endMonth = new Date(year + CALENDAR_DROPDOWN_YEARS_FORWARD, 11, 31)
  }

  return bounds
}

type CompactCaptionDropdownProps = DropdownProps & {
  scrollFallbackValue: number
  triggerWidthClass?: string
  listWidthClass?: string
}

function CompactCaptionDropdown({
  options,
  value,
  onChange,
  disabled,
  className,
  classNames,
  "aria-label": ariaLabel,
  scrollFallbackValue,
  triggerWidthClass = "w-[4.25rem]",
  listWidthClass = "w-[4.5rem]",
}: CompactCaptionDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLSpanElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const selected = options?.find((option) => option.value === value)

  React.useLayoutEffect(() => {
    if (!open || !listRef.current) return

    const scrollValue = options?.some((option) => option.value === value)
      ? (value as number)
      : scrollFallbackValue
    const optionEl = listRef.current.querySelector<HTMLButtonElement>(
      `[data-option-value="${scrollValue}"]`,
    )
    if (!optionEl) return

    const list = listRef.current
    const centeredTop =
      optionEl.offsetTop - list.clientHeight / 2 + optionEl.clientHeight / 2
    list.scrollTop = Math.max(0, centeredTop)
  }, [open, value, options, scrollFallbackValue])

  React.useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  // Dialog/sheet RemoveScroll captures wheel on document. Keep the event on this
  // list so a 200-year dropdown can scroll when the calendar is inside a modal.
  React.useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (!el) return
    const stop = (event: Event) => event.stopPropagation()
    el.addEventListener("wheel", stop, { capture: true })
    el.addEventListener("touchmove", stop, { capture: true })
    return () => {
      el.removeEventListener("wheel", stop, { capture: true })
      el.removeEventListener("touchmove", stop, { capture: true })
    }
  }, [open])

  return (
    <span
      ref={rootRef}
      className={cn(
        "relative",
        open && "z-50",
        classNames.dropdown_root,
      )}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          "flex h-7 items-center justify-between gap-0.5 rounded-md px-1.5 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
          triggerWidthClass,
          classNames.caption_label,
          className,
        )}
      >
        <span className="min-w-0 truncate">{selected?.label}</span>
        <IconChevronDown className="size-3 shrink-0 text-muted-foreground" />
      </button>
      {open ? (
        <div
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            "absolute top-[calc(100%+4px)] left-0 z-50 max-h-48 overflow-y-auto overscroll-contain rounded-md border border-border bg-popover p-1 shadow-md ring-1 ring-foreground/10",
            listWidthClass,
          )}
          onMouseDown={(event) => event.preventDefault()}
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
          {options?.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              data-option-value={option.value}
              aria-selected={option.value === value}
              disabled={option.disabled}
              className={cn(
                "w-full rounded px-2 py-1 text-left text-xs hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                option.value === value && "bg-accent text-accent-foreground",
              )}
              onClick={() => {
                onChange?.({
                  target: { value: String(option.value) },
                } as React.ChangeEvent<HTMLSelectElement>)
                setOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </span>
  )
}

function isMonthDropdownOptions(options: DropdownProps["options"]): boolean {
  return (
    options != null &&
    options.length > 0 &&
    options.length <= 12 &&
    options.every((option) => option.value >= 0 && option.value <= 11)
  )
}

function CompactDropdown(props: DropdownProps) {
  const isMonth = isMonthDropdownOptions(props.options)
  return (
    <CompactCaptionDropdown
      {...props}
      scrollFallbackValue={isMonth ? new Date().getMonth() : new Date().getFullYear()}
      triggerWidthClass={
        isMonth ? "w-[5.5rem] max-w-[5.5rem]" : "w-[4.25rem] tabular-nums"
      }
      listWidthClass={
        isMonth ? "w-[5.5rem] min-w-[5.5rem]" : "w-[4.5rem]"
      }
    />
  )
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  monthNames,
  weekdayNames,
  startMonth,
  endMonth,
  today,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  /** Twelve names, January–December, for captions and month dropdown when not using locale defaults. */
  monthNames?: readonly string[]
  /**
   * Seven labels for Sunday–Saturday (`Date#getDay()` order), for the weekday header row.
   * Column order still follows `locale` / `weekStartsOn`; only the labels are overridden.
   */
  weekdayNames?: readonly string[]
}) {
  const defaultClassNames = getDefaultClassNames()
  const dropdownNavBounds = resolveDropdownNavBounds({
    captionLayout,
    startMonth,
    endMonth,
    today,
  })

  const resolvedFormatters = React.useMemo(() => {
    const fromLanguage: Record<string, unknown> =
      monthNames?.length === 12
        ? {
            formatMonthDropdown: (month: Date, dateLib?: DateLib) => {
              const lib = dateLib ?? new DateLib()
              return monthNames[lib.getMonth(month)] ?? lib.format(month, "LLLL")
            },
            formatCaption: (
              month: Date,
              options?: ConstructorParameters<typeof DateLib>[0],
              dateLib?: DateLib
            ) => {
              const lib = dateLib ?? new DateLib(options)
              const label =
                monthNames[lib.getMonth(month)] ?? lib.format(month, "LLLL")
              return `${label} ${lib.getYear(month)}`
            },
          }
        : {
            formatMonthDropdown: (month: Date) =>
              month.toLocaleString(locale?.code, { month: "short" }),
          }

    if (weekdayNames?.length === 7) {
      fromLanguage.formatWeekdayName = (
        weekday: Date,
        options?: ConstructorParameters<typeof DateLib>[0],
        dateLib?: DateLib
      ) => {
        const lib = dateLib ?? new DateLib(options)
        const idx = weekday.getDay()
        return weekdayNames[idx] ?? lib.format(weekday, "cccccc")
      }
    }

    return { ...fromLanguage, ...formatters }
  }, [monthNames, weekdayNames, locale?.code, formatters])

  const mergedComponents = React.useMemo(
    () => ({
      ...components,
      Root: components?.Root ??
        (({ className, rootRef, ...rootProps }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...rootProps}
          />
        )),
      Chevron:
        components?.Chevron ??
        (({ className, orientation, ...chevronProps }) => {
          if (orientation === "left") {
            return (
              <IconChevronLeft className={cn("size-4", className)} {...chevronProps} />
            )
          }

          if (orientation === "right") {
            return (
              <IconChevronRight className={cn("size-4", className)} {...chevronProps} />
            )
          }

          return (
            <IconChevronDown className={cn("size-4", className)} {...chevronProps} />
          )
        }),
      DayButton:
        components?.DayButton ??
        ((dayButtonProps) => (
          <CalendarDayButton locale={locale} {...dayButtonProps} />
        )),
      WeekNumber:
        components?.WeekNumber ??
        (({ children, ...weekProps }) => (
          <td {...weekProps}>
            <div className="flex size-(--cell-size) items-center justify-center text-center">
              {children}
            </div>
          </td>
        )),
      Dropdown: components?.Dropdown ?? CompactDropdown,
    }),
    [components, locale],
  )

  const { components: _ignoredComponents, ...dayPickerProps } = props as typeof props & {
    components?: React.ComponentProps<typeof DayPicker>["components"]
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar overflow-visible bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={resolvedFormatters}
      startMonth={startMonth ?? dropdownNavBounds.startMonth}
      endMonth={endMonth ?? dropdownNavBounds.endMonth}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "relative z-20 flex h-(--cell-size) w-full items-center justify-center overflow-visible px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "relative z-20 flex h-(--cell-size) w-full items-center justify-center gap-1 overflow-visible text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative rounded-(--cell-radius)",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 bg-popover opacity-0",
          defaultClassNames.dropdown
        ),
        months_dropdown: cn(
          "max-w-[5.5rem] text-xs",
          defaultClassNames.months_dropdown
        ),
        years_dropdown: cn(
          "max-w-[4.25rem] text-xs tabular-nums",
          defaultClassNames.years_dropdown
        ),
        caption_label: cn(
          "font-medium select-none",
          captionLayout === "label"
            ? "text-sm"
            : "flex items-center gap-1 rounded-(--cell-radius) px-1 text-xs [&>svg]:size-3 [&>svg]:text-muted-foreground",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)"
            : "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
          defaultClassNames.day
        ),
        range_start: cn(
          "relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted",
          defaultClassNames.range_end
        ),
        today: cn(
          "rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={mergedComponents}
      today={today}
      {...dayPickerProps}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
