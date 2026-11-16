import {compose} from "redux";
import {useEffect, useState} from "react";
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
    /** The role, or a stub while `/single` loads it (`fetchId`, a role shared in chat: D162). */
    role?: CompanyRoleType;
    fetchId?: string;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
};

/** `roleName` only titles the edit page, so it carries the translated name; the form edits the stored one. */
function roleEditPath(roleId: string, name: string) {
    const params = new URLSearchParams();
    params.set("roleId", roleId);
    if (name) params.set("roleName", name);
    return `/tenancy/systemSettings/roles/edit?${params.toString()}`;
}

function RoleSheetView({
    open,
    onOpenChange,
    role: roleProp,
    fetchId,
    resolveLanguageKey,
    languageCode,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
}: RoleSheetViewOwnProps & WithLanguageType) {
    const access = useAccess("roles");
    const viewConfig = useViewConfig("roles", "sheet");
    const [role, setRole] = useState<CompanyRoleType | undefined>(roleProp);

    useEffect(() => {
        if (roleProp) setRole(roleProp);
    }, [roleProp]);

    const roleId = roleProp?._id ?? fetchId;
    if (!viewConfig || !roleId) {
        return null;
    }
    // Display copy only: the sheet shows a default role in the user's language (D118).
    const shown = role ? {...role, ...translateDefaultRole(role, languageCode)} : undefined;

    return (
        <SheetViewRenderer
            config={viewConfig}
            data={shown ?? {_id: roleId}}
            url={fetchId ? `${viewConfig.apiUrl}/single` : undefined}
            fetchId={fetchId}
            onDataFetched={(data: CompanyRoleType) => setRole(data)}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            access={access}
            hideActions={hideActions}
            editPath={roleEditPath(roleId, shown?.name ?? "")}
            hideEdit={!role?.canEdit}
            hideDelete={!role?.canDelete}
            onDelete={onDelete}
            onRestore={onRestore}
        >
            {role ? <PermissionsTable permissions={role.permissions} /> : null}
        </SheetViewRenderer>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/roles/center/sheetView/roleSheetView.tsx"),
    withDebug(true, true, "roles")
)(RoleSheetView);
