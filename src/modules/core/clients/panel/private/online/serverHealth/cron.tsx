import {compose} from "redux";
import {useSelector} from "react-redux";
import {clsx} from "clsx";
import {Timer} from "lucide-react";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";
import {formatDurationInDaysHoursOrMinutes} from "@coreModule/helpers/general";
import {cn} from "@coreModule/components/lib/utils.ts";

/** The cron scheduler runs as its own dedicated process (cronServer). */
function useCronScheduler(){
    return useSelector((state: RootState) => state.serverResources.serverHealth.services?.cronScheduler);
}

function CronJobs({title}:{title: string}){
    const cron = useCronScheduler();
    if( !cron?.connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {cron.completed?.toLocaleString() || 0}</Badge>)
}
function CronFailedJobs({title}:{title: string}){
    const cron = useCronScheduler();
    if( !cron?.connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {cron.failed?.toLocaleString() || 0}</Badge>)
}
function CronAvgJobTime({title}:{title: string}){
    const cron = useCronScheduler();
    if( !cron?.connected ){
        return <></>
    }
    return (
        <Badge variant="outline" className="text-xs font-medium">
            {title}: {(cron.completed || 0) ? `${(cron.averageMs || 0).toFixed(2)}ms` : "-"}
        </Badge>
    )
}
function CronUptime({title, resolveLanguageKey}:{title: string, resolveLanguageKey: ResolveLanguageKey}){
    const cron = useCronScheduler();
    if( !cron?.connected ){
        return <></>
    }
    const lastStart = cron.lastStart || cron.lastHeartbeat || 0;
    if( !lastStart ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {formatDurationInDaysHoursOrMinutes(Date.now() - lastStart, resolveLanguageKey)}</Badge>)
}

function CronOnline({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const connected = !!useCronScheduler()?.connected;
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Timer className={clsx("h-5 w-5 hover:cursor-pointer", connected ? "text-green-500" : "text-red-500")} />
                </TooltipTrigger>
                <TooltipContent>
                    <p>{resolveLanguageKey(connected ? "online" : "offline")}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
function CronServerName({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {serverId} = useCronScheduler() || {};
    const [host, ...rest] = (serverId || "").split(":");
    const name = rest.join(":");
    return (
        <p className="text-xs text-muted-foreground">{host || resolveLanguageKey("offline")}{name && ` • ${name}`}</p>
    )
}

type CronResourceProps = WithLanguageType & {}

function CronResource({resolveLanguageKey}: CronResourceProps){

    const connected = !!useCronScheduler()?.connected;

    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between p-2 rounded-lg border bg-background space-y-1", {"border-destructive animate-pulse": !connected})}>
            <div className="flex items-center space-x-2">
                <CronOnline resolveLanguageKey={resolveLanguageKey} />
                <div>
                    <p className={cn("text-sm font-medium", {"text-destructive": !connected})}>{resolveLanguageKey("cronServerTitle")}</p>
                    <CronServerName resolveLanguageKey={resolveLanguageKey} />
                </div>
            </div>
            <div className="flex gap-1 flex-wrap max-w-full">
                <CronJobs title={resolveLanguageKey("jobs")} />
                <CronFailedJobs title={resolveLanguageKey("failed")} />
                <CronAvgJobTime title={resolveLanguageKey("avgTime")} />
                <CronUptime title={resolveLanguageKey("uptime")} resolveLanguageKey={resolveLanguageKey}/>
            </div>
        </div>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverHealth/cron.tsx")
)(CronResource)
