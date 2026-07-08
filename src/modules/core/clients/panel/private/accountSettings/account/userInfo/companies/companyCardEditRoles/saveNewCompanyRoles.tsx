import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Check, Pencil, X} from "lucide-react";
import {useImperativeHandle} from "react";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {ToggledUserRole} from "@coreModule/clients/panel/private/accountSettings/account/userInfo/companies/companyCardEditRoles/index.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {ChangeUserRolesFormType} from "armonia/src/modules/core/api/user/private/permissions/changeUserRoles.form.type.ts";
import {ChangeUserRolesFormResponseType} from "armonia/src/modules/core/api/user/private/permissions/changeUserRoles.form.response.type.ts";

type SaveNewCompanyRolesProps = WithLanguageType & WithAxiosType<ChangeUserRolesFormResponseType[],ChangeUserRolesFormType > & {
    isOpen?: boolean,
    onSuccess?: Function
    setIsOpen?: Function
    allCompanyRoles: (ToggledUserRole & {active: boolean})[],
    specificUserId?: string
}

function SaveNewCompanyRoles({
    loading,
    innerRef,
    onFilterChange,
    isOpen,
    onSuccess = () => {},
    setIsOpen = () => {},
    allCompanyRoles,
    resolveLanguageKey,
    specificUserId
}: SaveNewCompanyRolesProps) {

    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    useImperativeHandle(innerRef, () => ({
        start: () => {},
        success: () => {
            onSuccess?.();
        },
        error: () => {}
    }));

    if( !write?.roles?.keys?.roles ){
        return <HiddenElement />
    }

    return (
        <>
            <>
                {
                    isOpen ?
                    <div className="space-x-1">
                        <TooltipDisplayer tooltip={resolveLanguageKey("confirm")} contentClassName="text-sm">
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={loading}
                                onClick={() => {
                                    onFilterChange({
                                        roles: allCompanyRoles.filter(role => role.active !== role.newValue).map(role => role.value)
                                    });
                                }}
                            >
                                <Check className="h-4 w-4"/>
                            </Button>
                        </TooltipDisplayer>
                        <TooltipDisplayer tooltip={resolveLanguageKey("cancel")} contentClassName="text-sm">
                            <Button
                                variant="destructive"
                                size="icon"
                                disabled={loading}
                                onClick={() => {setIsOpen(false);}}
                            >
                                <X className="h-4 w-4"/>
                            </Button>
                        </TooltipDisplayer>
                    </div>
                    :
                    <TooltipDisplayer tooltip={resolveLanguageKey("editRoles")} contentClassName="text-sm">
                        <Button variant="outline" size="icon" onClick={() => {setIsOpen(true);}} disabled={loading}>
                            <Pencil className="h-4 w-4"/>
                        </Button>
                    </TooltipDisplayer>
                }
            </>
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/companies/companyCardEditRoles/saveNewCompanyRoles.tsx"),
    withAxios(
        {
            method: "put",
            url: `/api/user/permissions/roles`,
            data: {},
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
)(SaveNewCompanyRoles);