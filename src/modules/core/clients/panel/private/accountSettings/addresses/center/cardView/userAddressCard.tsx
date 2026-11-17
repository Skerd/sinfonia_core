import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {UserAddress} from "armonia/src/modules/core/api/user/private/userAddress/userAddress.dto.ts";
import {IconMail, IconMapPin, IconPhone, IconStar, IconUser} from "@tabler/icons-react";
import UserAddressSheetView from "@coreModule/clients/panel/private/accountSettings/addresses/center/sheetView/userAddressSheetView.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import SetDefaultUserAddress from "@coreModule/clients/panel/private/accountSettings/addresses/center/actions/setDefaultUserAddress.tsx";
import SetDefaultUserAddressDialog from "@coreModule/clients/panel/private/accountSettings/addresses/center/dialogs/setDefaultUserAddressDialog.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import DisplayValue from "@coreModule/components/viewEngine/widgets/display/displayValue.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import type {ReactNode, RefObject} from "react";

const FORM_BASE = "/account/addresses";

function userAddressEditPath(entity: UserAddress) {
    const params = new URLSearchParams();
    params.set("userAddressId", entity._id);
    if (entity.firstName) params.set("userAddressTitle", encodeURIComponent(String(entity.firstName)));
    return `${FORM_BASE}/edit?${params.toString()}`;
}

function addressTitle(entity: UserAddress, read: unknown) {
    const firstName = accessFieldPathExists(read, "firstName") ? entity.firstName : "";
    const lastName = accessFieldPathExists(read, "lastName") ? entity.lastName : "";
    return [firstName, lastName].filter(Boolean).join(" ");
}

type UserAddressCardProps = WithLanguageType & {
    entity: UserAddress;
    fetchId?: string;
    hideActions?: boolean;
    /** Names whose address it is: for a shop's staff reading their buyers' books (eCommerce, D163). */
    showOwner?: boolean;
    onDelete?: (deleted?: UserAddress, response?: DeletedData) => void;
    onRestore?: () => void;
    sheetOnly?: boolean;
    onDefaultChanged?: (addressId: string) => void;
    innerRef?: RefObject<WithAxiosLifecycleRef<UserAddress> | null>;
};

function UserAddressCard({
    entity,
    resolveLanguageKey,
    fetchId,
    hideActions = false,
    showOwner = false,
    onDelete,
    onRestore,
    sheetOnly = false,
    onDefaultChanged,
    innerRef,
}: UserAddressCardProps) {
    return (
        <EntityCard
            resource="userAddresses"
            entity={entity}
            fetchId={fetchId}
            singleUrl="/api/user/userAddress/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            sheetOnly={sheetOnly}
            editPath={userAddressEditPath}
            Sheet={UserAddressSheetView}
            sheetEntityProp="entity"
            deleteUrl="/api/user/userAddress"
            restoreUrl="/api/user/userAddress/restore"
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            titlePath={["firstName", "lastName"]}
            innerRef={innerRef}
            sheetProps={({entity: row, setEntity}) => ({
                fetchId,
                onDefaultChanged: (addressId: string) => {
                    setEntity({...row, isDefault: true});
                    onDefaultChanged?.(addressId);
                },
                onSheetRowPatched: (patched: Partial<UserAddress>) => {
                    setEntity({...row, ...patched});
                },
            })}
            extraDialogs={({action, setAction, entity: row, setEntity}) => (
                <>
                    {action === "setDefaultUserAddress" && (
                        <SetDefaultUserAddressDialog
                            open
                            onClose={() => setAction("")}
                            entity={row}
                            onSuccess={() => {
                                setEntity({...row, isDefault: true});
                                onDefaultChanged?.(row._id);
                            }}
                        />
                    )}
                </>
            )}
        >
            {({entity: row, read, setAction}) => (
                <>
                    <EntityCard.Header
                        titlePath={["firstName", "lastName"]}
                        title={addressTitle(row, read)}
                        badgesBesideTitle
                        badges={
                            <>
                                {accessFieldPathExists(read, "type") ? (
                                    <StatusBadge tableConfigKey="userAddresses" field="type" value={row.type} label={String(resolveLanguageKey(`addressType.${row.type}`))} />
                                ) : null}
                                {accessFieldPathExists(read, "isDefault") && row.isDefault ? (
                                    <DisplayValue path="isDefault" value={resolveLanguageKey("defaultAddress")}>
                                        {(formatted: ReactNode) => (
                                            <span className="inline-flex items-center gap-1 text-3xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-warning/20 text-warning shrink-0">
                                                <IconStar className="w-3 h-3" />
                                                {formatted}
                                            </span>
                                        )}
                                    </DisplayValue>
                                ) : null}
                            </>
                        }
                    >
                        <SetDefaultUserAddress entity={row} onAction={setAction} />
                    </EntityCard.Header>
                    <EntityCard.Body>
                        {showOwner && row.user ? (
                            <EntityCardRow
                                icon={IconUser}
                                label={resolveLanguageKey("user")}
                                tooltip={resolveLanguageKey("user")}
                                path="user"
                                value={[row.user.name, row.user.surname].filter(Boolean).join(" ")}
                            />
                        ) : null}
                        {row.street || row.city?.name ? (
                            <EntityCardRow
                                icon={IconMapPin}
                                label={resolveLanguageKey("address")}
                                tooltip={resolveLanguageKey("address")}
                                path="street"
                                value={[row.street, [row.postalCode, row.city?.name].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                            />
                        ) : null}
                        {row.email ? (
                            <EntityCardRow
                                icon={IconMail}
                                label={resolveLanguageKey("email")}
                                tooltip={resolveLanguageKey("email")}
                                path="email"
                                type="email"
                                value={row.email}
                            />
                        ) : null}
                        {row.phone ? (
                            <EntityCardRow
                                icon={IconPhone}
                                label={resolveLanguageKey("phone")}
                                tooltip={resolveLanguageKey("phone")}
                                path="phone"
                                type="phoneNumber"
                                value={row.phone}
                            />
                        ) : null}
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/addresses/center/cardView/userAddressCard.tsx"),
    withDebug(true, true, "userAddresses"),
)(UserAddressCard);
