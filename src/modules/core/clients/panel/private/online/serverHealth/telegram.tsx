import {compose} from "redux";
import {useSelector} from "react-redux";
import {clsx} from "clsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {IconTelegram} from "@coreModule/assets/brand-icons";

function TelegramOnline({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.telegram);
    return (
        <TooltipDisplayer tooltip={resolveLanguageKey(connected ? "online" : "offline")}>
            <IconTelegram className={clsx("h-5 w-5 hover:cursor-pointer", connected ? "text-green-500" : "text-red-500")} />
        </TooltipDisplayer>
    )
}
function TelegramBotName({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {botName} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.telegram);
    return (
        <p className="text-xs text-muted-foreground">
            {botName || resolveLanguageKey("offline")}
        </p>
    )
}
function TelegramConnectedClients({title}:{title: string}){
    const {connected, users} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.telegram);
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {users.toLocaleString() || 0}</Badge>)
}
function TelegramMessages({title}:{title: string}){
    const {connected, messages} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.telegram);
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {messages?.toLocaleString() || 0}</Badge>)
}

type TelegramResourceProps = WithLanguageType & {}

function TelegramResource({resolveLanguageKey}: TelegramResourceProps){

    const {connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.telegram);

    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between p-2 rounded-lg border bg-background space-y-1", {"border-destructive animate-pulse": !connected})}>
            <div className="flex items-center space-x-2">
                <TelegramOnline resolveLanguageKey={resolveLanguageKey} />
                <div>
                    <p className={cn("text-sm font-medium", {"text-destructive": !connected})}>{resolveLanguageKey("telegramServerTitle")}</p>
                    <TelegramBotName resolveLanguageKey={resolveLanguageKey} />
                </div>
            </div>
            <div className="flex gap-1 flex-wrap max-w-full">
                <TelegramConnectedClients title={resolveLanguageKey("connectedClients")} />
                <TelegramMessages title={resolveLanguageKey("messages")} />
            </div>
        </div>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverHealth/telegram.tsx")
)(TelegramResource)
