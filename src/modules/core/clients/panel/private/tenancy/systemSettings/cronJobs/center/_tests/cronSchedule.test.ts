import {describe, expect, it} from "vitest";
import {describeCronSchedule, readCronSchedule} from "../cronSchedule.ts";
import cardTexts from "@coreModule/assets/languages/en-US/clients/panel/private/tenancy/systemSettings/cronJobs/center/cardView/cronJobCard.json";

const texts = cardTexts.scheduleText as Record<string, string>;
const resolve = ((key: string) => texts[key.replace("scheduleText.", "")] ?? `---${key}---`) as never;

// TD-F118: scheduled action cards showed the raw expression ("0 30 3 * * *").
describe("readable schedules", () => {
    it("reads the common shapes, with or without a seconds field", () => {
        expect(readCronSchedule("0 30 3 * * *")).toEqual({kind: "daily", hour: 3, minute: 30});
        expect(readCronSchedule("30 3 * * *")).toEqual({kind: "daily", hour: 3, minute: 30});
        expect(readCronSchedule("*/30 * * * * *")).toEqual({kind: "everyNSeconds", n: 30});
        expect(readCronSchedule("0 */5 * * * *")).toEqual({kind: "everyNMinutes", n: 5});
        expect(readCronSchedule("0 */1 * * * *")).toEqual({kind: "everyMinute"});
        expect(readCronSchedule("0 0 */1 * * *")).toEqual({kind: "hourly", minute: 0});
        expect(readCronSchedule("0 15 * * * *")).toEqual({kind: "hourly", minute: 15});
        expect(readCronSchedule("0 0 */6 * * *")).toEqual({kind: "everyNHours", n: 6, minute: 0});
        expect(readCronSchedule("0 0 8 * * 1-5")).toEqual({kind: "weekdays", hour: 8, minute: 0});
        expect(readCronSchedule("0 0 9 * * 7")).toEqual({kind: "weekly", weekday: 0, hour: 9, minute: 0});
        expect(readCronSchedule("0 0 6 1 * *")).toEqual({kind: "monthly", day: 1, hour: 6, minute: 0});
    });

    it("leaves other shapes to the expression as written", () => {
        for (const expression of ["0 0 9 * 1 *", "0 0,30 9 * * *", "15 0 9 * * *", "0 0 9 1 * 1", "nonsense", ""]) {
            expect(readCronSchedule(expression)).toBeNull();
        }
        expect(describeCronSchedule("0 0,30 9 * * *", resolve)).toBe("0 0,30 9 * * *");
    });

    it("says the schedule in words", () => {
        // The scheduler reads expressions in UTC.
        expect(describeCronSchedule("0 30 3 * * *", resolve)).toMatch(/^Daily at 0?3:30( AM)? UTC$/);
        expect(describeCronSchedule("0 */5 * * * *", resolve)).toBe("Every 5 minutes");
        expect(describeCronSchedule("0 5 * * * *", resolve)).toBe("Hourly at :05");
        expect(describeCronSchedule("0 0 9 * * 1", resolve)).toMatch(/^Every Monday at 0?9:00( AM)? UTC$/);
    });
});
