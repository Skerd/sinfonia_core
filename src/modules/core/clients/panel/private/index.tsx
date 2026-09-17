import { Outlet } from "react-router-dom";
import {AccessProvider} from "@baseModule/helpers/context/accessContext.tsx";
import {WebSocketProvider} from "@baseModule/helpers/context/webSocketContext.tsx";
import {SiteRoomProvider} from "@baseModule/helpers/context/siteRoomContext.tsx";
import {AuthenticationProvider} from "@baseModule/helpers/context/authenticationContext.tsx";
import {TableConfigProvider} from "@baseModule/helpers/context/tableConfigContext.tsx";
import {ViewConfigProvider} from "@baseModule/helpers/context/viewConfigContext.tsx";

/**
 * Pathless layout route for the whole authenticated panel: mounts the provider
 * stack every private page assumes, then renders `<Outlet/>`. Not a page — the
 * sibling folders here are the pages.
 */
function PrivatePage() {
    return (
        <AuthenticationProvider setupStep={1}>
            <AccessProvider setupStep={2}>
                <WebSocketProvider setupStep={3}>
                    <SiteRoomProvider setupStep={4}>
                        <TableConfigProvider setupStep={5}>
                            <ViewConfigProvider setupStep={6}>
                                <Outlet />
                            </ViewConfigProvider>
                        </TableConfigProvider>
                    </SiteRoomProvider>
                </WebSocketProvider>
            </AccessProvider>
        </AuthenticationProvider>
    )
}

export default PrivatePage
