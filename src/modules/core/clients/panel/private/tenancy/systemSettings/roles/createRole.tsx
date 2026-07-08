import {compose} from "redux";
import {LoaderCircle} from "lucide-react";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {useCallback, useEffect, useImperativeHandle, useMemo, useState} from "react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import Header from "@coreModule/components/custom/header.tsx";
import {Resolver, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useNavigate} from "react-router-dom";
import {createRoleFormSchema} from "armonia/src/modules/core/api/company/private/roles/createRole.form.validator.ts";
import {CreateRolesFormType} from "armonia/src/modules/core/api/company/private/roles/createRoles.form.type.ts";
import {
    CompanyRolePermission as CompanyRolePermissionType,
    CompanyRole as CompanyRoleType,
    GroupedPermissions
} from "armonia/src/modules/core/api/company/private/roles/role.dto.ts";
import {PermissionDto} from "armonia/src/modules/core/api/company/private/roles/permission.dto.ts";
import {ActionMessage, TableResponse} from "armonia/src/modules/core/types/shared.types.ts";
import PermissionsTable from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/permissionsTable.tsx";
import {SimpleSelect} from "@coreModule/components/custom/simpleSelect";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import NoData from "@coreModule/components/custom/noData.tsx";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import {z} from "zod";
import {IconUserPlus} from "@tabler/icons-react";

type CreateRoleProps = WithLanguageType & WithAxiosType<ActionMessage, CreateRolesFormType> & {}

function CreateRole({
    resolveLanguageKey,
    loading,
    languageCode,
    innerRef,
    onFormDataChange
}: CreateRoleProps) {

    const navigate = useNavigate();
    const {create} = useAccess("roles");

    const [permissionsLoading, setPermissionsLoading] = useState(true);
    const [permissionsError, setPermissionsError] = useState(false);
    const [currentPermissions, setCurrentPermissions] = useState<GroupedPermissions>({});
    const [permissionsData, setPermissionsData] = useState<PermissionDto["data"] | null>(null);

    const [allRolesLoading, setAllRolesLoading] = useState(true);
    const [allRoles, setAllRoles] = useState<CompanyRoleType[]>([]);

    const [forceReload, setForceReload] = useState(1);

    const baseFormSchema = createRoleFormSchema(languageCode, resolveLanguageKey("form"));
    type FormValues = z.infer<typeof baseFormSchema>;

    const form = useForm<FormValues>({
        resolver: zodResolver(baseFormSchema) as Resolver<FormValues>,
        defaultValues: {
            name: "",
            template: "none",
            permissions: {}
        }
    });

    const permissions = form.watch("permissions");

    const resolvedPermissions = useMemo(() => {
        const permsRecord = permissions || {};
        const resolved = JSON.parse(JSON.stringify(currentPermissions)) as GroupedPermissions;
        for (const group of Object.values(resolved)) {
            for (const p of [...(group.self || []), ...(group.others || [])]) {
                if (p._id in permsRecord) p.active = !!permsRecord[p._id];
            }
        }
        return resolved;
    }, [currentPermissions, permissions]);

    const handlePermissionSelect = useCallback((permissionId: string, selected: boolean) => {
        const currentFormPermissions = form.getValues("permissions") || {};
        form.setValue("permissions", {
            ...currentFormPermissions,
            [permissionId]: selected
        }, {shouldDirty: true});
    }, [form]);

    function updateCurrentPermissionsBasedOnArrayOfPermissions(perms: CompanyRolePermissionType[]) {
        const tempPermissions: GroupedPermissions = JSON.parse(JSON.stringify(currentPermissions));
        for (const key of Object.keys(tempPermissions)) {
            const curr = tempPermissions[key];
            for (const permission of [...(curr.self || []), ...(curr.others || [])]) {
                const found = perms.find((p) => p._id === permission._id);
                if (found) {
                    permission.active = found.active;
                    handlePermissionSelect(found._id, found.active);
                }
            }
        }
        setCurrentPermissions(tempPermissions);
    }

    const templateOptions = useMemo(() => [
        ...(allRoles?.map((r) => ({ value: r._id, label: r.name })) ?? []), { value: "none", label: resolveLanguageKey("none") }
    ], [allRoles]);

    const memoizedPermissionsTable = useMemo(() => (
        <PermissionsTable
            permissions={resolvedPermissions}
            editable={true}
            parentLoading={loading || permissionsLoading}
            onPermissionSelect={handlePermissionSelect}
            forNewRole={true}
        />
    ), [resolvedPermissions, loading, permissionsLoading, handlePermissionSelect]);

    function onSubmit(data: FormValues) {
        onFormDataChange({
            name: data.name,
            permissions: permissions || {}
        });
    }

    useImperativeHandle(innerRef, () => ({
        success: () => {
            form.reset();
            navigate("/tenancy/systemSettings/roles");
        }
    }));

    useEffect(() => {
        apiClient.post<PermissionDto>("/api/company/roles/permissions", {offset: 0, limit: 5000})
        .then((res) => {
            setPermissionsData(res.data?.data ?? null);
            setCurrentPermissions(res.data?.data ?? []);
            setPermissionsLoading(false);
        })
        .catch(() => {
            setPermissionsError(true);
            setPermissionsLoading(false);
        });
    }, [forceReload]);

    useEffect(() => {
        apiClient.post<TableResponse<CompanyRoleType>>("/api/company/roles", {offset: 0, limit: 200})
        .then((res) => {
            setAllRoles(res.data?.data || []);
            setAllRolesLoading(false);
        })
        .catch(() => setAllRolesLoading(false));
    }, []);

    if (!create) {
        return <HiddenElement />;
    }

    const isLoading = permissionsLoading || allRolesLoading;

    return (
        <div className="flex-full gap-4">
            <Header title={resolveLanguageKey("title")} description={resolveLanguageKey("description")} />
            <div className="flex-full px-2 pb-[100px] space-y-4">
                {
                    permissionsLoading ?
                    <Loader />
                    : permissionsError ?
                    <SimpleError
                        title={resolveLanguageKey("failTitle")}
                        description={resolveLanguageKey("failDescription")}
                        tooltipDescription={resolveLanguageKey("failTooltip")}
                        onClick={() => setForceReload((v) => v + 1)}
                    />
                    : !permissionsData ?
                    <NoData title={resolveLanguageKey("noData")} />
                    :
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                            <div className="flex space-x-2 pe-2">
                                <div className="flex grow">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({field}) => (
                                            <FormItem className="w-full">
                                                <FormLabel>{resolveLanguageKey("form.nameLabel")}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={resolveLanguageKey("form.namePlaceholder")}
                                                        type="text"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>{resolveLanguageKey("form.nameDescription")}</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div>
                                    <FormField
                                        control={form.control}
                                        name="template"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>{resolveLanguageKey("form.templateLabel")}</FormLabel>
                                                <FormControl>
                                                    <SimpleSelect
                                                        options={templateOptions}
                                                        value={field.value}
                                                        onValueChange={(value: string) => {
                                                            field.onChange(value);
                                                            if (value !== "none") {
                                                                const selectedRole = allRoles?.find((r) => r._id === value);
                                                                if (selectedRole) {
                                                                    const selectedPerms = Object.values(selectedRole.permissions || {}).flatMap((p) => [...(p.self || []), ...(p.others || [])]);
                                                                    updateCurrentPermissionsBasedOnArrayOfPermissions(selectedPerms);
                                                                }
                                                            } else {
                                                                setCurrentPermissions(JSON.parse(JSON.stringify(permissionsData ?? {})));
                                                                form.setValue("permissions", {}, {shouldDirty: true});
                                                            }
                                                        }}
                                                        placeholder={resolveLanguageKey("form.templatePlaceholder")}
                                                        disabled={isLoading}
                                                        className="grow w-full"
                                                    />
                                                </FormControl>
                                                <FormDescription>{resolveLanguageKey("form.templateDescription") || ""}</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="flex-full">{memoizedPermissionsTable}</div>

                            <div className="flex grow items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/tenancy/systemSettings/roles")}
                                    disabled={loading}
                                >
                                    {resolveLanguageKey("cancel")}
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <LoaderCircle className="animate-spin h-4 w-4" /> : <IconUserPlus />}
                                    {resolveLanguageKey("submit")}
                                </Button>
                            </div>

                        </form>
                    </Form>
                }
            </div>
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/roles/createRole.tsx"),
    withAxios({url: "/api/company/roles", method: "PUT", data: {}}, true),
    withDebug(true, true)
)(CreateRole);
