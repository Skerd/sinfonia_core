import {compose} from "redux";
import {useSelector} from "react-redux";
import {MessageSquare} from "lucide-react";
import {clsx} from "clsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";
import {formatDurationInDaysHoursOrMinutes} from "@coreModule/helpers/general";
import {cn} from "@coreModule/components/lib/utils.ts";

function useWebsocket(){
    return useSelector((state: RootState) => state.serverResources.serverHealth.services!.websocket);
}

function WebsocketJobs({title}:{title: string}){
    const {messages, connected} = useWebsocket();
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {messages?.toLocaleString() || 0}</Badge>)
}
function WebsocketFailedJobs({title}:{title: string}){
    const {failedJobs, connected} = useWebsocket();
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {(failedJobs || 0).toLocaleString()}</Badge>)
}
function WebsocketAvgJobTime({title}:{title: string}){
    const {failedJobs, messages, totalTime, connected} = useWebsocket();
    if( !connected ){
        return <></>
    }
    const ops = (failedJobs || 0) + (messages || 0);
    return (
        <Badge variant="outline" className="text-xs font-medium">
            {title}: {ops ? `${((totalTime || 0) / ops).toFixed(2)}ms` : "-"}
        </Badge>
    )
}
function WebsocketUptime({title, resolveLanguageKey}:{title: string, resolveLanguageKey: ResolveLanguageKey}){
    const {lastStart, connected} = useWebsocket();
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {formatDurationInDaysHoursOrMinutes(Date.now() - lastStart, resolveLanguageKey)}</Badge>)
}

function WebsocketOnline({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {connected} = useWebsocket();
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <MessageSquare className={clsx("h-5 w-5 hover:cursor-pointer", connected ? "text-green-500" : "text-red-500")} />
                </TooltipTrigger>
                <TooltipContent>
                    <p>{resolveLanguageKey(connected ? "online" : "offline")}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
function WebsocketServerName({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {serverId, url} = useWebsocket();
    if (serverId) {
        const [host, ...rest] = serverId.split(":");
        const name = rest.join(":");
        return (
            <p className="text-xs text-muted-foreground">{host || resolveLanguageKey("offline")}{name && ` • ${name}`}</p>
        );
    }
    // Fallback for older payloads without serverId: parse ws://host:port.
    let host = "";
    let port = "";
    try {
        if (url) {
            const parsed = new URL(url);
            host = parsed.hostname;
            port = parsed.port;
        }
    } catch {
        host = url || "";
    }
    return (
        <p className="text-xs text-muted-foreground">{host || resolveLanguageKey("offline")}{port && ` • ${port}`}</p>
    );
}

type WebsocketResourceProps = WithLanguageType & {}

function WebsocketResource({resolveLanguageKey}: WebsocketResourceProps){

    const {connected} = useWebsocket();

    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between p-2 rounded-lg border bg-background space-y-1", {"border-destructive animate-pulse": !connected})}>
            <div className="flex items-center space-x-2">
                <WebsocketOnline resolveLanguageKey={resolveLanguageKey} />
                <div>
                    <p className={cn("text-sm font-medium", {"text-destructive": !connected})}>{resolveLanguageKey("websocketServerTitle")}</p>
                    <WebsocketServerName resolveLanguageKey={resolveLanguageKey} />
                </div>
            </div>
            <div className="flex gap-1 flex-wrap max-w-full">
                <WebsocketJobs title={resolveLanguageKey("jobs")} />
                <WebsocketFailedJobs title={resolveLanguageKey("failed")} />
                <WebsocketAvgJobTime title={resolveLanguageKey("avgTime")} />
                <WebsocketUptime title={resolveLanguageKey("uptime")} resolveLanguageKey={resolveLanguageKey}/>
            </div>
        </div>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverHealth/websocket.tsx")
)(WebsocketResource)
