import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";

/**
 * New Sinfonia UI date formatting. Prefer this over adding another `date-fns` call site.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const HAS_EXPLICIT_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i;

export type ZonedDateTimeParts = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
};

const ZONED_PARTS_FORMAT: Intl.DateTimeFormatOptions = {
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
};

/** Format used by {@link formatDate} when the caller passes none. */
const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
};

const NUMERIC_DATE = {year: "numeric", month: "numeric", day: "numeric"} as const;
const NUMERIC_TIME = {hour: "2-digit", minute: "2-digit", second: "2-digit"} as const;

/**
 * Named formats for {@link formatDate}, matching what `Date#toLocaleDateString()`,
 * `toLocaleTimeString()` and `toLocaleString()` print by default (but always on a 24h clock).
 */
export const DATE_FORMATS = {
    date: NUMERIC_DATE,
    time: NUMERIC_TIME,
    dateTime: {...NUMERIC_DATE, ...NUMERIC_TIME},
} satisfies Record<string, Intl.DateTimeFormatOptions>;

export interface FormatDateOptions {
    /** IANA timezone. Empty or unknown values fall back to the runtime's timezone. */
    timeZone?: string;
    /** Replaces the default format entirely (it is not merged with it). */
    format?: Intl.DateTimeFormatOptions;
}

/** Same reasoning as the number formatter cache: date cells and chat rows format on every render. */
const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(timeZone: string | undefined, format: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    const key = JSON.stringify([timeZone, format]);
    let formatter = dateFormatterCache.get(key);
    if (!formatter) {
        try {
            formatter = new Intl.DateTimeFormat(undefined, {timeZone, hourCycle: "h23", ...format});
        } catch {
            // An invalid timezone (e.g. a user profile with a stale value) must not break rendering.
            formatter = new Intl.DateTimeFormat(undefined, {hourCycle: "h23", ...format});
        }
        dateFormatterCache.set(key, formatter);
    }
    return formatter;
}

/**
 * Formats a date in the runtime locale.
 *
 * @param date - Date instance, ISO string, or timestamp.
 * @param options
 * @returns `""` when `date` is empty or not a valid date.
 */
export function formatDate(date: Date | string | number | null | undefined, options: FormatDateOptions = {}): string {
    if (!date) return "";
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return "";
    return getDateFormatter(options.timeZone || undefined, options.format ?? DEFAULT_DATE_FORMAT).format(value);
}

function pad2(n: number): string {
    return String(n).padStart(2, "0");
}

function utcYmd(date: Date): string {
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

/**
 * Calendar day `YYYY-MM-DD` for a date-only field.
 *
 * Date-only strings stay as written. Instants with an explicit offset (`Z` / `±HH:MM`)
 * use the UTC calendar day of that instant (API date-only values are stored as UTC midnight).
 * Naive `YYYY-MM-DDTHH:mm` strings use the date prefix so a missing `Z` cannot shift the day.
 */
export function calendarDayUtc(value: Date | string | number | null | undefined): string {
    if (value == null || value === "") return "";
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (DATE_ONLY.test(trimmed)) return trimmed;
        const prefix = trimmed.slice(0, 10);
        if (DATE_ONLY.test(prefix) && !HAS_EXPLICIT_OFFSET.test(trimmed)) return prefix;
        const parsed = new Date(trimmed);
        return Number.isNaN(parsed.getTime()) ? "" : utcYmd(parsed);
    }
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "" : utcYmd(date);
}

function readZonedParts(date: Date, timeZone: string | undefined): ZonedDateTimeParts | null {
    try {
        const parts = new Intl.DateTimeFormat("en-US", {...ZONED_PARTS_FORMAT, timeZone: timeZone || undefined}).formatToParts(date);
        const num = (type: Intl.DateTimeFormatPartTypes) => {
            const raw = parts.find((p) => p.type === type)?.value;
            return raw != null ? Number.parseInt(raw, 10) : Number.NaN;
        };
        const year = num("year");
        const month = num("month");
        const day = num("day");
        let hour = num("hour");
        const minute = num("minute");
        const second = num("second");
        if ([year, month, day, hour, minute, second].some((n) => Number.isNaN(n))) return null;
        if (hour === 24) hour = 0;
        return {year, month, day, hour, minute, second};
    } catch {
        return timeZone ? readZonedParts(date, undefined) : null;
    }
}

/** Wall-clock components of `date` in `timeZone` (invalid zones fall back to the runtime zone). */
export function zonedParts(date: Date, timeZone?: string): ZonedDateTimeParts | null {
    if (Number.isNaN(date.getTime())) return null;
    return readZonedParts(date, timeZone);
}

/**
 * Instant at which clocks in `timeZone` show the given wall clock.
 * Invalid zones fall back to the runtime zone.
 */
export function fromZonedWallClock(
    timeZone: string | undefined,
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second = 0,
): Date | null {
    const desired = Date.UTC(year, month - 1, day, hour, minute, second);
    let guess = desired;
    for (let i = 0; i < 4; i++) {
        const parts = readZonedParts(new Date(guess), timeZone);
        if (!parts) return null;
        const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
        const delta = desired - asUtc;
        if (delta === 0) return new Date(guess);
        guess += delta;
    }
    const resolved = new Date(guess);
    return Number.isNaN(resolved.getTime()) ? null : resolved;
}

/**
 * A `Date` whose **local** Y-M-D H:m:s equal the wall clock of `instant` in `timeZone`.
 * For timezone-naive widgets (calendars, `getHours`) so they show the profile zone.
 */
export function toZonedWallClockDate(instant: Date, timeZone?: string): Date | null {
    const parts = zonedParts(instant, timeZone);
    if (!parts) return null;
    return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

/** Whether two dates fall on the same local calendar day. */
export function isSameDay(d1: Date, d2: Date): boolean {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

/**
 * Human-readable duration using its largest units: "2 days, 3 hours", "5 hours", "45 minutes" or "10 seconds".
 * Unit labels come from `resolveLanguageKey` ("day"/"days", "hour"/"hours", "minute"/"minutes", "second"/"seconds").
 * Negative durations are treated as zero.
 */
export function formatDurationInDaysHoursOrMinutes(ms: number, resolveLanguageKey: ResolveLanguageKey): string {
    const totalSeconds = Math.floor(Math.max(ms, 0) / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const unit = (count: number, singular: string, plural: string) =>
        `${count} ${resolveLanguageKey(count === 1 ? singular : plural)}`;

    if (days > 0) return `${unit(days, "day", "days")}, ${unit(totalHours % 24, "hour", "hours")}`;
    if (totalHours > 0) return unit(totalHours, "hour", "hours");
    if (totalMinutes > 0) return unit(totalMinutes, "minute", "minutes");
    return unit(totalSeconds, "second", "seconds");
}
