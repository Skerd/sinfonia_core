import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage, {EntityListCreateButton, EntityListHeader, type EntityListRefs} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import {IconPlus} from "@tabler/icons-react";
import type {UserAddress} from "armonia/src/modules/core/api/user/private/userAddress/userAddress.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import UserAddressCard from "./center/cardView/userAddressCard.tsx";
import UserAddressSheetView from "./center/sheetView/userAddressSheetView.tsx";
import SetDefaultUserAddress from "./center/actions/setDefaultUserAddress.tsx";
import SetDefaultUserAddressDialog from "./center/dialogs/setDefaultUserAddressDialog.tsx";

export const USER_ADDRESS_FORM_BASE = "/account/addresses";

export function userAddressEditPath(entity: {_id: string; firstName?: string}) {
    const params = new URLSearchParams();
    params.set("userAddressId", entity._id);
    if (entity.firstName) params.set("userAddressTitle", encodeURIComponent(String(entity.firstName)));
    return `${USER_ADDRESS_FORM_BASE}/edit?${params.toString()}`;
}

function applySetDefaultToList(
    listRef: EntityListRefs<UserAddress> | null | undefined,
    defaultAddress: UserAddress,
) {
    listRef?.current?.mapRows?.((row) => {
        if (row._id === defaultAddress._id) return {isDefault: true};
        if (row.isDefault && row.type === defaultAddress.type) return {isDefault: false};
        return;
    });
}

type AllUserAddressesProps = WithLanguageType;

/**
 * A person's address book (D163): the server only ever returns the signed-in person's own addresses, whichever site
 * they use. Only their own account settings show it; an admin viewing someone else's settings does not get this tab.
 */
function AllUserAddresses({resolveLanguageKey}: AllUserAddressesProps) {
    return (
        <EntityListPage<UserAddress>
            apiUrl="/api/user/userAddress"
            collectionName="userAddresses"
            accessModel="userAddresses"
            tableConfigKey="userAddresses"
            header={(ctx) => (
                <EntityListHeader ctx={ctx}>
                    <EntityListCreateButton
                        ctx={ctx}
                        path={`${USER_ADDRESS_FORM_BASE}/create`}
                        icon={<IconPlus />}
                        labelKey="createUserAddress"
                    />
                </EntityListHeader>
            )}
            rowActionMenu={{allowMenuForCustomChildren: true}}
            buildEditPath={userAddressEditPath}
            resolveLanguageKey={resolveLanguageKey}
            sheetLanguagePath="src/modules/core/clients/panel/private/accountSettings/addresses/center/sheetView/userAddressSheetView.tsx"
            cardViewClassName="grid grid-cols-1 gap-2 sm:grid-cols-2"
            renderActionMenuChildren={(_entity, bindRowAction) => (
                <SetDefaultUserAddress entity={_entity} onAction={bindRowAction} />
            )}
            renderSheetActionMenuChildren={(_entity, bindRowAction) => (
                <SetDefaultUserAddress entity={_entity} onAction={bindRowAction} />
            )}
            renderFloatingModals={({action, entity, resetAction, listRef}) => {
                if (action === "setDefaultUserAddress") {
                    return (
                        <SetDefaultUserAddressDialog
                            open={true}
                            onClose={resetAction}
                            entity={entity}
                            onSuccess={() => applySetDefaultToList(listRef, entity)}
                        />
                    );
                }
                return null;
            }}
            renderCard={(entity, onDelete, onRestore, listRef) => (
                <UserAddressCard
                    entity={entity}
                    onDelete={(row: UserAddress | undefined, response?: DeletedData) => onDelete(row, response)}
                    onRestore={() => onRestore(entity)}
                    onDefaultChanged={() => applySetDefaultToList(listRef, entity)}
                />
            )}
            renderSheet={({entity, open, onOpenChange, onDelete, onRestore, listRef}) => (
                <UserAddressSheetView
                    open={open}
                    onOpenChange={(opened: boolean) => {
                        if (!opened) onOpenChange();
                    }}
                    entity={entity}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    onDefaultChanged={() => applySetDefaultToList(listRef, entity)}
                    onSheetRowPatched={(row: Record<string, unknown>) => {
                        listRef.current?.updateRow?.(entity._id, row as Partial<UserAddress>);
                    }}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/addresses/index.tsx"),
    withDebug(true, true, "userAddresses"),
)(AllUserAddresses);
