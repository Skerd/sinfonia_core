import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import {CompanyRole as CompanyRoleType} from "armonia/src/modules/core/api/company/private/roles/role.dto.ts";
import {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import PermissionsTable from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/permissionsTable.tsx";

export type RoleSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role: CompanyRoleType;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
};

function roleEditPath(role: CompanyRoleType) {
    const params = new URLSearchParams();
    params.set("roleId", role._id);
    if (role.name) params.set("roleName", role.name);
    return `/tenancy/systemSettings/roles/edit?${params.toString()}`;
}

function RoleSheetView({
    open,
    onOpenChange,
    role,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
}: RoleSheetViewOwnProps & WithLanguageType) {
    const access = useAccess("roles");
    const viewConfig = useViewConfig("roles", "sheet");

    if (!viewConfig) {
        return null;
    }

    return (
        <SheetViewRenderer
            config={viewConfig}
            data={role}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            access={access}
            hideActions={hideActions}
            editPath={roleEditPath(role)}
            hideEdit={!role.canEdit}
            hideDelete={!role.canDelete}
            onDelete={onDelete}
            onRestore={onRestore}
        >
            <PermissionsTable permissions={role.permissions} />
        </SheetViewRenderer>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/roles/center/sheetView/roleSheetView.tsx"),
    withDebug(true, true, "roles")
)(RoleSheetView);
