import {useCallback, useMemo, useState, type ComponentType, type ReactNode} from "react";
import {useFormContext, useWatch} from "react-hook-form";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {CreateRolesFormType} from "armonia/src/modules/core/api/company/private/roles/createRoles.form.type.ts";
import type {
    CompanyRole as CompanyRoleType,
    CompanyRolePermission,
    GroupedPermissions,
} from "armonia/src/modules/core/api/company/private/roles/role.dto.ts";
import type {PermissionDto} from "armonia/src/modules/core/api/company/private/roles/permission.dto.ts";
import type {TableResponse} from "armonia/src/modules/core/types/shared.types.ts";
import {FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {SimpleSelect} from "@coreModule/components/viewEngine/widgets/inputs/simpleSelect.tsx";
import PermissionsTable from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/permissionsTable.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import SimpleError from "@coreModule/components/custom/errors/errorViewWrapper.tsx";
import NoData from "@coreModule/components/custom/noData.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";

const PERMISSIONS_REQUEST = {method: "post" as const, url: "/api/company/roles/permissions", data: {}};
const PERMISSIONS_BODY = {offset: 0, limit: 5000};
const ROLES_REQUEST = {method: "post" as const, url: "/api/company/roles", data: {}};
const ROLES_BODY = {offset: 0, limit: 200};
const NO_TEMPLATE = "none";

/** The form fields this section drives; the create and edit role forms both carry them. */
type RolePermissionFields = Pick<CreateRolesFormType, "description" | "template" | "permissions">;

type RolePermissionsSectionProps = WithLanguageType & {
    /**
     * Edit: the role being edited, whose `permissions` already hold the whole catalog with its `active` flags.
     * Create: `null`, so the catalog loads here.
     */
    editedRole: CompanyRoleType | null;
    /** The role's own permissions can be changed (create, or edit with write access to `permissions`). */
    editable: boolean;
    /** The save is in flight (edit); create has no such signal and leaves it off. */
    loading?: boolean;
};

function activeRecord(permissions: GroupedPermissions): Record<string, boolean> {
    const record: Record<string, boolean> = {};
    for (const group of Object.values(permissions)) {
        for (const p of [...(group.self || []), ...(group.others || [])]) record[p._id] = p.active;
    }
    return record;
}

/**
 * The template select and the permission matrix of the create and edit role forms. The form's `permissions`
 * record overrides the `active` flags of the catalog; a template copies its role's flags into that record.
 */
function RolePermissionsSection({editedRole: role, editable, loading = false, resolveLanguageKey}: RolePermissionsSectionProps) {
    const form = useFormContext<RolePermissionFields>();
    const {read} = useAccess("roles");
    const permissions = useWatch({control: form.control, name: "permissions"});

    // Edit already has the catalog on the role, so the catalog request only runs on create (and on retry).
    const [catalogLoad, setCatalogLoad] = useState(role ? 0 : 1);
    const catalogRequest = useHttpRequest<PermissionDto>(PERMISSIONS_REQUEST, PERMISSIONS_BODY, catalogLoad);
    // A failed role list just offers no templates.
    const rolesRequest = useHttpRequest<TableResponse<CompanyRoleType>>(ROLES_REQUEST, ROLES_BODY, 1);

    const catalog: GroupedPermissions | null = role ? role.permissions : catalogRequest.data?.data ?? null;
    const templates = useMemo(
        () => (rolesRequest.data?.data ?? []).filter((r) => r._id !== role?._id),
        [rolesRequest.data, role?._id],
    );

    const resolvedPermissions = useMemo(() => {
        if (!catalog) return null;
        const record = permissions ?? {};
        const resolved: GroupedPermissions = {};
        for (const [key, group] of Object.entries(catalog)) {
            const resolve = (list: CompanyRolePermission[]) =>
                (list || []).map((p) => (p._id in record ? {...p, active: !!record[p._id]} : p));
            resolved[key] = {self: resolve(group.self), others: resolve(group.others)};
        }
        return resolved;
    }, [catalog, permissions]);

    const handlePermissionSelect = useCallback((permissionId: string, selected: boolean) => {
        form.setValue("permissions", {...form.getValues("permissions"), [permissionId]: selected}, {shouldDirty: true});
    }, [form]);

    const applyTemplate = (value: string) => {
        if (value === NO_TEMPLATE) {
            // Back to the catalog as loaded: nothing on create, the saved permissions on edit.
            form.setValue("permissions", {}, {shouldDirty: true});
            return;
        }
        const template = templates.find((r) => r._id === value);
        if (!template || !catalog) return;
        const catalogIds = activeRecord(catalog);
        const fromTemplate = activeRecord(template.permissions || {});
        const record: Record<string, boolean> = {};
        for (const id of Object.keys(fromTemplate)) {
            if (id in catalogIds) record[id] = fromTemplate[id];
        }
        form.setValue("permissions", {...form.getValues("permissions"), ...record}, {shouldDirty: true});
        if (template.description && !form.getValues("description")) {
            form.setValue("description", template.description, {shouldDirty: true});
        }
    };

    const templateOptions = useMemo(() => [
        ...templates.map((r) => ({value: r._id, label: r.name})),
        {value: NO_TEMPLATE, label: resolveLanguageKey("none")},
    ], [templates, resolveLanguageKey]);

    let matrix: ReactNode;
    if (role && !read?.permissions) {
        matrix = null;
    } else if (!role && catalogRequest.loading) {
        matrix = <Loader />;
    } else if (!role && catalogRequest.error) {
        matrix = (
            <SimpleError
                title={resolveLanguageKey("failTitle")}
                description={resolveLanguageKey("failDescription")}
                tooltipDescription={resolveLanguageKey("failTooltip")}
                onClick={() => setCatalogLoad((v) => v + 1)}
            />
        );
    } else if (!resolvedPermissions) {
        matrix = <NoData title={resolveLanguageKey("noData")} />;
    } else {
        matrix = (
            <PermissionsTable
                permissions={resolvedPermissions}
                editable={editable}
                parentLoading={loading}
                onPermissionSelect={handlePermissionSelect}
                forNewRole={!role}
            />
        );
    }

    return (
        <>
            {editable && (
                <FormField
                    control={form.control}
                    name="template"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>{resolveLanguageKey("templateLabel")}</FormLabel>
                            <FormControl>
                                <SimpleSelect
                                    options={templateOptions}
                                    value={field.value ?? NO_TEMPLATE}
                                    onValueChange={(value: string) => {
                                        field.onChange(value);
                                        applyTemplate(value);
                                    }}
                                    placeholder={resolveLanguageKey("templatePlaceholder")}
                                    disabled={loading || rolesRequest.loading || !catalog}
                                    className="grow w-full"
                                />
                            </FormControl>
                            <FormDescription>{resolveLanguageKey("templateDescription")}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            <div className="flex-full">{matrix}</div>
        </>
    );
}

export default withLanguage(
    "src/modules/core/clients/panel/private/tenancy/systemSettings/roles/rolePermissionsSection.tsx",
)(RolePermissionsSection) as ComponentType<Omit<RolePermissionsSectionProps, keyof WithLanguageType>>;
