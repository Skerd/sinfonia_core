import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {CompanyRole as CompanyRoleType} from "armonia/src/modules/core/api/company/private/roles/role.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {IconUserPlus} from "@tabler/icons-react";
import RoleCard from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/center/cardView/roleCard.tsx";
import RoleSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/center/sheetView/roleSheetView.tsx";
import EntityListPage from "@coreModule/components/entityPage/EntityListPage.tsx";

function roleEditPath(role: CompanyRoleType) {
    const params = new URLSearchParams();
    params.set("roleId", role._id);
    if (role.name) params.set("roleName", role.name);
    return `/tenancy/systemSettings/roles/edit?${params.toString()}`;
}

function Roles({resolveLanguageKey}: WithLanguageType) {
    return (
        <EntityListPage<CompanyRoleType>
            apiUrl="/api/company/roles"
            collectionName="roles"
            accessModel="roles"
            tableConfigKey="roles"
            createPath="/tenancy/systemSettings/roles/create"
            createIcon={<IconUserPlus />}
            buildEditPath={roleEditPath}
            resolveLanguageKey={resolveLanguageKey}
            cardViewClassName="grid grid-cols-1 gap-3 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 pe-1"
            rowActionMenu={{
                hideEdit: (role) => !role.canEdit,
                hideDelete: (role) => !role.canDelete,
            }}
            renderCard={(role, onDelete, onRestore) => (
                <RoleCard
                    role={role}
                    onDelete={(row: CompanyRoleType | undefined, response?: DeletedData) => onDelete(row, response)}
                    onRestore={() => onRestore(role)}
                />
            )}
            renderSheet={({entity, open, onOpenChange, onDelete, onRestore}) => (
                <RoleSheetView
                    role={entity}
                    open={open}
                    onOpenChange={onOpenChange}
                    onDelete={onDelete}
                    onRestore={onRestore}
                />
            )}
        />
    );
}

const RolesPage = compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/roles/index.tsx"),
    withDebug(true, true, "roles")
)(Roles);

export default RolesPage;
export {RolesPage};
