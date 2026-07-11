import {compose} from "redux";
import {useSelector} from "react-redux";
import {Globe} from "lucide-react";
import {clsx} from "clsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {formatDurationInDaysHoursOrMinutes} from "@coreModule/helpers/general";
import {cn} from "@coreModule/components/lib/utils.ts";

/** Infrastructure Kafka brokers (cluster), not the Maestro kafkaServer process. */
function useKafka(){
    return useSelector((state: RootState) => state.serverResources.serverHealth.services!.kafka);
}

function KafkaUptime({title, resolveLanguageKey}:{title: string, resolveLanguageKey: ResolveLanguageKey}){
    const {lastStart, connected} = useKafka();
    if( !connected ){
        return <></>
    }
    if( !lastStart ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {formatDurationInDaysHoursOrMinutes(Date.now() - lastStart, resolveLanguageKey)}</Badge>)
}

function KafkaBrokerCount({title, resolveLanguageKey}:{title: string, resolveLanguageKey: ResolveLanguageKey}){
    const {connected, brokerCount, brokersOnline, brokers} = useKafka();
    if( !connected ){
        return <></>
    }
    const online = brokerCount ?? brokersOnline?.length ?? 0;
    const configured = brokers?.length ?? 0;
    const list = (brokersOnline && brokersOnline.length > 0) ? brokersOnline : (brokers || []);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs font-medium hover:cursor-help">
                        {title}: {configured > 0 ? `${online}/${configured}` : online}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="text-xs space-y-1 max-w-xs">
                        <div className="opacity-70">{resolveLanguageKey("brokersOnline")}:</div>
                        {list.length === 0 ? (
                            <div className="font-medium">{resolveLanguageKey("none")}</div>
                        ) : (
                            list.map((broker: string, idx: number) => (
                                <div key={`${broker}-${idx}`} className="font-medium">{broker}</div>
                            ))
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

function KafkaTopicCount({title, resolveLanguageKey}:{title: string, resolveLanguageKey: ResolveLanguageKey}){
    const {connected, topicCount, topics} = useKafka();
    if( !connected ){
        return <></>
    }
    const count = topicCount ?? topics?.length ?? 0;
    const list = topics || [];

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs font-medium hover:cursor-help">
                        {title}: {count}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent className="min-w-md">
                    <div className="text-xs space-y-1 max-h-64 overflow-y-auto">
                        <div className="opacity-70">{resolveLanguageKey("topics")}:</div>
                        {list.length === 0 ? (
                            <div className="font-medium">{resolveLanguageKey("none")}</div>
                        ) : (
                            list.map((topic: string) => (
                                <div key={topic} className="font-medium">{topic}</div>
                            ))
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

function KafkaOnline({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {connected, enabled} = useKafka();
    const online = enabled && connected;
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Globe className={clsx("h-5 w-5 hover:cursor-pointer", online ? "text-green-500" : "text-red-500")} />
                </TooltipTrigger>
                <TooltipContent>
                    <p>{resolveLanguageKey(online ? "online" : "offline")}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

/**
 * Sub-line under the title. Shows online/offline plus the first broker;
 * full broker list is in the tooltip (same pattern as Redis nodes).
 */
function KafkaBrokers({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {connected, enabled, brokers, clusterId} = useKafka();
    const statusLabel = !enabled
        ? resolveLanguageKey("disabled")
        : (connected ? resolveLanguageKey("online") : resolveLanguageKey("offline"));
    const brokerList = brokers || [];

    if (brokerList.length === 0) {
        return <p className="text-xs text-muted-foreground">{statusLabel}</p>;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground hover:cursor-help">
                        {statusLabel}
                        {" · "}
                        <span className="font-medium">{brokerList[0]}</span>
                        {brokerList.length > 1 && (
                            <span className="opacity-70"> +{brokerList.length - 1}</span>
                        )}
                    </p>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="text-xs space-y-1 max-w-xs">
                        {!!clusterId && (
                            <div>
                                <span className="opacity-70">{resolveLanguageKey("clusterId")}: </span>
                                <span className="font-medium">{clusterId}</span>
                            </div>
                        )}
                        <div className="opacity-70">{resolveLanguageKey("brokers")}:</div>
                        {brokerList.map((broker: string, idx: number) => (
                            <div key={`${broker}-${idx}`} className="font-medium">{broker}</div>
                        ))}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

type KafkaResourceProps = WithLanguageType & {}

function KafkaResource({resolveLanguageKey}: KafkaResourceProps){
    const {connected, enabled} = useKafka();
    const online = enabled && connected;

    return (
        <div className={cn(
            "flex flex-col md:flex-row md:items-center justify-between p-2 rounded-lg border bg-background space-y-1",
            {"border-destructive animate-pulse": !online}
        )}>
            <div className="flex items-center space-x-2">
                <KafkaOnline resolveLanguageKey={resolveLanguageKey} />
                <div>
                    <p className={cn("text-sm font-medium", {"text-destructive": !online})}>{resolveLanguageKey("kafkaClusterTitle")}</p>
                    <KafkaBrokers resolveLanguageKey={resolveLanguageKey} />
                </div>
            </div>
            <div className="flex gap-1 flex-wrap max-w-full">
                <KafkaBrokerCount title={resolveLanguageKey("brokers")} resolveLanguageKey={resolveLanguageKey} />
                <KafkaTopicCount title={resolveLanguageKey("topics")} resolveLanguageKey={resolveLanguageKey} />
                <KafkaUptime title={resolveLanguageKey("uptime")} resolveLanguageKey={resolveLanguageKey}/>
            </div>
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverHealth/kafka.tsx")
)(KafkaResource)
