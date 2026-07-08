import {compose} from "redux";
import {useImperativeHandle} from 'react';
import {Button} from "@coreModule/components/ui/button.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DeactivateTelegramFormResponseType} from "armonia/src/modules/core/api/user/private/telegram/deactivateTelegram.form.response.type.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {LoaderCircle} from "lucide-react";

type UserLinkTelegramDeactivationProps = WithAxiosType<DeactivateTelegramFormResponseType> & WithLanguageType & {
    onSuccess?: Function,
    onCancel?: Function,
    specificUserId?: string
}

const UserLinkTelegramDeactivation = ({
    resolveLanguageKey,
    loading,
    onFilterChange,
    innerRef,
    onSuccess = () => {},
    onCancel = () => {},
    specificUserId
}:UserLinkTelegramDeactivationProps) => {

    const {write} = useAccess("users");
    useImperativeHandle(innerRef, () => ({
        success: () => {
            onSuccess();
        }
    }));

    if( !write.telegram ){
        return <></>
    }

    return (
        <div className="space-y-4">
            {
                !!specificUserId ?
                <div className="flex flex-col w-full justify-center gap-2">
                    <div className="flex flex-col text-muted-foreground w-full justify-center items-center">
                        <p className="">{resolveLanguageKey("usersTitle")}</p>
                        <p className="">{resolveLanguageKey("usersDescription")}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={loading}
                            onClick={() => {onCancel();}}
                        >
                            {resolveLanguageKey("backButton")}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                                onFilterChange({
                                    sendEmail: false,
                                    mfaCode: ""
                                });
                            }}
                            disabled={loading}
                        >
                            {loading && <LoaderCircle className="animate-spin"/>}
                            {resolveLanguageKey("button")}
                        </Button>
                    </div>

                </div>
                :
                <>
                    <div className="flex flex-col text-muted-foreground w-full ">
                        <p className="">{resolveLanguageKey("title")} {resolveLanguageKey("description")}</p>
                        <p className=""></p>
                    </div>
                    <div className="flex w-full justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={loading}
                            onClick={() => {onCancel();}}
                        >
                            {resolveLanguageKey("backButton")}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                                onFilterChange({});
                            }}
                            disabled={loading}
                        >
                            {loading && <LoaderCircle className="animate-spin"/>}
                            {resolveLanguageKey("button")}
                        </Button>
                    </div>
                </>
            }
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/apps/apps/telegram/disconnect/index.tsx"),
    withAxios(
        {
            method: "delete",
            url: `/api/user/telegram`,
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }]
        },
        true
    ),
    withDebug(true, true)
)
(UserLinkTelegramDeactivation)
