import {compose} from "redux";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {LoginHistory} from "armonia/src/modules/core/api/user/private/loginHistory/loginHistory.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";

export type LoginHistorySheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entry: LoginHistory;
    /** Same as the list (`self` vs `others`). */
    viewingSelf: boolean;
    onDelete?: (data: DeletedData) => void;
    onRestore?: () => void;
    onActionMenuAction?: (action: string) => void;
};

function LoginHistorySheetView({
    open,
    onOpenChange,
    entry,
    viewingSelf,
    onDelete,
    onRestore,
    onActionMenuAction,
    resolveLanguageKey,
}: LoginHistorySheetViewOwnProps & WithLanguageType) {
    const access = useAccess("loginHistories", viewingSelf ? "self" : "others");
    const viewConfig = useViewConfig("loginhistories", "sheet");

    if (!viewConfig) {
        return null;
    }

    return (
        <SheetViewRenderer
            config={viewConfig}
            data={entry}
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
    withDebug(true, true)
)(LoginHistorySheetView);
