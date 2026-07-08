import {useSelector} from "react-redux";
import {compose} from "redux";
import {Database} from "lucide-react";
import {clsx} from "clsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {formatDurationInDaysHoursOrMinutes} from "@coreModule/helpers/general";
import {cn} from "@coreModule/components/lib/utils.ts";

function getSize(size: number | string): string {
    let bytes = typeof size === "string" ? Number(size) : size;

    if (!Number.isFinite(bytes) || bytes < 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    let unitIndex = 0;

    while (bytes >= 1024 && unitIndex < units.length - 1) {
        bytes /= 1024;
        unitIndex++;
    }

    return `${bytes.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} ${units[unitIndex]}`;
}

function MongoDb({title}:{title: string}){
    const {dbSize, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.mongoDb);
    if( !connected ){
        return <></>
    }
    return(<Badge variant="outline" className="text-xs font-medium">{title}: {getSize(dbSize.toString())}</Badge>)
}
function MongoStorage({title}:{title: string}){
    const {storageSize, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.mongoDb);
    if( !connected ){
        return <></>
    }
    return (<Badge variant="outline" className="text-xs font-medium">{title}: {getSize(storageSize)}</Badge>)
}
function MongoIndex({title}:{title: string}){
    const {indexSize, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.mongoDb);
    if( !connected ){
        return <></>
    }
    return(<Badge variant="outline" className="text-xs font-medium">{title}: {getSize(indexSize)}</Badge>)
}
function MongoUpTime({title, resolveLanguageKey}: {title: string, resolveLanguageKey: ResolveLanguageKey}){
    const {lastStart, connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.mongoDb);
    if( !connected ){
        return <></>
    }
    return(<Badge variant="outline" className="text-xs font-medium">{title}: {formatDurationInDaysHoursOrMinutes(Date.now() - lastStart, resolveLanguageKey)}</Badge>)
}

function MongoOnline({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.mongoDb);
    return(
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Database className={clsx("h-5 w-5 hover:cursor-pointer", connected ? "text-green-500" : "text-red-500")} />
                </TooltipTrigger>
                <TooltipContent>
                    <p>{resolveLanguageKey(connected ? "online" : "offline")}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
function MongoHost({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}){
    const {host, name} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.mongoDb);
    return (
        <p className="text-xs text-muted-foreground">{host || resolveLanguageKey("offline")}{name && ` • ${name}`}</p>
    )
}

type MongoResourceProps = WithLanguageType & {}

function MongoResource({
    resolveLanguageKey
}: MongoResourceProps){

    const {connected} = useSelector((state: RootState) => state.serverResources.serverHealth.services!.mongoDb);

    return (
        <>
            <div className={cn("flex flex-col md:flex-row md:items-center justify-between p-2 rounded-lg border bg-background space-y-1", {"border-destructive animate-pulse": !connected})}>
                <div className="flex items-center space-x-2">
                    <MongoOnline resolveLanguageKey={resolveLanguageKey} />
                    <div>
                        <p className={cn("text-sm font-medium", {"text-destructive": !connected})}>{resolveLanguageKey("mongoDbTitle")}</p>
                        <MongoHost resolveLanguageKey={resolveLanguageKey}/>
                    </div>
                </div>
                <div className="flex gap-1 flex-wrap max-w-full">
                    <MongoDb title={resolveLanguageKey("db")}/>
                    <MongoStorage title={resolveLanguageKey("storage")}/>
                    <MongoIndex title={resolveLanguageKey("index")} />
                    <MongoUpTime resolveLanguageKey={resolveLanguageKey} title={resolveLanguageKey("uptime")}/>
                </div>
            </div>
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverHealth/mongo.tsx")
)(MongoResource)
