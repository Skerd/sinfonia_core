import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {fillTemplate} from "armonia/src/modules/core/helpers/template.ts";

/** A schedule shape a person reads at a glance, with the values its sentence needs. */
export type CronSchedule =
    | {kind: "everyNSeconds"; n: number}
    | {kind: "everyMinute"}
    | {kind: "everyNMinutes"; n: number}
    | {kind: "hourly"; minute: number}
    | {kind: "everyNHours"; n: number; minute: number}
    | {kind: "daily"; hour: number; minute: number}
    | {kind: "weekdays"; hour: number; minute: number}
    | {kind: "weekly"; weekday: number; hour: number; minute: number}
    | {kind: "monthly"; day: number; hour: number; minute: number};

const NUMBER = /^\d+$/;
const STEP = /^\*\/(\d+)$/;

function inRange(value: string, max: number, min = 0): number | null {
    if (!NUMBER.test(value)) return null;
    const n = Number(value);
    return n >= min && n <= max ? n : null;
}

function step(value: string): number | null {
    const match = STEP.exec(value);
    return match ? Number(match[1]) : null;
}

/**
 * Reads the common shapes of a cron expression (5 fields, or 6 with seconds first): every N seconds or minutes,
 * hourly, every N hours, daily, on weekdays, weekly and monthly. Anything else is `null`, and the caller shows the
 * expression as written (TD-F118).
 */
export function readCronSchedule(expression: string | undefined | null): CronSchedule | null {
    const fields = (expression ?? "").trim().split(/\s+/);
    if (fields.length !== 5 && fields.length !== 6) return null;
    const [second, minuteField, hourField, dayField, monthField, weekdayField] = fields.length === 6 ? fields : ["0", ...fields];
    if (monthField !== "*") return null;

    const everyNSeconds = step(second);
    if (everyNSeconds && [minuteField, hourField, dayField, weekdayField].every((field) => field === "*")) {
        return {kind: "everyNSeconds", n: everyNSeconds};
    }
    if (second !== "0") return null;

    const anyDay = dayField === "*" && weekdayField === "*";
    if (anyDay && hourField === "*") {
        const everyNMinutes = step(minuteField);
        if (minuteField === "*" || everyNMinutes === 1) return {kind: "everyMinute"};
        if (everyNMinutes) return {kind: "everyNMinutes", n: everyNMinutes};
    }
    const minute = inRange(minuteField, 59);
    if (minute === null) return null;
    const everyNHours = step(hourField);
    if (anyDay && (hourField === "*" || everyNHours === 1)) return {kind: "hourly", minute};
    if (anyDay && everyNHours) return {kind: "everyNHours", n: everyNHours, minute};

    const hour = inRange(hourField, 23);
    if (hour === null) return null;
    if (anyDay) return {kind: "daily", hour, minute};
    if (dayField === "*" && weekdayField === "1-5") return {kind: "weekdays", hour, minute};
    const weekday = dayField === "*" ? inRange(weekdayField, 7) : null;
    if (weekday !== null) return {kind: "weekly", weekday: weekday % 7, hour, minute};
    const day = weekdayField === "*" ? inRange(dayField, 31, 1) : null;
    if (day !== null) return {kind: "monthly", day, hour, minute};
    return null;
}

/** A Sunday (2024-01-07), so `SUNDAY + weekday` days later is that weekday. */
const SUNDAY = Date.UTC(2024, 0, 7);
const DAY_MS = 86_400_000;

/**
 * The schedule as a sentence in the app's language ("Daily at 03:30 UTC"), from the card's `scheduleText.*` texts, or
 * the expression as written when it has no common shape. The scheduler reads every expression in UTC
 * (`nextRunCalculator.ts`), so times and weekdays say UTC: shown in local time they would move an hour with summer time.
 */
export function describeCronSchedule(expression: string | undefined | null, resolveLanguageKey: ResolveLanguageKey): string {
    const schedule = readCronSchedule(expression);
    if (!schedule) return expression ?? "";
    const time = "hour" in schedule
        ? `${formatDate(new Date(Date.UTC(2024, 0, 1, schedule.hour, schedule.minute)), {timeZone: "UTC", format: {hour: "2-digit", minute: "2-digit"}})} UTC`
        : "";
    const weekday = schedule.kind === "weekly"
        ? formatDate(new Date(SUNDAY + schedule.weekday * DAY_MS), {timeZone: "UTC", format: {weekday: "long"}})
        : "";
    const values: Record<string, string | number> = {
        time,
        weekday,
        n: "n" in schedule ? schedule.n : "",
        minute: "minute" in schedule ? String(schedule.minute).padStart(2, "0") : "",
        day: "day" in schedule ? schedule.day : "",
    };
    return fillTemplate(String(resolveLanguageKey(`scheduleText.${schedule.kind}`)), values);
}
