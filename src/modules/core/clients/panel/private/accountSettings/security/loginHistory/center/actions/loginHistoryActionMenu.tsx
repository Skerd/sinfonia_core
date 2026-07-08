import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import type {LoginHistory} from "armonia/src/modules/core/api/user/private/loginHistory/loginHistory.dto.ts";

export type LoginHistoryActionMenuProps = {
    entry: LoginHistory;
    onAction: (action: string) => void;
    alwaysShowDropDownMenuTrigger?: boolean;
};

/**
 * View/delete/restore come from the shared {@link ActionMenu}; edit remains disabled for audit rows.
 */
export default function LoginHistoryActionMenu({entry, onAction, alwaysShowDropDownMenuTrigger}: LoginHistoryActionMenuProps) {
    return (
        <ActionMenu
            accessModel="loginHistories"
            deletedData={entry}
            onAction={onAction}
            editPath=""
            hideEdit
            alwaysShowDropDownMenuTrigger={alwaysShowDropDownMenuTrigger}
        />
    );
}
