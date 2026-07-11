import {compose} from "redux";
import {useSelector} from "react-redux";
import {clsx} from "clsx";
import {Server} from "lucide-react";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";
import {formatDurationInDaysHoursOrMinutes} from "@coreModule/helpers/general";
import {cn} from "@coreModule/components/lib/utils.ts";

/** The API (Express) process runs as its own dedicated process (apiServer). */
function useApiServer(){
    return useSelector((state: RootState) => state.serverResources.serverHealth.services?.apiServer);
}

function ApiRequests({title}:{title: string}){
    const api = useApiServer();
    if( !api?.connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {api.completed?.toLocaleString() || 0}</Badge>)
}
function ApiFailed({title}:{title: string}){
    const api = useApiServer();
    if( !api?.connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {api.failed?.toLocaleString() || 0}</Badge>)
}
function ApiAvgTime({title}:{title: string}){
    const api = useApiServer();
    if( !api?.connected ){
        return <></>
    }
    return (
        <Badge variant="outline" className="text-xs font-medium">
            {title}: {(api.processed || 0) ? `${(api.averageMs || 0).toFixed(2)}ms` : "-"}
        </Badge>
    )
}
function ApiUptime({title, resolveLanguageKey}:{title: string, resolveLanguageKey: ResolveLanguageKey}){
    const api = useApiServer();
    if( !api?.connected ){
        return <></>
    }
    const lastStart = api.lastStart || api.lastHeartbeat || 0;
    if( !lastStart ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {formatDurationInDaysHoursOrMinutes(Date.now() - lastStart, resolveLanguageKey)}</Badge>)
}

function ApiOnline({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const connected = !!useApiServer()?.connected;
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Server className={clsx("h-5 w-5 hover:cursor-pointer", connected ? "text-green-500" : "text-red-500")} />
                </TooltipTrigger>
                <TooltipContent>
                    <p>{resolveLanguageKey(connected ? "online" : "offline")}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
function ApiServerName({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {serverId} = useApiServer() || {};
    const [host, ...rest] = (serverId || "").split(":");
    const name = rest.join(":");
    return (
        <p className="text-xs text-muted-foreground">{host || resolveLanguageKey("offline")}{name && ` • ${name}`}</p>
    )
}

type ApiResourceProps = WithLanguageType & {}

function ApiResource({resolveLanguageKey}: ApiResourceProps){

    const connected = !!useApiServer()?.connected;

    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between p-2 rounded-lg border bg-background space-y-1", {"border-destructive animate-pulse": !connected})}>
            <div className="flex items-center space-x-2">
                <ApiOnline resolveLanguageKey={resolveLanguageKey} />
                <div>
                    <p className={cn("text-sm font-medium", {"text-destructive": !connected})}>{resolveLanguageKey("apiServerTitle")}</p>
                    <ApiServerName resolveLanguageKey={resolveLanguageKey} />
                </div>
            </div>
            <div className="flex gap-1 flex-wrap max-w-full">
                <ApiRequests title={resolveLanguageKey("requests")} />
                <ApiFailed title={resolveLanguageKey("failed")} />
                <ApiAvgTime title={resolveLanguageKey("avgTime")} />
                <ApiUptime title={resolveLanguageKey("uptime")} resolveLanguageKey={resolveLanguageKey}/>
            </div>
        </div>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverHealth/api.tsx")
)(ApiResource)
