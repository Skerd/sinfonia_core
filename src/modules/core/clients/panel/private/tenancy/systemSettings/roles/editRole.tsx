import {IconDeviceFloppy} from "@tabler/icons-react";
import {createGenericEditPage} from "@coreModule/components/entityPage/pages/createGenericEditPage.tsx";
import {editRoleFormSchema} from "armonia/src/modules/core/api/company/private/roles/editRole.form.validator.ts";
import type {EditRoleFormType} from "armonia/src/modules/core/api/company/private/roles/editRole.form.type.ts";
import type {CompanyRole} from "armonia/src/modules/core/api/company/private/roles/role.dto.ts";
import RolePermissionsSection from "./rolePermissionsSection.tsx";

export default createGenericEditPage<CompanyRole, EditRoleFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/roles/editRole.tsx",
    successPath: "/tenancy/systemSettings/roles",
    model: "roles",
    apiUrl: "/api/company/roles",
    schema: editRoleFormSchema,
    // The form keeps the enabled permissions as an `{id: true}` map; the matrix overrides the role's flags with it.
    // No `template`: initial values keep only writable fields, so the select starts on its "none" fallback.
    mapEntityData: (role) => {
        const permissions: Record<string, boolean> = {};
        for (const group of Object.values(role.permissions ?? {})) {
            for (const p of [...(group.self || []), ...(group.others || [])]) {
                if (p.active) permissions[p._id] = true;
            }
        }
        return {_id: role._id, name: role.name, description: role.description ?? "", permissions};
    },
    submitIcon: <IconDeviceFloppy />,
    renderChildren: (_form, role, {writeFields, loading}) => (
        <RolePermissionsSection editedRole={role} editable={!!writeFields.permissions} loading={loading} />
    ),
});
