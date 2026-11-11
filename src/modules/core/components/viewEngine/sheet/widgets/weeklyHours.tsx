import {formatDate} from "@coreModule/helpers/general/dateTime.ts";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";

/** One weekly row: `dayOfWeek` 0 = Sunday … 6 = Saturday (armonia `WeeklyHoursSlotDef`), times as "HH:mm". */
export type WeeklyHoursRow = {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    /** Where this row applies, when rows span several places (a dentist working at two locations). */
    place?: string;
};

type Props = {
    rows: WeeklyHoursRow[];
    /** Shown for a day with no rows, e.g. "Closed". */
    closedLabel: string;
};

/** Monday first, the order a week is read in Europe; Sunday last. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];
/** 7 Jan 2024 was a Sunday, so day `n` of that week is weekday `n`. */
const weekdayName = (dayOfWeek: number) =>
    formatDate(Date.UTC(2024, 0, 7 + dayOfWeek), {timeZone: "UTC", format: {weekday: "short"}});

/**
 * A week of opening or working hours as one compact table (UX-08): one line per day with its time ranges, and
 * days without hours marked closed. Replaces one box per row.
 */
export default function WeeklyHours({rows, closedLabel}: Props) {
    if (!rows.length) return <ValueNotSet />;
    return (
        <dl className="grid grid-cols-[minmax(3.5rem,auto)_1fr] gap-x-4 gap-y-1 rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm">
            {WEEK.map((day) => {
                const ranges = rows
                    .filter((row) => row.dayOfWeek === day)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((row) => `${row.startTime}–${row.endTime}${row.place ? ` · ${row.place}` : ""}`);
                return (
                    <div key={day} className="contents">
                        <dt className="font-medium">{weekdayName(day)}</dt>
                        <dd className={ranges.length ? "tabular-nums" : "text-muted-foreground"}>{ranges.length ? ranges.join(", ") : closedLabel}</dd>
                    </div>
                );
            })}
        </dl>
    );
}
