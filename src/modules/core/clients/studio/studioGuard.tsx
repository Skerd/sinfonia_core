import {compose} from "redux";
import {Outlet} from "react-router-dom";
import withAuthentication from "@coreModule/helpers/hocs/withAuthentication.tsx";
import withAccess from "@coreModule/helpers/hocs/withAccess.tsx";
import withTableConfig from "@coreModule/helpers/hocs/withTableConfig.tsx";
import withViewConfig from "@coreModule/helpers/hocs/withViewConfig.tsx";

/**
 * Studio route guard. Same HOCs as the panel's `PrivatePage`, minus `withWebSocket`
 * and `withSiteRoom` — the Studio has no chat, notification or presence surface, and
 * opening those sockets from a developer tool would put it in every online-user list.
 *
 * The three config HOCs are what populate the contexts `useStudioCatalog` reads.
 */
function StudioGuard() {
    return <Outlet />;
}

export default compose(
    withAuthentication(),
    withTableConfig(),
    withViewConfig(),
    withAccess(),
)(StudioGuard);
