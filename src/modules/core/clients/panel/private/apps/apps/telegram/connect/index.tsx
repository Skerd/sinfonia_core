import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {Link} from "react-router-dom";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import CopyTooltip from "@coreModule/components/custom/copyTooltip.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import {
    GenerateTelegramQrCodeFormResponseType
} from "armonia/src/modules/core/api/user/private/telegram/generateTelegramQrCode.form.response.type.ts";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";

type ConnectTelegramProps = WithLanguageType & WithAxiosType<GenerateTelegramQrCodeFormResponseType> & {
    onSuccess: Function,
    onCancel: Function,
    specificUserId?: string,
}

function ConnectTelegram({
    onCancel,
    onSuccess,
    data,
    resolveLanguageKey,
    loading,
    error,
    onFilterChange,
    specificUserId
}: ConnectTelegramProps){

    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    const [forceReload, setForceReload] = useState<number>(1);
    const {telegramLinked: fromServerLinked} = useSelector((state: RootState) => state.ui);

    useEffect(() => {
        if( fromServerLinked ){
            onSuccess();
        }
    }, [fromServerLinked])
    useEffect(() => {
        onFilterChange({});
    }, [forceReload]);

    if( !write.telegram ){
        return <></>
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

    return(
        <div className="space-y-2">
            <div>
                {
                    Object.values(resolveLanguageKey("steps") || {})?.map((step: string, index: number) => {
                        return (
                            <div className="flex space-x-1 text-sm text-muted-foreground">
                                <p>{index + 1}.</p>
                                <p key={"step_" + index} className="">{`${step}`}</p>
                            </div>
                        )
                    })
                }
            </div>

            <div className="w-full flex flex-col items-center space-y-2">
                <div className="flex border">
                    <img style={{height: "300px"}} src={data?.data_url} alt="QR Code"/>
                </div>
            </div>

            <div className="flex justify-center">
                <Link to={data?.inviteUrl || "/client/public"} target="_blank">
                    <Button variant="link">
                        {resolveLanguageKey("link")}
                    </Button>
                </Link>
                <CopyTooltip text={data?.inviteUrl}>
                </CopyTooltip>
            </div>

            <div className="w-full flex justify-center items-center mt-2">
                <Button type="button" variant="outline" onClick={() => {onCancel();}}>
                    {resolveLanguageKey("cancel")}
                </Button>
            </div>
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/apps/apps/telegram/connect/index.tsx"),
    withAxios(
        {
            method: "post",
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
)(ConnectTelegram)