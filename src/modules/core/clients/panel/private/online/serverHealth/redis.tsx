import {compose} from "redux";
import {useSelector} from "react-redux";
import {Zap} from "lucide-react";
import {clsx} from "clsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";
import {formatDurationInDaysHoursOrMinutes} from "@coreModule/helpers/general";
import {cn} from "@coreModule/components/lib/utils.ts";

function RedisJobs({title}:{title: string}){
    const {completedJobs, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.redis);
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {completedJobs?.toLocaleString()}</Badge>)
}
function RedisFailedJobs({title}:{title: string}){
    const {failedJobs, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.redis);
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {failedJobs?.toLocaleString()}</Badge>)
}
function RedisAvgJobTime({title}:{title: string}){
    const {failedJobs, completedJobs, totalTime, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.redis);
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {(failedJobs +  completedJobs) ? `${( totalTime / (failedJobs +  completedJobs)).toFixed(2)}ms` : "-" }</Badge>)
} 
function RedisUptime({title, resolveLanguageKey}:{title: string, resolveLanguageKey: ResolveLanguageKey}){
    const {lastStart, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.redis);
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {formatDurationInDaysHoursOrMinutes(Date.now() - lastStart, resolveLanguageKey)}</Badge>)
}

function RedisOnline({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.redis);
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Zap className={clsx("h-5 w-5 hover:cursor-pointer", connected ? "text-green-500" : "text-red-500")} />
                </TooltipTrigger>
                <TooltipContent>
                    <p>{resolveLanguageKey(connected ? "online" : "offline")}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

/**
 * Sub-line under the title. Shows ping status plus the configured node so
 * operators can identify which Redis deployment they're looking at without
 * leaving the dashboard. Full node list is in the tooltip to avoid clutter
 * when running against a multi-node cluster.
 */
function RedisPinged({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {ping, nodes} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.redis);
    const nodeList = nodes || [];
    const statusLabel = ping ? resolveLanguageKey("online") : resolveLanguageKey("offline");

    if (nodeList.length === 0) {
        return <p className="text-xs text-muted-foreground">{statusLabel}</p>;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground hover:cursor-help">
                        {statusLabel}
                        {" · "}
                        <span className="font-medium">{nodeList[0]}</span>
                        {nodeList.length > 1 && (
                            <span className="opacity-70"> +{nodeList.length - 1}</span>
                        )}
                    </p>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="text-xs space-y-1 max-w-xs">
                        <div className="opacity-70">{resolveLanguageKey("nodes")}:</div>
                        {nodeList.map((node: string, idx: number) => (
                            <div key={`${node}-${idx}`} className="font-medium">{node}</div>
                        ))}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

type RedisResourceProps = WithLanguageType & {}

function RedisResource({resolveLanguageKey}: RedisResourceProps){

    const {connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.redis);

    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between p-2 rounded-lg border bg-background space-y-1", {"border-destructive animate-pulse": !connected})}>
            <div className="flex items-center space-x-2">
                <RedisOnline resolveLanguageKey={resolveLanguageKey} />
                <div>
                    <p className={cn("text-sm font-medium", {"text-destructive": !connected})}>{resolveLanguageKey("redisServerTitle")}</p>
                    <RedisPinged resolveLanguageKey={resolveLanguageKey} />
                </div>
            </div>
            <div className="flex gap-1 flex-wrap max-w-full">
                <RedisJobs title={resolveLanguageKey("jobs")} />
                <RedisFailedJobs title={resolveLanguageKey("failed")} />
                <RedisAvgJobTime title={resolveLanguageKey("avgTime")} />
                <RedisUptime title={resolveLanguageKey("uptime")} resolveLanguageKey={resolveLanguageKey}/>
            </div>
        </div>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverHealth/redis.tsx")
)(RedisResource)
