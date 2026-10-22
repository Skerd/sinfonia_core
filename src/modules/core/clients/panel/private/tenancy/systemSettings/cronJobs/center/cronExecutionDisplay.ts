import type {CronExecutionStatus} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.constants.ts";
import {
    STATUS_BADGE_DANGER,
    STATUS_BADGE_INFO,
    STATUS_BADGE_NEUTRAL,
    STATUS_BADGE_SUCCESS,
    STATUS_BADGE_WARNING,
} from "@coreModule/components/entityPage/list/entityCard.constants.ts";

export const EXECUTION_STATUS_BADGE: Record<CronExecutionStatus, string> = {
    running: STATUS_BADGE_INFO,
    success: STATUS_BADGE_SUCCESS,
    failed: STATUS_BADGE_DANGER,
    timeout: STATUS_BADGE_WARNING,
    cancelled: STATUS_BADGE_NEUTRAL,
};

function formatUnit(value: number, unit: "millisecond" | "second" | "minute", maximumFractionDigits = 0): string {
    return new Intl.NumberFormat(undefined, {style: "unit", unit, unitDisplay: "short", maximumFractionDigits}).format(value);
}

/** Job durations run from milliseconds to tens of minutes: `850 ms`, `12.4 s`, `4 min 3 s`. */
export function formatDurationMs(ms: number | undefined): string {
    if (ms == null) return "—";
    if (ms < 1_000) return formatUnit(Math.round(ms), "millisecond");
    if (ms < 60_000) return formatUnit(ms / 1_000, "second", 1);
    const minutes = Math.floor(ms / 60_000);
    const seconds = Math.round((ms % 60_000) / 1_000);
    return seconds > 0 ? `${formatUnit(minutes, "minute")} ${formatUnit(seconds, "second")}` : formatUnit(minutes, "minute");
}
