import {compose} from "redux";
import {formatDate, isSameDay} from "@coreModule/helpers/general";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";

type CustomDateDisplayerProps = WithLanguageType & {
    timeZone: string,
    date: Date | string | number,
    showOnlyYesterday?: boolean,
    showOnlyWeekDay?: boolean
}
function CustomDateDisplayer({
    timeZone,
    date,
    showOnlyYesterday,
    showOnlyWeekDay,
    resolveLanguageKey
 }: CustomDateDisplayerProps){

    const [displayDate, setDisplayDate] = useState<string>("");
    const [fullDate, setFullDate] = useState<string>("");

    useEffect(() => {

        const d = new Date(new Date(date).toLocaleString("en-Us", { timeZone }));
        const today = new Date(new Date().toLocaleString("en-Us", { timeZone }));

        const isToday = isSameDay(d, today);

        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const isYesterday = isSameDay(d, yesterday);

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // start of week (Sunday-based)
        const isThisWeek = d >= weekStart && d <= today;

        let display;
        if (isToday) {
            display = formatDate(
                date,
                {
                    timeZone,
                    format: {
                        hour: "2-digit",
                        minute: "2-digit",
                    }
                }
            )
            // display = timeOnly;
        }
        else if (isYesterday && showOnlyYesterday) {
            display = `${resolveLanguageKey("yesterday")}`;
        }
        else if (isThisWeek && showOnlyWeekDay) {
            display = `${resolveLanguageKey("weekDays")[d.getDay()]}`;
        }
        else{
            display = formatDate(
                date,
                {
                    timeZone,
                    format: {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                    }
                }
            );
        }

        setDisplayDate(display);
        setFullDate(formatDate(
            date,
            {
                timeZone,
                format: {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }
            }
        ));

    }, [timeZone, date, showOnlyWeekDay, showOnlyYesterday]);

    return (
        <TooltipDisplayer tooltip={fullDate}>
            <div className="text-xs opacity-50 hover:cursor-pointer hover:text-betTertiary hover:opacity-100">
                {displayDate}
            </div>
        </TooltipDisplayer>
    )

}

export default compose(
    withLanguage("src/modules/core/components/custom/customDateDisplayer.tsx")
)(CustomDateDisplayer)