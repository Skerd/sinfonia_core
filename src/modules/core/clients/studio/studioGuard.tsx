import {Outlet} from "react-router-dom";
import {AccessProvider} from "@coreModule/helpers/context/accessContext.tsx";
import {AuthenticationProvider} from "@coreModule/helpers/context/authenticationContext.tsx";
import {TableConfigProvider} from "@coreModule/helpers/context/tableConfigContext.tsx";
import {ViewConfigProvider} from "@coreModule/helpers/context/viewConfigContext.tsx";
import {STUDIO_SESSION_SETUP_TOTAL_STEPS} from "@coreModule/components/ui/sessionSetupScreen.tsx";

/**
 * Studio route guard. Same nest as the panel's `PrivatePage`, minus WebSocketProvider
 * and SiteRoomProvider — the Studio has no chat, notification or presence surface, and
 * opening those sockets from a developer tool would put it in every online-user list.
 */
function StudioGuard() {
    return (
        <AuthenticationProvider setupStep={1} setupTotal={STUDIO_SESSION_SETUP_TOTAL_STEPS}>
            <AccessProvider setupStep={2} setupTotal={STUDIO_SESSION_SETUP_TOTAL_STEPS}>
                <TableConfigProvider setupStep={3} setupTotal={STUDIO_SESSION_SETUP_TOTAL_STEPS}>
                    <ViewConfigProvider setupStep={4} setupTotal={STUDIO_SESSION_SETUP_TOTAL_STEPS}>
                        <Outlet />
                    </ViewConfigProvider>
                </TableConfigProvider>
            </AccessProvider>
        </AuthenticationProvider>
    );
}

export default StudioGuard;
