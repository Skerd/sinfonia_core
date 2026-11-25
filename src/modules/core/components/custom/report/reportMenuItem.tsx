import {compose} from "redux";
import {IconFlag} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";

/** The action a record's menu raises for "Report to the platform"; its owner then opens `ReportDialog` (D191). */
export const REPORT_TO_PLATFORM_ACTION = "reportToPlatform";

type Props = {
    /** The platform already hid the record: nothing left to report. */
    hidden?: boolean;
    onAction: (action: string) => void;
};

/**
 * "Report to the platform" in a record's panel menu (D191): staff never hide or delete a customer's words, they report
 * them, and the platform decides. The menu closes on click, so the menu's owner renders the dialog on the action.
 */
function ReportMenuItemInner({hidden, onAction, resolveLanguageKey}: Props & WithLanguageType) {
    if (hidden) return null;
    return (
        <DropdownMenuItem onClick={() => onAction(REPORT_TO_PLATFORM_ACTION)}>
            <IconFlag size={16} />
            {resolveLanguageKey("title")}
        </DropdownMenuItem>
    );
}

const ReportMenuItemConnected = compose(withLanguage("src/modules/core/components/custom/report/reportMenuItem.tsx"))(ReportMenuItemInner);

export default function ReportMenuItem(props: Props) {
    return <ReportMenuItemConnected {...props} />;
}
