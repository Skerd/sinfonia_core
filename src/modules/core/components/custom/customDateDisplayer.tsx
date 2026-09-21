import {useMemo} from "react";
import {formatDate} from "@coreModule/helpers/general/dateTime.ts";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import withLanguage, {
    ResolveLanguageKey,
    ResolveLanguageValue,
    WithLanguageType,
} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

type CustomDateDisplayerProps = WithLanguageType & {
    /** IANA timezone. Empty or unknown values fall back to the runtime's timezone. */
    timeZone?: string;
    date: Date | string | number | null | undefined;
    /** Label the previous calendar day as "Yesterday" instead of printing its date. */
    showOnlyYesterday?: boolean;
    /** Label earlier days of the current week by weekday name instead of printing their date. */
    showOnlyWeekDay?: boolean;
    /** Merged with the default styling, so callers can restyle without a wrapper element. */
    className?: string;
};

const TIME_FORMAT: Intl.DateTimeFormatOptions = {hour: "2-digit", minute: "2-digit"};
const SHORT_DATE_FORMAT: Intl.DateTimeFormatOptions = {day: "numeric", month: "short", year: "numeric"};
const FULL_DATE_FORMAT: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
};

/** `Intl.DateTimeFormat` is expensive to construct, and this renders once per chat row. */
const dayFormatterCache = new Map<string, Intl.DateTimeFormat>();

function dayFormatterFor(timeZone: string | undefined): Intl.DateTimeFormat {
    const key = timeZone || "";
    let formatter = dayFormatterCache.get(key);
    if (!formatter) {
        const dayParts: Intl.DateTimeFormatOptions = {year: "numeric", month: "2-digit", day: "2-digit"};
        try {
            formatter = new Intl.DateTimeFormat("en-CA", {timeZone: timeZone || undefined, ...dayParts});
        } catch {
            // `Intl` throws a RangeError on an empty or unknown zone, and the authenticated user
            // carries `timezone: ""` until their profile hydrates — which would take the whole
            // chat list down mid-render. Fall back to the runtime zone, exactly as `formatDate` does.
            formatter = new Intl.DateTimeFormat("en-CA", dayParts);
        }
        dayFormatterCache.set(key, formatter);
    }
    return formatter;
}

/**
 * The calendar day an instant falls on *in `timeZone`*, as a UTC-midnight Date.
 *
 * Anchoring every day to UTC midnight makes comparison and day arithmetic exact, with no
 * time-of-day residue and no DST surprises. This replaces the old
 * `new Date(d.toLocaleString("en-Us", {timeZone}))` round-trip, which relied on the engine
 * re-parsing a localized string and produced a Date whose instant was simply wrong.
 */
function calendarDayIn(date: Date, timeZone: string | undefined): Date | null {
    const parts = dayFormatterFor(timeZone).formatToParts(date);
    const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const [year, month, day] = [part("year"), part("month"), part("day")];
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    return new Date(Date.UTC(year, month - 1, day));
}

function addDays(day: Date, delta: number): Date {
    const next = new Date(day);
    next.setUTCDate(next.getUTCDate() + delta);
    return next;
}

/**
 * The short, relative label a chat row shows: a time for today, "Yesterday", a weekday name for
 * earlier in the current week, or `null` when the date is old enough that only an absolute date
 * carries meaning.
 */
function relativeLabelFor(
    value: Date,
    timeZone: string | undefined,
    options: Pick<CustomDateDisplayerProps, "showOnlyYesterday" | "showOnlyWeekDay">,
    resolveLanguageKey: ResolveLanguageKey,
    resolveLanguageValue: ResolveLanguageValue,
): string | null {
    const valueDay = calendarDayIn(value, timeZone);
    const todayDay = calendarDayIn(new Date(), timeZone);
    if (!valueDay || !todayDay) return null;

    if (valueDay.getTime() === todayDay.getTime()) {
        return formatDate(value, {timeZone, format: TIME_FORMAT});
    }

    if (options.showOnlyYesterday && valueDay.getTime() === addDays(todayDay, -1).getTime()) {
        return resolveLanguageKey("yesterday");
    }

    if (options.showOnlyWeekDay) {
        // Sunday-based week containing today; both ends are UTC midnights, so a date earlier
        // in the day on the first day of the week is included (the old code dropped it).
        const weekStart = addDays(todayDay, -todayDay.getUTCDay());
        if (valueDay >= weekStart && valueDay <= todayDay) {
            const weekDays = resolveLanguageValue<string[]>("weekDays");
            const label = Array.isArray(weekDays) ? weekDays[valueDay.getUTCDay()] : undefined;
            if (label) return label;
        }
    }

    return null;
}

function CustomDateDisplayer({
    timeZone,
    date,
    showOnlyYesterday,
    showOnlyWeekDay,
    className,
    resolveLanguageKey,
    resolveLanguageValue,
}: CustomDateDisplayerProps) {
    // Derived, not stored: computing this in an effect meant the first paint of every row was
    // blank and the text only appeared on a second render.
    const rendered = useMemo(() => {
        const value = date == null ? null : new Date(date);
        if (!value || Number.isNaN(value.getTime())) return null;

        const relative = relativeLabelFor(
            value,
            timeZone,
            {showOnlyYesterday, showOnlyWeekDay},
            resolveLanguageKey,
            resolveLanguageValue,
        );

        return {
            label: relative || formatDate(value, {timeZone, format: SHORT_DATE_FORMAT}),
            /** Unabbreviated, for the tooltip and for what assistive tech announces. */
            full: formatDate(value, {timeZone, format: FULL_DATE_FORMAT}),
            /** Machine-readable instant, so the markup means something without the tooltip. */
            machine: value.toISOString(),
        };
    }, [date, timeZone, showOnlyYesterday, showOnlyWeekDay, resolveLanguageKey, resolveLanguageValue]);

    // An unparseable date has nothing to say; an empty tooltip target only collects hover styling.
    if (!rendered) return null;

    return (
        <TooltipDisplayer tooltip={rendered.full}>
            <time
                dateTime={rendered.machine}
                aria-label={rendered.full || undefined}
                className={cn(
                    "text-xs whitespace-nowrap opacity-50",
                    "hover:cursor-pointer hover:text-betTertiary hover:opacity-100",
                    className,
                )}
            >
                {rendered.label}
            </time>
        </TooltipDisplayer>
    );
}

export default withLanguage("src/modules/core/components/custom/customDateDisplayer.tsx")(CustomDateDisplayer);
