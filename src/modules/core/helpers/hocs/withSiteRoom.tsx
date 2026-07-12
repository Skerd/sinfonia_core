import {useEffect, useMemo} from "react";
import {useSelector} from "react-redux";
import {useLocation} from "react-router-dom";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {clientWebSocket} from "@coreModule/helpers/hocs/withWebSocket.tsx";
import {resolveSiteRoomFromPath} from "@coreModule/helpers/websocket/resolveSiteRoom.ts";

export type WithSiteRoomType = {
    /** Current panel site-room id, or null on home / unsupported paths. */
    siteRoom: string | null;
};

/**
 * Joins / leaves the websocket room that matches the current panel site.
 *
 * Example: `/eCommerce/bookings` → JOIN_ROOM `bookings`; navigating away LEAVE_ROOM.
 *
 * Must be composed after `withWebSocket()` so the shared socket exists.
 * Room membership tracks `pathname` + connection status; reconnect re-joins.
 */
const withSiteRoom = () => (WrappedComponent: any) => {
    function EnhancedComponent_WithSiteRoom(props: any) {
        const location = useLocation();
        const webSocketConnected = useSelector((state: RootState) => state.ui.webSocketConnected);
        const siteRoom = useMemo(
            () => resolveSiteRoomFromPath(location.pathname),
            [location.pathname],
        );

        useEffect(() => {
            if (!siteRoom || !webSocketConnected || clientWebSocket?.readyState !== 1) {
                return;
            }

            clientWebSocket.send(JSON.stringify({code: "JOIN_ROOM", payload: [siteRoom]}));
            return () => {
                if (clientWebSocket?.readyState === 1) {
                    clientWebSocket.send(JSON.stringify({code: "LEAVE_ROOM", payload: [siteRoom]}));
                }
            };
        }, [webSocketConnected, siteRoom]);

        return (
            <WrappedComponent {...props} siteRoom={siteRoom}/>
        );
    }

    return EnhancedComponent_WithSiteRoom;
};

export default withSiteRoom;
