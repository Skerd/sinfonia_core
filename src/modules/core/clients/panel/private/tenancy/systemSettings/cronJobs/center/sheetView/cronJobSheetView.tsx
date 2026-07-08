import {compose} from "redux";
import withLanguage from "@coreModule/helpers/hocs/withLanguage.tsx";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";

function CronJobSheetView() {
    return (
        <SheetViewRenderer
            languagePath="src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/center/sheetView/cronJobSheetView.tsx"
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/center/sheetView/cronJobSheetView.tsx"),
)(CronJobSheetView);
