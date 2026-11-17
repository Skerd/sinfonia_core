import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {UserAddress} from "armonia/src/modules/core/api/user/private/userAddress/userAddress.dto.ts";
import type {DeleteResponse} from "armonia/src/modules/core/types/shared.types.ts";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import SheetNameTitle from "@coreModule/components/entityPage/sheet/sheetNameTitle.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import SetDefaultUserAddress from "@coreModule/clients/panel/private/accountSettings/addresses/center/actions/setDefaultUserAddress.tsx";
import SetDefaultUserAddressDialog from "@coreModule/clients/panel/private/accountSettings/addresses/center/dialogs/setDefaultUserAddressDialog.tsx";

const FORM_BASE = "/account/addresses";

export type UserAddressSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entity?: UserAddress;
    hideActions?: boolean;
    onDelete?: (response?: DeleteResponse) => void;
    onRestore?: () => void;
    fetchId?: string;
    onSheetRowPatched?: (row: Record<string, unknown>) => void;
    onDefaultChanged?: (addressId: string) => void;
};

function userAddressEditPath(entity: UserAddress) {
    const params = new URLSearchParams();
    params.set("userAddressId", entity._id);
    if (entity.firstName) params.set("userAddressTitle", encodeURIComponent(String(entity.firstName)));
    return `${FORM_BASE}/edit?${params.toString()}`;
}

function UserAddressSheetView({
    open,
    onOpenChange,
    entity: entityProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    fetchId,
    onSheetRowPatched,
    onDefaultChanged,
}: UserAddressSheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(entityProp || {_id: fetchId});
    const [action, setAction] = useState("");
    const access = useAccess("userAddresses");
    const viewConfig = useViewConfig("userAddresses", "sheet");

    useEffect(() => {
        if (!open) setAction("");
    }, [open]);

    useEffect(() => {
        if (!entityProp) return;
        setSheetData(entityProp);
    }, [entityProp]);

    const entityId = entityProp?._id ?? fetchId;

    if (!viewConfig) return null;
    if (!entityId) return null;

    const asEntity = sheetData as UserAddress;

    return (
        <>
            <SheetViewRenderer
                config={viewConfig}
                url="/api/user/userAddress/single"
                fetchId={fetchId}
                onDataFetched={(data) => {
                    setSheetData(data);
                }}
                data={sheetData}
                open={open}
                onOpenChange={onOpenChange}
                resolveLanguageKey={resolveLanguageKey}
                // Named by the recipient, typed in tone (UX-01, UX-02).
                headerTitle={<SheetNameTitle name={[asEntity.firstName, asEntity.lastName].filter(Boolean).join(" ")} typeLabel={String(resolveLanguageKey("sheetTypeLabel"))} />}
                headerDescription={
                    <>
                        <StatusBadge tableConfigKey="userAddresses" field="type" value={asEntity.type} label={String(resolveLanguageKey(`addressType.${asEntity.type}`))} />
                        {asEntity.isDefault ? <Badge variant="outline">{resolveLanguageKey("defaultAddress")}</Badge> : null}
                    </>
                }
                access={access}
                hideActions={hideActions}
                onDelete={onDelete}
                onRestore={onRestore}
                editPath={userAddressEditPath(asEntity)}
                onSheetRowPatched={onSheetRowPatched}
                actionMenuAllowCustomChildren
                actionMenuChildren={
                    <SetDefaultUserAddress entity={asEntity} onAction={(a: string) => setAction(a)} />
                }
            />
            {action === "setDefaultUserAddress" && (
                <SetDefaultUserAddressDialog
                    open={true}
                    onClose={() => setAction("")}
                    entity={asEntity}
                    onSuccess={() => {
                        setSheetData((prev) => ({...prev, isDefault: true}));
                        onSheetRowPatched?.({isDefault: true});
                        onDefaultChanged?.(asEntity._id);
                    }}
                />
            )}
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/addresses/center/sheetView/userAddressSheetView.tsx"),
    withDebug(true, true, "userAddresses"),
)(UserAddressSheetView);
