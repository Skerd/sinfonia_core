import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import {CompanyRole as CompanyRoleType} from "armonia/src/modules/core/api/company/private/roles/role.dto.ts";
import {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import PermissionsTable from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/permissionsTable.tsx";
import {translateDefaultRole} from "@coreModule/helpers/moduleContributions/loadRolesPermissionsContributions.ts";

export type RoleSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role: CompanyRoleType;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
};

/** `roleName` only titles the edit page, so it carries the translated name; the form edits the stored one. */
function roleEditPath(role: CompanyRoleType, name: string) {
    const params = new URLSearchParams();
    params.set("roleId", role._id);
    if (name) params.set("roleName", name);
    return `/tenancy/systemSettings/roles/edit?${params.toString()}`;
}

function RoleSheetView({
    open,
    onOpenChange,
    role,
    resolveLanguageKey,
    languageCode,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
}: RoleSheetViewOwnProps & WithLanguageType) {
    const access = useAccess("roles");
    const viewConfig = useViewConfig("roles", "sheet");

    if (!viewConfig) {
        return null;
    }
    // Display copy only: the sheet shows a default role in the user's language (D118).
    const shown = {...role, ...translateDefaultRole(role, languageCode)};

    return (
        <SheetViewRenderer
            config={viewConfig}
            data={shown}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            access={access}
            hideActions={hideActions}
            editPath={roleEditPath(role, shown.name)}
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
