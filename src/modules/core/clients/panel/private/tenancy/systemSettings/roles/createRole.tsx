import {IconUserPlus} from "@tabler/icons-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import {createRoleFormSchema} from "armonia/src/modules/core/api/company/private/roles/createRole.form.validator.ts";
import type {CreateRolesFormType} from "armonia/src/modules/core/api/company/private/roles/createRoles.form.type.ts";
import RolePermissionsSection from "./rolePermissionsSection.tsx";

export default createGenericCreatePage<CreateRolesFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/roles/createRole.tsx",
    model: "roles",
    apiUrl: "/api/company/roles",
    schema: createRoleFormSchema,
    defaultValues: {name: "", description: "", template: "none", permissions: {}},
    submitIcon: <IconUserPlus />,
    successPath: "/tenancy/systemSettings/roles",
    renderChildren: () => <RolePermissionsSection editedRole={null} editable />,
});
