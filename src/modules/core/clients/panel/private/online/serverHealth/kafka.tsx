import {compose} from "redux";
import {useSelector} from "react-redux";
import {Globe, AlertTriangle} from "lucide-react";
import {clsx} from "clsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";
import {formatDurationInDaysHoursOrMinutes} from "@coreModule/helpers/general";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {KafkaConsumerStatus} from "armonia/src/modules/core/api/auxiliary/private/serverHealth/serverHealth.dto.ts";

function KafkaJobs({title}:{title: string}){
    const {completedJobs, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.kafka);
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {completedJobs?.toLocaleString()}</Badge>)
}
function KafkaFailedJobs({title}:{title: string}){
    const {failedJobs, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.kafka);
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {failedJobs?.toLocaleString()}</Badge>)
}
function KafkaAvgJobTime({title}:{title: string}){
    const {failedJobs, completedJobs, totalTime, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.kafka);
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {(failedJobs +  completedJobs) ? `${( totalTime / (failedJobs +  completedJobs)).toFixed(2)}ms` : "-" }</Badge>)
}
function KafkaUptime({title, resolveLanguageKey}:{title: string, resolveLanguageKey: ResolveLanguageKey}){
    const {lastStart, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.kafka);
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {formatDurationInDaysHoursOrMinutes(Date.now() - lastStart, resolveLanguageKey)}</Badge>)
}

/**
 * Renders an `x/y consumers` indicator. Severity tiers:
 *   - green: every registered consumer is alive
 *   - amber: some are alive, some are stale (partial outage)
 *   - red:   none alive while the broker reports up (full outage — the
 *            "online but no consumers" case the user explicitly flagged)
 *
 * Tooltip lists each registered consumer with its individual status so an
 * operator can identify the offender at a glance.
 */
function KafkaConsumers({title, resolveLanguageKey}:{title: string, resolveLanguageKey: ResolveLanguageKey}){
    const {connected, consumers} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.kafka);
    if (!connected) return <></>;
    const list = consumers?.list || [];
    const expected = consumers?.expected || 0;
    const running = consumers?.running || 0;

    if (expected === 0) {
        return (
            <Badge variant="outline" className="text-xs font-medium">
                {title}: 0/0
            </Badge>
        );
    }

    // Severity drives the badge variant. Using `destructive` for the full
    // outage case so it stands out next to the green "online" globe.
    const allHealthy = running === expected;
    const noneHealthy = running === 0;
    const variant = allHealthy ? "outline" : (noneHealthy ? "destructive" : "secondary");

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant={variant} className="text-xs font-medium hover:cursor-pointer flex items-center gap-1">
                        {!allHealthy && <AlertTriangle className="h-3 w-3" />}
                        {title}: {running}/{expected}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent className="min-w-md">
                    <div className="text-xs space-y-1 w-full">
                        {list.length === 0 ? (
                            <p>{resolveLanguageKey("noConsumersRegistered")}</p>
                        ) : (
                            list.map((c: KafkaConsumerStatus) => (
                                <div key={c.name} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center space-x-1 text-nowrap">
                                        <p className={clsx("h-2 w-2 rounded-full", c.alive ? "bg-green-500" : "bg-red-500")} />
                                        <p className="font-medium">{c.displayName || c.name}</p>
                                    </div>
                                    <p className="opacity-70 text-nowrap">({c.groupId})</p>
                                </div>
                            ))
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function KafkaOnline({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.kafka);
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Globe className={clsx("h-5 w-5 hover:cursor-pointer", connected ? "text-green-500" : "text-red-500")} />
                </TooltipTrigger>
                <TooltipContent>
                    <p>{resolveLanguageKey(connected ? "online" : "offline")}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

/**
 * Sub-line under the title. Combines:
 *   - online/offline status
 *   - the configured client id (so operators can tell which deployment this is)
 *   - a tooltip listing the configured brokers
 */
function KafkaReady({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {connected, enabled, clientId, brokers} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.kafka);
    const statusLabel = !enabled
        ? resolveLanguageKey("offline")
        : (connected ? resolveLanguageKey("online") : resolveLanguageKey("offline"));
    const brokerList = brokers || [];
    const hasIdentity = !!clientId || brokerList.length > 0;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground hover:cursor-help">
                        {statusLabel}
                        {hasIdentity && (
                            <>
                                {" · "}
                                <span className="font-medium">{clientId || brokerList[0]}</span>
                            </>
                        )}
                    </p>
                </TooltipTrigger>
                {hasIdentity && (
                    <TooltipContent>
                        <div className="text-xs space-y-1 max-w-xs">
                            {!!clientId && (
                                <div>
                                    <span className="opacity-70">{resolveLanguageKey("clientId")}: </span>
                                    <span className="font-medium">{clientId}</span>
                                </div>
                            )}
                            {brokerList.length > 0 && (
                                <div>
                                    <span className="opacity-70">{resolveLanguageKey("brokers")}: </span>
                                    <span className="font-medium">{brokerList.join(", ")}</span>
                                </div>
                            )}
                        </div>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    )
}

type KafkaResourceProps = WithLanguageType & {}

function KafkaResource({resolveLanguageKey}: KafkaResourceProps){

    const {connected, consumers} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.kafka);
    // Flag the misinformation case explicitly: broker is up but no consumers
    // are alive, or only some are. The card border pulses to draw attention.
    const consumersDegraded = connected && (consumers?.expected || 0) > 0 && (consumers?.running || 0) < (consumers?.expected || 0);

    return (
        <div className={cn(
            "flex flex-col md:flex-row md:items-center justify-between p-2 rounded-lg border bg-background space-y-1",
            {"border-destructive animate-pulse": !connected || consumersDegraded}
        )}>
            <div className="flex items-center space-x-2">
                <KafkaOnline resolveLanguageKey={resolveLanguageKey} />
                <div>
                    <p className={cn("text-sm font-medium", {"text-destructive": !connected})}>{resolveLanguageKey("kafkaServerTitle")}</p>
                    <KafkaReady resolveLanguageKey={resolveLanguageKey} />
                </div>
            </div>
            <div className="flex gap-1 flex-wrap max-w-full">
                <KafkaConsumers title={resolveLanguageKey("consumers")} resolveLanguageKey={resolveLanguageKey} />
                <KafkaJobs title={resolveLanguageKey("jobs")} />
                <KafkaFailedJobs title={resolveLanguageKey("failed")} />
                <KafkaAvgJobTime title={resolveLanguageKey("avgTime")} />
                <KafkaUptime title={resolveLanguageKey("uptime")} resolveLanguageKey={resolveLanguageKey}/>
            </div>
        </div>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverHealth/kafka.tsx")
)(KafkaResource)
