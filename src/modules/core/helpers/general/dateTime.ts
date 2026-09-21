import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";

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
