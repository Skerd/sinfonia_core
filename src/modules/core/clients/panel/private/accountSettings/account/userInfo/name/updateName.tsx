import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useEffect, useImperativeHandle} from "react";
import {Button} from "@coreModule/components/ui/button.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Check, X} from "lucide-react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {UpdateUserProfileNameFormType} from "armonia/src/modules/core/api/user/private/data/updateUserProfileName.form.type.ts";
import {UpdateUserProfileNameFormResponseType} from "armonia/src/modules/core/api/user/private/data/updateUserProfileName.form.response.type.ts";

type UpdateNameProps = WithLanguageType & WithAxiosType<UpdateUserProfileNameFormResponseType, UpdateUserProfileNameFormType> & {
    updateCanEdit: Function,
    fieldValue: string,
    fireUpdate: number,
    specificUserId?: string,
    onSuccess: Function
}

function UpdateName({
    resolveLanguageKey,
    updateCanEdit = () => {},
    fieldValue,
    loading,
    onFilterChange,
    fireUpdate = 0,
    onSuccess = () => {},
    innerRef,
    specificUserId
}: UpdateNameProps) {

    const {write} = useAccess("users", !specificUserId ? "self" : "others");

    useEffect(() => {
        updateCanEdit?.(!!write.name);
    }, [write]);
    useEffect(() => {
        if( !!fireUpdate ){
            const postBody = {
                name: fieldValue
            };
            onFilterChange(postBody);
        }
    }, [fireUpdate]);

    useImperativeHandle(innerRef, () => ({
        success: () => {
            onSuccess?.();
        }
    }))

    if( !write.name ){
        return <HiddenElement />
    }
    if( !fieldValue ){
        return <></>
    }

    return (
        <div className="flex items-center grow space-x-1 transition-all ease-in" style={{border: "0px solid red"}}>
            <TooltipDisplayer tooltip={resolveLanguageKey("confirm")} contentClassName="text-sm">
                <Button
                    type="submit"
                    variant="outline"
                    size="icon"
                    className={cn("h-full px-2 text-green-500", {"hover:border-green-400 hover:dark:border-green-400": !!fieldValue})}
                    disabled={loading}
                >
                    <Check className={cn("h-4 w-4 hover:text-white", )} />
                </Button>
            </TooltipDisplayer>
            <TooltipDisplayer tooltip={resolveLanguageKey("cancel")} contentClassName="text-sm">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-full px-2 text-destructive hover:border-destructive hover:dark:border-destructive"
                    disabled={loading}
                    onClick={() => {updateCanEdit(false);}}
                >
                    <X className=" h-4 w-4 hover:opacity-50 hover:text-white" />
                </Button>
            </TooltipDisplayer>
        </div>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/name/updateName.tsx"),
    withAxios(
        {
            url: "/api/user/data/name",
            method: "patch",
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }]
        },
        true
    ),
    withDebug(true, true)
)(UpdateName);