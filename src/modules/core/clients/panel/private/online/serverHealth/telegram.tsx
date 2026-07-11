import {compose} from "redux";
import {useSelector} from "react-redux";
import {clsx} from "clsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";
import {formatDurationInDaysHoursOrMinutes} from "@coreModule/helpers/general";
import {cn} from "@coreModule/components/lib/utils.ts";
import {IconTelegram} from "@coreModule/assets/brand-icons";

/** Telegram long-poll + linking runs as its own dedicated process (telegramServer). */
function useTelegram(){
    return useSelector((state: RootState) => state.serverResources.serverHealth.services?.telegram);
}

function TelegramMessages({title}:{title: string}){
    const telegram = useTelegram();
    if( !telegram?.connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {telegram.messages?.toLocaleString() || 0}</Badge>)
}
function TelegramFailed({title}:{title: string}){
    const telegram = useTelegram();
    if( !telegram?.connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {(telegram.failed || 0).toLocaleString()}</Badge>)
}
function TelegramAvgTime({title}:{title: string}){
    const telegram = useTelegram();
    if( !telegram?.connected ){
        return <></>
    }
    const samples = (telegram.messages || 0) + (telegram.failed || 0);
    return (
        <Badge variant="outline" className="text-xs font-medium">
            {title}: {samples ? `${(telegram.averageMs || 0).toFixed(2)}ms` : "-"}
        </Badge>
    )
}
function TelegramUptime({title, resolveLanguageKey}:{title: string, resolveLanguageKey: ResolveLanguageKey}){
    const telegram = useTelegram();
    if( !telegram?.connected ){
        return <></>
    }
    const lastStart = telegram.lastStart || telegram.lastHeartbeat || 0;
    if( !lastStart ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {formatDurationInDaysHoursOrMinutes(Date.now() - lastStart, resolveLanguageKey)}</Badge>)
}

function TelegramOnline({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const connected = !!useTelegram()?.connected;
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex hover:cursor-pointer">
                        <IconTelegram className={clsx("h-5 w-5", connected ? "text-green-500" : "text-red-500")} />
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{resolveLanguageKey(connected ? "online" : "offline")}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
function TelegramServerName({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const telegram = useTelegram();
    const {serverId, botName} = telegram || {};
    if (serverId) {
        const [host, ...rest] = serverId.split(":");
        const name = rest.join(":");
        return (
            <p className="text-xs text-muted-foreground">{host || resolveLanguageKey("offline")}{name && ` • ${name}`}</p>
        );
    }
    return (
        <p className="text-xs text-muted-foreground">{botName || resolveLanguageKey("offline")}</p>
    );
}

type TelegramResourceProps = WithLanguageType & {}

function TelegramResource({resolveLanguageKey}: TelegramResourceProps){

    const connected = !!useTelegram()?.connected;

    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between p-2 rounded-lg border bg-background space-y-1", {"border-destructive animate-pulse": !connected})}>
            <div className="flex items-center space-x-2">
                <TelegramOnline resolveLanguageKey={resolveLanguageKey} />
                <div>
                    <p className={cn("text-sm font-medium", {"text-destructive": !connected})}>{resolveLanguageKey("telegramServerTitle")}</p>
                    <TelegramServerName resolveLanguageKey={resolveLanguageKey} />
                </div>
            </div>
            <div className="flex gap-1 flex-wrap max-w-full">
                <TelegramMessages title={resolveLanguageKey("messages")} />
                <TelegramFailed title={resolveLanguageKey("failed")} />
                <TelegramAvgTime title={resolveLanguageKey("avgTime")} />
                <TelegramUptime title={resolveLanguageKey("uptime")} resolveLanguageKey={resolveLanguageKey}/>
            </div>
        </div>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverHealth/telegram.tsx")
)(TelegramResource)
