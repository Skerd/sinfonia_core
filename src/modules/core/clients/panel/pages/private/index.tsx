import { Outlet } from "react-router-dom";
import {AccessProvider} from "@coreModule/helpers/context/accessContext.tsx";
import {WebSocketProvider} from "@coreModule/helpers/context/webSocketContext.tsx";
import {SiteRoomProvider} from "@coreModule/helpers/context/siteRoomContext.tsx";
import {AuthenticationProvider} from "@coreModule/helpers/context/authenticationContext.tsx";
import {TableConfigProvider} from "@coreModule/helpers/context/tableConfigContext.tsx";
import {ViewConfigProvider} from "@coreModule/helpers/context/viewConfigContext.tsx";

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
