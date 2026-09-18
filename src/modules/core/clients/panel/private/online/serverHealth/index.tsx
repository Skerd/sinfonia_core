import {useEffect, useState} from "react";
import {useSelector, useDispatch} from "react-redux";
import {compose} from "redux";
import {CheckCircle, AlertCircle} from "lucide-react";
import {RootState} from "@baseModule/helpers/redux/store/generalStore.ts";
import {useWebSocketRoom} from "@baseModule/helpers/hooks/useWebSocketRoom.ts";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import MongoResource from "@coreModule/clients/panel/private/online/serverHealth/mongo.tsx";
import RedisResource from "@coreModule/clients/panel/private/online/serverHealth/redis.tsx";
import WebsocketResource from "@coreModule/clients/panel/private/online/serverHealth/websocket.tsx";
import KafkaResource from "@coreModule/clients/panel/private/online/serverHealth/kafka.tsx";
import KafkaServerResource from "@coreModule/clients/panel/private/online/serverHealth/kafkaServer.tsx";
import TelegramResource from "@coreModule/clients/panel/private/online/serverHealth/telegram.tsx";
import AssistantResource from "@coreModule/clients/panel/private/online/serverHealth/assistant.tsx";
import CronResource from "@coreModule/clients/panel/private/online/serverHealth/cron.tsx";
import ApiResource from "@coreModule/clients/panel/private/online/serverHealth/api.tsx";
import withAxios, {WithAxiosType} from "@baseModule/helpers/hocs/withAxios.tsx";
import {ServerHealthFormResponseType} from "armonia/src/modules/core/api/auxiliary/private/serverHealth/serverHealth.dto.ts";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import Loader from "@baseModule/components/custom/loader/loader.tsx";
import {updateServerHealth} from "@baseModule/helpers/redux/slices/serverResourceSlice.ts";
import {formatDate} from "@baseModule/helpers/general/dateTime.ts";

type ServerHealthProps = WithLanguageType & WithAxiosType<ServerHealthFormResponseType> & {}

function ServerHealth({
    resolveLanguageKey,
    data,
    loading,
    error,
    onFilterChange
}: ServerHealthProps) {

    const dispatch = useDispatch();
    const {timezone} = useSelector((state: RootState) => state.authentication.user);
    const health = useSelector((state: RootState) => state.serverResources.serverHealth);
    const [forceReload, setForceReload] = useState<number>(1);

    // Update Redux when API data is received
    useEffect(() => {
        if (!!data) {
            dispatch(updateServerHealth(data));
        }
    }, [data]);

    useWebSocketRoom("serverHealth");

    useEffect(() => {
        onFilterChange({});
    }, [forceReload]);

    return (
        <>
            <Card className="w-full shadow-md px-4 py-3 gap-4">
                <CardHeader className="p-0 gap-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold">{resolveLanguageKey("serverHealthTitle")}</CardTitle>
                        {
                            !loading && !error && !!data && !!health &&
                            <>
                                {
                                    health.status == 'ok' ?
                                        <Badge variant={"default"} className="px-3">
                                            <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                            {resolveLanguageKey("healthy")}
                                        </Badge>
                                        :
                                        <>
                                            {
                                                health.status === 'degraded' ?
                                                    <Badge variant={"destructive"} className="px-3">
                                                        <AlertCircle className="mr-1 h-3.5 w-3.5" />
                                                        {resolveLanguageKey("degraded")}
                                                    </Badge>
                                                    :
                                                    <Badge variant={"destructive"} className="px-3">
                                                        <AlertCircle className="mr-1 h-3.5 w-3.5" />
                                                        {resolveLanguageKey("error")}
                                                    </Badge>
                                            }
                                        </>
                                }
                            </>
                        }
                    </div>
                    {
                        !loading && !error && !!data &&
                        <CardDescription className="text-xs mt-1">
                            {resolveLanguageKey("version")} <span className="font-medium">{health.version}</span> • {resolveLanguageKey("lastUpdated")}: <span className="font-medium">{formatDate(new Date(health.timestamp), {timeZone: timezone})}</span>
                        </CardDescription>
                    }
                </CardHeader>
                <CardContent style={{padding: 0}}>
                    {
                        loading ?
                        <Loader title={resolveLanguageKey("waitingForHealthData")} />
                        :
                        <>
                            {
                                error ?
                                <SimpleError title={resolveLanguageKey("failTitle")} description={resolveLanguageKey("failTitleTooltip")} onClick={() => {setForceReload(forceReload + 1)}}/>
                                :
                                <div className="flex flex-col gap-y-5">
                                    <section className="flex flex-col gap-y-2">
                                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            {resolveLanguageKey("infrastructureServers")}
                                        </h3>
                                        <div className="flex flex-col gap-y-3">
                                            <MongoResource />
                                            <RedisResource />
                                            <KafkaResource />
                                        </div>
                                    </section>
                                    <section className="flex flex-col gap-y-2">
                                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            {resolveLanguageKey("serviceServers")}
                                        </h3>
                                        <div className="flex flex-col gap-y-3">
                                            <ApiResource />
                                            <WebsocketResource />
                                            <KafkaServerResource />
                                            <AssistantResource />
                                            <CronResource />
                                            <TelegramResource />
                                        </div>
                                    </section>
                                </div>
                            }
                        </>
                    }
                </CardContent>
            </Card>
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverHealth/index.tsx"),
    withAxios(
        {
            url: "/api/auxiliary/health",
            method: "GET",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(ServerHealth);
