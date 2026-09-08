import {useEffect, useMemo, useState, type ReactNode} from "react";
import {useSelector} from "react-redux";
import {useLocation} from "react-router-dom";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {clientWebSocket} from "@coreModule/helpers/context/webSocketContext.tsx";
import {resolveSiteRoomFromPath} from "@coreModule/helpers/websocket/resolveSiteRoom.ts";
import {SessionSetupScreen, SESSION_SETUP_TOTAL_STEPS} from "@coreModule/components/ui/sessionSetupScreen.tsx";

type SiteRoomProviderProps = {
    children: ReactNode;
    setupStep?: number;
    setupTotal?: number;
};

/**
 * Shows the setup step, sends JOIN_ROOM when the socket is up, and immediately continues.
 * Room membership keeps tracking pathname in the background.
 */
export function SiteRoomProvider({
    children,
    setupStep = 4,
    setupTotal = SESSION_SETUP_TOTAL_STEPS,
}: SiteRoomProviderProps) {
    const location = useLocation();
    const webSocketConnected = useSelector((state: RootState) => state.ui.webSocketConnected);
    const siteRoom = useMemo(
        () => resolveSiteRoomFromPath(location.pathname),
        [location.pathname],
    );
    const [showSetup, setShowSetup] = useState(true);

    useEffect(() => {
        setShowSetup(false);
    }, []);

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

    if( showSetup ){
        return (
            <SessionSetupScreen
                step={setupStep}
                total={setupTotal}
                phase="siteRoom"
                error={false}
                onRetry={() => {}}
            />
        )
    }

    return (children);
}
