import {compose} from "redux";
import {useState} from 'react';
import {TriangleAlert} from "lucide-react";
import { Button } from "@coreModule/components/ui/button.tsx";
import {Alert, AlertDescription, AlertTitle} from "@coreModule/components/ui/alert.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import ToggleUserActiveState from "@coreModule/clients/panel/private/accountSettings/security/disableAccount/toggleUserActiveState.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type UserAccountSecurityEnableAccountFormProps = WithLanguageType & {specificUserId?: string, onSuccess: Function; userData: any};

function UserAccountSecurityEnableAccountForm({
    resolveLanguageKey,
    specificUserId,
    userData,
    onSuccess
}: UserAccountSecurityEnableAccountFormProps){

    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    const [disableUser, setDisableUser] = useState<{_id: string, username: string, active: boolean} | null>(null);

    if( !specificUserId ){
        return <></>
    }

    if( !write?.roles?.keys?.active ){
        return <HiddenElement />
    }

    return (
        <div className="space-y-4">
            <Alert variant={"destructive"}>
                <TriangleAlert className="h-4 w-4"/>
                <AlertTitle>{resolveLanguageKey("title")}</AlertTitle>
                <AlertDescription>{resolveLanguageKey("description")}</AlertDescription>
            </Alert>

            {
                (!!specificUserId) &&
                <>
                    <div className="flex justify-end items-center">
                        <Button
                            type="button"
                            onClick={() => {
                                setDisableUser({
                                    username: userData.username,
                                    active: false,
                                    _id: specificUserId
                                });
                            }}
                        >
                            {resolveLanguageKey("deactivateButton")}
                        </Button>
                    </div>
                    {
                        disableUser &&
                        <ToggleUserActiveState
                            hideCondition={!write?.roles?.keys?.active}
                            active={disableUser.active}
                            specificUserId={disableUser._id}
                            username={disableUser.username}
                            onSuccess={(newState: boolean) => {onSuccess(newState);}}
                            onComplete={() => {
                                setDisableUser(null);
                            }}
                        />
                    }
                </>
            }
        </div>
    )
}

export default compose(
    withHidden(),
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/disableAccount/enableAccount.form.tsx"),
    withDebug(true, true)
)(UserAccountSecurityEnableAccountForm);
