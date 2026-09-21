import {compose} from "redux";
import {useMemo} from "react";
import {useSelector} from "react-redux";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@baseModule/helpers/hooks/useAccess.ts";
import {hasCardRead} from "@baseModule/components/entityPage/list/card/entityCard.tsx";
import {RootState} from "@baseModule/helpers/redux/store/generalStore.ts";
import EntityListPage from "@baseModule/components/entityPage/pages/entityListPage.tsx";
import TitleWithCollapse from "@baseModule/components/custom/titleWithCollapse.tsx";
import HiddenElement from "@baseModule/components/custom/hiddenElement.tsx";
import LoginHistoryCard from "@coreModule/clients/panel/private/accountSettings/security/loginHistory/center/cardView/loginHistoryCard.tsx";
import LoginHistorySheetView from "@coreModule/clients/panel/private/accountSettings/security/loginHistory/center/sheetView/loginHistorySheetView.tsx";
import type {LoginHistory} from "armonia/src/modules/core/api/user/private/loginHistory/loginHistory.dto.ts";

type UserAccountSecurityLoginHistoryProps = WithLanguageType & {
    specificUserId?: string;
};

function UserAccountSecurityLoginHistory({specificUserId, resolveLanguageKey}: UserAccountSecurityLoginHistoryProps) {
    const {id: currentUserId, timezone} = useSelector((state: RootState) => state.authentication.user);
    const {read} = useAccess("loginHistories", !specificUserId ? "self" : "others");
    const targetUserId = specificUserId ?? currentUserId;
    const viewingSelf = !specificUserId;

    const extraParams = useMemo(
        () => ({
            userId: targetUserId,
            specificUser: specificUserId ?? undefined,
        }),
        [specificUserId, targetUserId]
    );

    if (!targetUserId || !hasCardRead(read)) {
        return <HiddenElement />;
    }

    return (
        <TitleWithCollapse
            title={resolveLanguageKey("title")}
            description={resolveLanguageKey("description")}
            defaultOpen={false}
        >
            <EntityListPage<LoginHistory>
                apiUrl="/api/user/loginHistory"
                collectionName="loginhistories"
                accessModel="loginHistories"
                tableConfigKey="loginhistories"
                selfAccess={viewingSelf}
                buildEditPath={() => ""}
                resolveLanguageKey={resolveLanguageKey}
                hideHeader
                cardViewClassName="grid grid-cols-1 gap-2"
                scrollRootClassName="max-h-[min(400px,50vh)]"
                configurations={{limit: 8}}
                extraParams={extraParams}
                rowActionMenu={{hideEdit: true}}
                renderCard={(entry, onDelete, onRestore) => (
                    <LoginHistoryCard
                        entry={entry}
                        resolveLanguageKey={resolveLanguageKey}
                        timezone={timezone}
                        viewingSelf={viewingSelf}
                        onDelete={(row, response) => onDelete(row, response)}
                        onRestore={() => onRestore(entry)}
                    />
                )}
                renderSheet={({entity, open, onOpenChange, onDelete, onRestore}) => (
                    <LoginHistorySheetView
                        entry={entity}
                        viewingSelf={viewingSelf}
                        open={open}
                        onOpenChange={onOpenChange}
                        onDelete={onDelete}
                        onRestore={onRestore}
                    />
                )}
            />
        </TitleWithCollapse>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/loginHistory/index.tsx"),
    withDebug(true, true, "loginHistories")
)(UserAccountSecurityLoginHistory);
