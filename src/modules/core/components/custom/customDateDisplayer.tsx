import {useMemo} from "react";
import {formatDate} from "@baseModule/helpers/general/dateTime.ts";
import TooltipDisplayer from "@baseModule/components/custom/tooltipDisplayer.tsx";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";

type CustomDateDisplayerProps = WithLanguageType & {
    timeZone: string;
    date: Date | string | number;
    showOnlyYesterday?: boolean;
    showOnlyWeekDay?: boolean;
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

function dayFormatterFor(timeZone: string): Intl.DateTimeFormat {
    let formatter = dayFormatterCache.get(timeZone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat("en-CA", {timeZone, year: "numeric", month: "2-digit", day: "2-digit"});
        dayFormatterCache.set(timeZone, formatter);
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
function calendarDayIn(date: Date, timeZone: string): Date | null {
    if (Number.isNaN(date.getTime())) return null;
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

function CustomDateDisplayer({
    timeZone,
    date,
    showOnlyYesterday,
    showOnlyWeekDay,
    resolveLanguageKey,
    resolveLanguageValue,
}: CustomDateDisplayerProps) {
    // Derived, not stored: computing this in an effect meant the first paint of every row was
    // blank and the text only appeared on a second render.
    const displayDate = useMemo(() => {
        const valueDay = calendarDayIn(new Date(date), timeZone);
        const todayDay = calendarDayIn(new Date(), timeZone);
        if (!valueDay || !todayDay) return formatDate(date, {timeZone, format: SHORT_DATE_FORMAT});

        if (valueDay.getTime() === todayDay.getTime()) {
            return formatDate(date, {timeZone, format: TIME_FORMAT});
        }

        if (showOnlyYesterday && valueDay.getTime() === addDays(todayDay, -1).getTime()) {
            return String(resolveLanguageKey("yesterday"));
        }

        if (showOnlyWeekDay) {
            // Sunday-based week containing today; both ends are UTC midnights, so a date earlier
            // in the day on the first day of the week is included (the old code dropped it).
            const weekStart = addDays(todayDay, -todayDay.getUTCDay());
            if (valueDay >= weekStart && valueDay <= todayDay) {
                const weekDays = resolveLanguageValue<string[]>("weekDays");
                const label = Array.isArray(weekDays) ? weekDays[valueDay.getUTCDay()] : undefined;
                if (label) return label;
            }
        }

        return formatDate(date, {timeZone, format: SHORT_DATE_FORMAT});
    }, [date, timeZone, showOnlyYesterday, showOnlyWeekDay, resolveLanguageKey, resolveLanguageValue]);

    const fullDate = useMemo(
        () => formatDate(date, {timeZone, format: FULL_DATE_FORMAT}),
        [date, timeZone],
    );

    return (
        <TooltipDisplayer tooltip={fullDate}>
            <div className="text-xs opacity-50 hover:cursor-pointer hover:text-betTertiary hover:opacity-100">
                {displayDate}
            </div>
        </TooltipDisplayer>
    );
}

export default withLanguage("src/modules/core/components/custom/customDateDisplayer.tsx")(CustomDateDisplayer);
