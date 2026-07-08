import {useEffect, useState} from "react";
import {useDispatch} from "react-redux";
import {compose} from "redux";
import {clientWebSocket} from "@coreModule/helpers/hocs/withWebSocket.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import EndpointPerformance from "@coreModule/clients/panel/private/online/serverStats/endpointPerformance.tsx";
import UserActivity from "@coreModule/clients/panel/private/online/serverStats/userActivity.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {ServerStatsDto} from "armonia/src/modules/core/api/auxiliary/private/serverStats/serverStats.dto.ts";
import {updateServerStats} from "@coreModule/helpers/redux/slices/serverResourceSlice.ts";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";

type ServerStatsProps = WithLanguageType & WithAxiosType<ServerStatsDto> & {}

function ServerStats({
    resolveLanguageKey,
    data,
    loading,
    error,
    onFilterChange
}: ServerStatsProps) {
    const dispatch = useDispatch();
    const webSocketConnected = useSelector((state: RootState) => state.ui.webSocketConnected);
    const [forceReload, setForceReload] = useState<number>(1);

    // Update Redux when API data is received
    useEffect(() => {
        if (!!data) {
            dispatch(updateServerStats(data));
        }
    }, [data]);

    useEffect(() => {
        if( !!webSocketConnected && clientWebSocket?.readyState === 1 ){
            clientWebSocket.send(JSON.stringify({code: "JOIN_ROOM", payload: ["serverStats"] }));
        }
        return () => {
            if( !!webSocketConnected && clientWebSocket?.readyState === 1 ){
                clientWebSocket.send(JSON.stringify({code: "LEAVE_ROOM", payload: ["serverStats"] }));
            }
        }
    }, [webSocketConnected]);

    useEffect(() => {
        onFilterChange({});
    }, [forceReload]);

    return (
       <div className="space-y-4">
           {
               loading ?
               <Loader title={resolveLanguageKey("waitingForPerformanceData")} />
               :
               <>
                   {
                       error ?
                       <SimpleError title={resolveLanguageKey("failTitle")} description={resolveLanguageKey("failTitleTooltip")} onClick={() => {setForceReload(forceReload + 1)}}/>
                       :
                       <div className="grid md:grid-cols-1 gap-4">
                           <EndpointPerformance />
                           <UserActivity />
                       </div>
                   }
               </>
           }
       </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverStats/index.tsx"),
    withAxios(
        {
            url: "/api/auxiliary/stats",
            method: "GET",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(ServerStats);
