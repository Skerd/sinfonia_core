import {compose} from "redux";
import { Outlet } from "react-router-dom";
import withAuthentication from "@coreModule/helpers/hocs/withAuthentication.tsx";
import withAccess from "@coreModule/helpers/hocs/withAccess.tsx";
import withTableConfig from "@coreModule/helpers/hocs/withTableConfig.tsx";
import withViewConfig from "@coreModule/helpers/hocs/withViewConfig.tsx";
import withWebSocket from "@coreModule/helpers/hocs/withWebSocket.tsx";
import withSiteRoom from "@coreModule/helpers/hocs/withSiteRoom.tsx";

type PrivatePageProp = {}

function PrivatePage({}:PrivatePageProp) {
    return (<Outlet/>)
    // return (<></>)
}

export default compose(
    withAuthentication(),
    withWebSocket(),
    withSiteRoom(),
    withTableConfig(),
    withViewConfig(),
    withAccess(),

    // withImpersonation()
)
(PrivatePage)
