import {compose} from "redux";
import {useSelector} from "react-redux";
import {MessageSquare} from "lucide-react";
import {clsx} from "clsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {formatDurationInDaysHoursOrMinutes} from "@coreModule/helpers/general";
import {cn} from "@coreModule/components/lib/utils.ts";

function WebsocketMessages({title}:{title: string}){
    const {messages, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.websocket);
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {messages?.toLocaleString()}</Badge>)
}
function WebsocketUsers({title}:{title: string}){
    const {users, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.websocket);
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {users?.toLocaleString()}</Badge>)
}
function WebsocketRooms({title}:{title: string}){
    const {rooms, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.websocket);
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {rooms?.length.toLocaleString() || "-"}</Badge>)
}
function WebsocketUptime({title, resolveLanguageKey}:{title: string, resolveLanguageKey: ResolveLanguageKey}){
    const {lastStart, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.websocket);
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {formatDurationInDaysHoursOrMinutes(Date.now() - lastStart, resolveLanguageKey)}</Badge>)
}

function WebsocketOnline({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.websocket);
    return (
        <TooltipDisplayer tooltip={resolveLanguageKey(connected ? "online" : "offline")}>
            <MessageSquare className={clsx("h-5 w-5 hover:cursor-pointer", connected ? "text-green-500" : "text-red-500")} />
        </TooltipDisplayer>
    )
}
function WebsocketReady({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.websocket);
    return (
        <p className="text-xs text-muted-foreground">
            {connected ? resolveLanguageKey("online") : resolveLanguageKey("offline")}
        </p>
    )
}

type WebsocketResourceProps = WithLanguageType & {}

function WebsocketResource({resolveLanguageKey}: WebsocketResourceProps){

    const {connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.websocket);

    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between p-2 rounded-lg border bg-background space-y-1", {"border-destructive animate-pulse": !connected})}>
            <div className="flex items-center space-x-2">
                <WebsocketOnline resolveLanguageKey={resolveLanguageKey} />
                <div>
                    <p className={cn("text-sm font-medium", {"text-destructive": !connected})}>{resolveLanguageKey("websocketServerTitle")}</p>
                    <WebsocketReady resolveLanguageKey={resolveLanguageKey} />
                </div>
            </div>
            <div className="flex gap-1 flex-wrap max-w-full">
                <WebsocketMessages title={resolveLanguageKey("messages")} />
                <WebsocketUsers title={resolveLanguageKey("users")} />
                <WebsocketRooms title={resolveLanguageKey("rooms")} />
                <WebsocketUptime title={resolveLanguageKey("uptime")} resolveLanguageKey={resolveLanguageKey}/>
            </div>
        </div>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverHealth/websocket.tsx")
)(WebsocketResource)
