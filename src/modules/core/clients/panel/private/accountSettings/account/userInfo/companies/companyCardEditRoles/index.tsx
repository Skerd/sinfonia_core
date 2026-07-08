import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {useEffect, useImperativeHandle, useState} from "react";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Info} from "lucide-react";
import {Alert, AlertDescription, AlertTitle} from "@coreModule/components/ui/alert.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import SaveNewCompanyRoles from "@coreModule/clients/panel/private/accountSettings/account/userInfo/companies/companyCardEditRoles/saveNewCompanyRoles.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {AccessibleRolesFormResponseType} from "armonia/src/modules/core/api/user/private/permissions/accessibleRoles.form.response.type.ts";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";
import type {ApiSelectDatum} from "armonia/src/modules/core/types/shared.types.ts";
import {useTableUpdate} from "@coreModule/components/custom/tableUpdateContext.tsx";

export type ToggledUserRole = ApiSelectDatum & { newValue: boolean, canEdit: boolean }
type AccountCompaniesCardEditRolesProps = WithLanguageType & WithAxiosType<AccessibleRolesFormResponseType> & {
    roles: CompanyUserType["roles"],
    specificUserId: string
    sendIt: null | "send" | "cancel",
    canAccess: boolean,
    overrideCompanyId?: string,
    setEditRoles: Function
}

function AccountCompaniesCardEditRoles({
    roles,
    specificUserId,
    overrideCompanyId,
    resolveLanguageKey,
    onFilterChange,
    loading,
    error,
    data,
    innerRef,
    // canAccess,
}: AccountCompaniesCardEditRolesProps){

    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");

    const { updateRow } = useTableUpdate();
    const [forceReload, setForceReload] = useState<number>(1);

    const [isOpen, setIsOpen] = useState(false);

    const [allRoles, setAllRoles] = useState<ApiSelectDatum[]>([]);

    const [activeRoles, setActiveRoles] = useState<CompanyUserType["roles"] | null>(roles);

    const [allCompanyRoles, setAllCompanyRoles] = useState<ToggledUserRole[]>([]);
    const [activeIds, setActiveIds] = useState<string[]>(roles?.map((role:any) => role?._id) || []);

    const [rerender, setRerender] = useState<number>(1);

    const toggleRole = (roleId: string, activeState: boolean) => {
        const tempRoles = allCompanyRoles;
        tempRoles.forEach((role: any) => {
            if (role.value == roleId) {
                role.newValue = activeState;
            }
            // else{
            //     role.active = false;
            // }
        });
        setAllCompanyRoles(tempRoles);
        setRerender(rerender + 1);
    }

    useEffect(() => {
        if( !!allRoles && allRoles.length > 0 && !isOpen){
            let newAllCompanyRoles = allRoles.map((role) => {
                return {
                    ...role,
                    active: activeIds.includes(role.value),
                    newValue: activeIds.includes(role.value),
                    canEdit: true
                }
            });
            for( let role of (roles || []) ){
                if( !newAllCompanyRoles.find((newRole) => newRole.value === role._id) ){
                    newAllCompanyRoles.push({
                        value: role._id,
                        label: role.name,
                        active: true,
                        newValue: true,
                        canEdit: false
                    })
                }
            }

            setAllCompanyRoles(newAllCompanyRoles);
        }
    }, [allRoles, isOpen]);
    useEffect(() => {
        if( read?.roles?.keys?.roles ){
            onFilterChange({});
        }
    }, [forceReload, read])

    useImperativeHandle(innerRef, () => ({
        success: (data: AccessibleRolesFormResponseType) => {
            setAllRoles(data?.data?.map((role) => {
                return {
                    value: role.value,
                    label: role.label,
                    active: false
                }
            }) || []);
        }
    }))

    if( !read?.roles?.keys?.roles ){
        return <HiddenElement />
    }
    if( loading ){
        return (
            <Loader />
        )
    }
    if( error ){
        return (
            <SimpleError
                title={resolveLanguageKey("failTitle")}
                description={resolveLanguageKey("failTitleTooltip")}
                onClick={() => setForceReload(Date.now())}
            />
        )
    }
    if( !data || data?.data?.length === 0 ){
        return (
            <div className="w-full item space-y-2 font-bold">
                <p>{resolveLanguageKey("roles")}</p>
                <div className="flex grow flex-wrap gap-1">
                    {
                        roles.map((role: any, index: number) => {
                            return (
                                <Badge key={`badge_for_${role._id}_${role.label}_${index}`} className="hover:cursor-pointer">
                                    {role.name}
                                </Badge>
                            )
                        })
                    }
                </div>
            </div>
        )
    }

    return (
        <div className="w-full space-y-1">
            <div className="flex items-center justify-between w-full font-bold">
                {write?.roles?.keys?.roles && <p>{resolveLanguageKey("roles")}</p>}
                {
                    write?.roles?.keys?.roles &&
                    <div>
                        <SaveNewCompanyRoles
                            specificUserId={specificUserId}
                            overrideCompanyId={overrideCompanyId}
                            isOpen={isOpen}
                            setIsOpen={(value: boolean) => {
                                setIsOpen(value);
                            }}
                            allCompanyRoles={allCompanyRoles}
                            onSuccess={() => {
                                roles = allCompanyRoles.filter(role => role.newValue).map((role) => {
                                    return {
                                        name: role.label,
                                        label: role.label,
                                        _id: role.value
                                    }
                                });
                                setActiveIds(allCompanyRoles.filter(role => role.newValue).map(role => role.value));
                                setIsOpen(false);
                                setActiveRoles(roles);
                                updateRow(specificUserId, {roles: roles});
                            }}
                        />
                    </div>
                }
            </div>
            {
                (!isOpen || !write?.roles?.keys?.roles) ?
                <div className="flex w-full item">
                    <div className="flex grow flex-wrap gap-1">
                        {
                            activeRoles?.map((role: any, index: number) => {
                                return (
                                    <Badge key={`badge_for_${role._id}_${role.label}_${index}`} className="hover:cursor-pointer">
                                        {role.name}
                                    </Badge>
                                )
                            })
                        }
                    </div>
                </div>
                :
                <div className="flex flex-col items-start w-full space-y-2 gap-2">
                    <div className="flex grow flex-wrap gap-1">
                        {
                            allCompanyRoles?.map((role: any, index) => {
                                if( !role.canEdit ){
                                    return <></>
                                }
                                return (
                                    <Badge
                                        key={`badge_for_${role._id}_${role.label}_${index}`}
                                        className={cn("hover:cursor-pointer", {"border border-red-400": !role.newValue, "border border-green-700 bg-green-700": role.newValue})}
                                        variant={!role.newValue ? "outline" : "default"}
                                        onClick={() => {
                                            toggleRole(role.value, !role.newValue);
                                        }}
                                    >
                                        {role.label}
                                    </Badge>
                                )
                            })
                        }
                    </div>
                    <Alert>
                        <Info />
                        <AlertTitle>{resolveLanguageKey("clarification")}</AlertTitle>
                        <AlertDescription>{resolveLanguageKey("clarificationDescription")}</AlertDescription>
                    </Alert>
                </div>
            }
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/companies/companyCardEditRoles/index.tsx"),
    withAxios(
        {
            url: "/api/user/permissions/accessible/roles/select",
            method: "POST",
            data: {
                page: 1,
                limit: 200
            },
            addToHeader: [
                {
                    whatToGet: "specificUserId",
                    whereToPut: "specificUser"
                },
                {
                    whatToGet: "overrideCompanyId",
                    whereToPut: "x-company-id"
                }
            ]
        },
        true
    ),
    withDebug(true, true)
)
(AccountCompaniesCardEditRoles)




