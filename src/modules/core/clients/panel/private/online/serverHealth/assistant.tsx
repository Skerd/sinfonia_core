import {compose} from "redux";
import {useSelector} from "react-redux";
import {clsx} from "clsx";
import {Bot} from "lucide-react";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

/** The AI-assistant responder runs as its own dedicated process (assistantServer). */
function useAssistant(){
    return useSelector((state: RootState) => state.serverResources.serverHealth.services?.assistant);
}

function AssistantOnline({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const connected = !!useAssistant()?.connected;
    return (
        <TooltipDisplayer tooltip={resolveLanguageKey(connected ? "online" : "offline")}>
            <Bot className={clsx("h-5 w-5 hover:cursor-pointer", connected ? "text-green-500" : "text-red-500")} />
        </TooltipDisplayer>
    )
}
function AssistantServerName({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const assistant = useAssistant();
    return (
        <p className="text-xs text-muted-foreground">
            {assistant?.connected ? (assistant?.serverId || resolveLanguageKey("online")) : resolveLanguageKey("offline")}
        </p>
    )
}
function AssistantAnswered({title}:{title: string}){
    const assistant = useAssistant();
    if( !assistant?.connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {assistant.answered?.toLocaleString() || 0}</Badge>)
}
function AssistantFailed({title}:{title: string}){
    const assistant = useAssistant();
    if( !assistant?.connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {assistant.failed?.toLocaleString() || 0}</Badge>)
}
function AssistantAverage({title}:{title: string}){
    const assistant = useAssistant();
    if( !assistant?.connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {assistant.averageMs?.toLocaleString() || 0}</Badge>)
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
                <AssistantAnswered title={resolveLanguageKey("answered")} />
                <AssistantFailed title={resolveLanguageKey("failed")} />
                <AssistantAverage title={resolveLanguageKey("averageMs")} />
            </div>
        </div>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverHealth/assistant.tsx")
)(AssistantResource)
