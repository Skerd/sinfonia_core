import {useEffect, useMemo, useState, type ReactNode} from "react";
import {useLocation} from "react-router-dom";
import {resolveSiteRoomFromPath} from "@coreModule/helpers/websocket/resolveSiteRoom.ts";
import {useWebSocketRoom} from "@coreModule/helpers/websocket/useWebSocketRoom.ts";
import {SessionSetupScreen, SESSION_SETUP_TOTAL_STEPS} from "@coreModule/components/ui/sessionSetupScreen.tsx";

type SiteRoomProviderProps = {
    children: ReactNode;
    setupStep?: number;
    setupTotal?: number;
};

const noop = () => {};

/**
 * Shows the setup step, sends JOIN_ROOM when the socket is up, and immediately continues.
 * Room membership keeps tracking pathname in the background: moving to a page in another
 * room leaves the old one first; moving within the same room sends nothing.
 */
export function SiteRoomProvider({
    children,
    setupStep = 4,
    setupTotal = SESSION_SETUP_TOTAL_STEPS,
}: SiteRoomProviderProps) {
    const {pathname} = useLocation();
    const siteRoom = useMemo(() => resolveSiteRoomFromPath(pathname), [pathname]);
    const [showSetup, setShowSetup] = useState(true);

    useWebSocketRoom(siteRoom);

    useEffect(() => {
        setShowSetup(false);
    }, []);

    if (showSetup) {
        return (
            <SessionSetupScreen
                step={setupStep}
                total={setupTotal}
                phase="siteRoom"
                error={false}
                onRetry={noop}
            />
        );
    }

    return children;
}
