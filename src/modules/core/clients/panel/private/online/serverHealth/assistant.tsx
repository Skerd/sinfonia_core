import {compose} from "redux";
import {useSelector} from "react-redux";
import {clsx} from "clsx";
import {Bot} from "lucide-react";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";
import {formatDurationInDaysHoursOrMinutes} from "@coreModule/helpers/general";
import {cn} from "@coreModule/components/lib/utils.ts";

/** The AI-assistant responder runs as its own dedicated process (assistantServer). */
function useAssistant(){
    return useSelector((state: RootState) => state.serverResources.serverHealth.services?.assistant);
}

function AssistantJobs({title}:{title: string}){
    const assistant = useAssistant();
    if( !assistant?.connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {assistant.answered?.toLocaleString() || 0}</Badge>)
}
function AssistantFailedJobs({title}:{title: string}){
    const assistant = useAssistant();
    if( !assistant?.connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {assistant.failed?.toLocaleString() || 0}</Badge>)
}
function AssistantAvgJobTime({title}:{title: string}){
    const assistant = useAssistant();
    if( !assistant?.connected ){
        return <></>
    }
    return (
        <Badge variant="outline" className="text-xs font-medium">
            {title}: {(assistant.answered || 0) ? `${(assistant.averageMs || 0).toFixed(2)}ms` : "-"}
        </Badge>
    )
}
function AssistantUptime({title, resolveLanguageKey}:{title: string, resolveLanguageKey: ResolveLanguageKey}){
    const assistant = useAssistant();
    if( !assistant?.connected ){
        return <></>
    }
    const lastStart = assistant.lastStart || assistant.lastHeartbeat || 0;
    if( !lastStart ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {formatDurationInDaysHoursOrMinutes(Date.now() - lastStart, resolveLanguageKey)}</Badge>)
}

function AssistantOnline({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const connected = !!useAssistant()?.connected;
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Bot className={clsx("h-5 w-5 hover:cursor-pointer", connected ? "text-green-500" : "text-red-500")} />
                </TooltipTrigger>
                <TooltipContent>
                    <p>{resolveLanguageKey(connected ? "online" : "offline")}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
function AssistantServerName({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {serverId} = useAssistant() || {};
    const [host, ...rest] = (serverId || "").split(":");
    const name = rest.join(":");
    return (
        <p className="text-xs text-muted-foreground">{host || resolveLanguageKey("offline")}{name && ` • ${name}`}</p>
    )
}

type AssistantResourceProps = WithLanguageType & {}

function AssistantResource({resolveLanguageKey}: AssistantResourceProps){

    const connected = !!useAssistant()?.connected;

    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between p-2 rounded-lg border bg-background space-y-1", {"border-destructive animate-pulse": !connected})}>
            <div className="flex items-center space-x-2">
                <AssistantOnline resolveLanguageKey={resolveLanguageKey} />
                <div>
                    <p className={cn("text-sm font-medium", {"text-destructive": !connected})}>{resolveLanguageKey("assistantServerTitle")}</p>
                    <AssistantServerName resolveLanguageKey={resolveLanguageKey} />
                </div>
            </div>
            <div className="flex gap-1 flex-wrap max-w-full">
                <AssistantJobs title={resolveLanguageKey("jobs")} />
                <AssistantFailedJobs title={resolveLanguageKey("failed")} />
                <AssistantAvgJobTime title={resolveLanguageKey("avgTime")} />
                <AssistantUptime title={resolveLanguageKey("uptime")} resolveLanguageKey={resolveLanguageKey}/>
            </div>
        </div>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverHealth/assistant.tsx")
)(AssistantResource)
