import {compose} from "redux";
import {useSelector} from "react-redux";
import {Layers, AlertTriangle} from "lucide-react";
import {clsx} from "clsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";
import {formatDurationInDaysHoursOrMinutes} from "@coreModule/helpers/general";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {KafkaConsumerStatus} from "armonia/src/modules/core/api/auxiliary/private/serverHealth/serverHealth.dto.ts";

/** Dedicated Maestro kafkaServer process (consumers + pipeline work). */
function useKafkaServer(){
    return useSelector((state: RootState) => state.serverResources.serverHealth.services?.kafkaServer);
}

function KafkaServerJobs({title}:{title: string}){
    const kafkaServer = useKafkaServer();
    if( !kafkaServer?.connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {kafkaServer.completed?.toLocaleString() || 0}</Badge>)
}
function KafkaServerFailedJobs({title}:{title: string}){
    const kafkaServer = useKafkaServer();
    if( !kafkaServer?.connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {kafkaServer.failed?.toLocaleString() || 0}</Badge>)
}
function KafkaServerAvgJobTime({title}:{title: string}){
    const kafkaServer = useKafkaServer();
    if( !kafkaServer?.connected ){
        return <></>
    }
    return (
        <Badge variant="outline" className="text-xs font-medium">
            {title}: {(kafkaServer.processed || 0) ? `${(kafkaServer.averageMs || 0).toFixed(2)}ms` : "-"}
        </Badge>
    )
}
function KafkaServerUptime({title, resolveLanguageKey}:{title: string, resolveLanguageKey: ResolveLanguageKey}){
    const kafkaServer = useKafkaServer();
    if( !kafkaServer?.connected ){
        return <></>
    }
    const lastStart = kafkaServer.lastStart || kafkaServer.lastHeartbeat || 0;
    if( !lastStart ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {formatDurationInDaysHoursOrMinutes(Date.now() - lastStart, resolveLanguageKey)}</Badge>)
}

function KafkaServerConsumers({title, resolveLanguageKey}:{title: string, resolveLanguageKey: ResolveLanguageKey}){
    const kafkaServer = useKafkaServer();
    if (!kafkaServer?.connected) return <></>;
    const list = kafkaServer.consumers?.list || [];
    const expected = kafkaServer.consumers?.expected || 0;
    const running = kafkaServer.consumers?.running || 0;

    if (expected === 0) {
        return (
            <Badge variant="outline" className="text-xs font-medium">
                {title}: 0/0
            </Badge>
        );
    }

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

function KafkaServerOnline({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const connected = !!useKafkaServer()?.connected;
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Layers className={clsx("h-5 w-5 hover:cursor-pointer", connected ? "text-green-500" : "text-red-500")} />
                </TooltipTrigger>
                <TooltipContent>
                    <p>{resolveLanguageKey(connected ? "online" : "offline")}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
function KafkaServerName({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {serverId} = useKafkaServer() || {};
    const [host, ...rest] = (serverId || "").split(":");
    const name = rest.join(":");
    return (
        <p className="text-xs text-muted-foreground">{host || resolveLanguageKey("offline")}{name && ` • ${name}`}</p>
    )
}

type KafkaServerResourceProps = WithLanguageType & {}

function KafkaServerResource({resolveLanguageKey}: KafkaServerResourceProps){
    const kafkaServer = useKafkaServer();
    const connected = !!kafkaServer?.connected;
    const consumersDegraded = connected
        && (kafkaServer?.consumers?.expected || 0) > 0
        && (kafkaServer?.consumers?.running || 0) < (kafkaServer?.consumers?.expected || 0);

    return (
        <div className={cn(
            "flex flex-col md:flex-row md:items-center justify-between p-2 rounded-lg border bg-background space-y-1",
            {"border-destructive animate-pulse": !connected || consumersDegraded}
        )}>
            <div className="flex items-center space-x-2">
                <KafkaServerOnline resolveLanguageKey={resolveLanguageKey} />
                <div>
                    <p className={cn("text-sm font-medium", {"text-destructive": !connected})}>{resolveLanguageKey("kafkaServerTitle")}</p>
                    <KafkaServerName resolveLanguageKey={resolveLanguageKey} />
                </div>
            </div>
            <div className="flex gap-1 flex-wrap max-w-full">
                <KafkaServerConsumers title={resolveLanguageKey("consumers")} resolveLanguageKey={resolveLanguageKey} />
                <KafkaServerJobs title={resolveLanguageKey("jobs")} />
                <KafkaServerFailedJobs title={resolveLanguageKey("failed")} />
                <KafkaServerAvgJobTime title={resolveLanguageKey("avgTime")} />
                <KafkaServerUptime title={resolveLanguageKey("uptime")} resolveLanguageKey={resolveLanguageKey}/>
            </div>
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverHealth/kafkaServer.tsx")
)(KafkaServerResource)
