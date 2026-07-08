import {compose} from "redux";
import {useMemo, useRef, useState} from "react";
import {useSelector} from "react-redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import CardAndTableView from "@coreModule/components/custom/cardAndTableView.tsx";
import TitleWithCollapse from "@coreModule/components/custom/titleWithCollapse.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import LoginHistoryCard from "@coreModule/clients/panel/private/accountSettings/security/loginHistory/center/cardView/loginHistoryCard.tsx";
import LoginHistoryActionMenu from "@coreModule/clients/panel/private/accountSettings/security/loginHistory/center/actions/loginHistoryActionMenu.tsx";
import LoginHistorySheetView from "@coreModule/clients/panel/private/accountSettings/security/loginHistory/center/sheetView/loginHistorySheetView.tsx";
import type {DeletedData, TableForm, TableResponse} from "armonia/src/modules/core/types/shared.types.ts";
import type {LoginHistory} from "armonia/src/modules/core/api/user/private/loginHistory/loginHistory.dto.ts";
import type {LoginHistoryFormType} from "armonia/src/modules/core/api/user/private/loginHistory/loginHistory.form.type.ts";

type UserAccountSecurityLoginHistoryProps = WithLanguageType & {
    specificUserId?: string;
};

function UserAccountSecurityLoginHistory({specificUserId, resolveLanguageKey}: UserAccountSecurityLoginHistoryProps) {
    const {id: currentUserId, timezone} = useSelector((state: RootState) => state.authentication.user);
    const {read} = useAccess("loginHistories", !specificUserId ? "self" : "others");
    const targetUserId = specificUserId ?? currentUserId;
    const viewingSelf = !specificUserId;
    const listRef = useRef<{
        refetch: () => void;
        updateRow: (id: string | number, patch: Partial<LoginHistory>) => void;
    } | null>(null);
    const [rowMenuAction, setRowMenuAction] = useState("");
    const [sheetEntry, setSheetEntry] = useState<LoginHistory | null>(null);

    const rowMenu = (action: string, entry: LoginHistory) => {
        setRowMenuAction(action);
        setSheetEntry(entry);
    };

    const closeSheet = () => {
        setRowMenuAction("");
        setSheetEntry(null);
    };

    const closeAction = () => {
        setRowMenuAction("");
    };

    const onDelete = (data: DeletedData) => {
        if (!sheetEntry?._id) return;
        const patch = {
            deletedAt: data.deletedAt,
            deletedBy: data.deletedBy,
        };
        listRef.current?.updateRow(sheetEntry._id, patch);
        setSheetEntry((prev) => (prev ? {...prev, ...patch} : prev));
        setRowMenuAction("");
    };

    const onRestore = () => {
        if (!sheetEntry?._id) return;
        const patch = {
            deletedAt: undefined,
            deletedBy: undefined,
        };
        listRef.current?.updateRow(sheetEntry._id, patch);
        setSheetEntry((prev) => (prev ? {...prev, ...patch} : prev));
        setRowMenuAction("");
    };

    const extraParams = useMemo(
        () => ({
            userId: targetUserId,
            specificUser: specificUserId ?? undefined,
        }),
        [specificUserId, targetUserId]
    );

    if (!targetUserId || !read || !Object.keys(read).length) {
        return <HiddenElement />;
    }

    return (
        <TitleWithCollapse
            title={resolveLanguageKey("title")}
            description={resolveLanguageKey("description")}
            defaultOpen={false}
        >
            <CardAndTableView<TableResponse<LoginHistory>, TableForm & LoginHistoryFormType>
                url="/api/user/loginHistory"
                tableConfigKey="loginhistories"
                access="loginHistories"
                selfAccess={!specificUserId}
                tableConfigOptions={{
                    filterConfig: {
                        placeholder: resolveLanguageKey("searchPlaceholder"),
                        fields: resolveLanguageKey("fields"),
                    },
                }}
                extraParams={extraParams}
                configurations={{limit: 8}}
                listRef={listRef}
                containersClassName={{
                    cardViewClassName: "grid grid-cols-1 gap-2",
                    scrollRootClassName: "max-h-[min(400px,50vh)]",
                }}
                renderFunctions={{
                    cardRender: (row) => (
                        <LoginHistoryCard
                            entry={row}
                            resolveLanguageKey={resolveLanguageKey}
                            timezone={timezone}
                            viewingSelf={viewingSelf}
                            onMenuAction={(a) => {
                                rowMenu(a, row);
                            }}
                        />
                    ),
                    action: (row) => (
                        <LoginHistoryActionMenu
                            entry={row}
                            onAction={(a) => {
                                rowMenu(a, row);
                            }}
                        />
                    ),
                }}
            />

            {rowMenuAction === "view" && sheetEntry && (
                <LoginHistorySheetView
                    open={rowMenuAction === "view"}
                    onOpenChange={(open: boolean) => {
                        if (!open) {
                            closeSheet();
                        }
                    }}
                    entry={sheetEntry}
                    viewingSelf={viewingSelf}
                    onDelete={onDelete}
                    onRestore={onRestore}
                />
            )}
            {rowMenuAction === "delete" && sheetEntry && (
                <DeleteAction
                    accessModel="loginHistories"
                    deleteId={sheetEntry._id}
                    openAlert={rowMenuAction === "delete"}
                    name={sheetEntry.ip || sheetEntry.time}
                    confirmName={sheetEntry.ip || sheetEntry.time}
                    onSuccess={onDelete}
                    onCancel={closeAction}
                    url="/api/user/loginHistory"
                />
            )}
            {rowMenuAction === "restore" && sheetEntry && (
                <RestoreAction
                    accessModel="loginHistories"
                    deleteId={sheetEntry._id}
                    openAlert={rowMenuAction === "restore"}
                    name={sheetEntry.ip || sheetEntry.time}
                    confirmName={sheetEntry.ip || sheetEntry.time}
                    onSuccess={onRestore}
                    onCancel={closeAction}
                    url="/api/user/loginHistory/restore"
                />
            )}
        </TitleWithCollapse>
    );
}

export default compose(
    withHidden(),
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/loginHistory/index.tsx"),
    withDebug(true, true)
)(UserAccountSecurityLoginHistory);
