import {compose} from "redux";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {LoginHistory} from "armonia/src/modules/core/api/user/private/loginHistory/loginHistory.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";

export type LoginHistorySheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The entry; omitted when only `fetchId` is known (an entry shared in chat, D162), loaded through `/single`. */
    entry?: LoginHistory;
    fetchId?: string;
    /** Same as the list (`self` vs `others`); `others` when opened outside the list. */
    viewingSelf?: boolean;
    onDelete?: (data: DeletedData) => void;
    onRestore?: () => void;
    onActionMenuAction?: (action: string) => void;
};

function LoginHistorySheetView({
    open,
    onOpenChange,
    entry,
    fetchId,
    viewingSelf = false,
    onDelete,
    onRestore,
    onActionMenuAction,
    resolveLanguageKey,
}: LoginHistorySheetViewOwnProps & WithLanguageType) {
    const access = useAccess("loginHistories", viewingSelf ? "self" : "others");
    const viewConfig = useViewConfig("loginhistories", "sheet");
    const entryId = entry?._id ?? fetchId;

    if (!viewConfig || !entryId) {
        return null;
    }

    return (
        <SheetViewRenderer
            config={viewConfig}
            data={entry ?? {_id: entryId}}
            url={fetchId ? `${viewConfig.apiUrl}/single` : undefined}
            fetchId={fetchId}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            access={access}
            hideActions={false}
            hideEdit
            onDelete={onDelete}
            onRestore={onRestore}
            onActionMenuAction={onActionMenuAction}
            editPath=""
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/loginHistory/center/sheetView/loginHistorySheetView.tsx"),
    withDebug(true, true, "loginHistories")
)(LoginHistorySheetView);
