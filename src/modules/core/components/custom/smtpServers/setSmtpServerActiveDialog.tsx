import {compose} from "redux";
import {useImperativeHandle} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import type {SmtpServer} from "armonia/src/modules/core/api/auxiliary/private/smtpServer/smtpServer.dto.ts";

type SetSmtpServerActiveDialogOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    smtpServer: SmtpServer;
    targetActive: boolean;
    onSuccess?: (server: SmtpServer) => void;
};

type SetSmtpServerActiveDialogProps = SetSmtpServerActiveDialogOwnProps &
    WithLanguageType &
    WithAxiosType<SmtpServer> & {
        endpoint: "activate" | "deactivate";
    };

function SetSmtpServerActiveDialogInner({
    open,
    onOpenChange,
    smtpServer,
    targetActive,
    resolveLanguageKey,
    onSuccess,
    innerRef,
    onFilterChange,
    loading,
}: SetSmtpServerActiveDialogProps) {
    const langPrefix = targetActive ? "activate" : "deactivate";

    useImperativeHandle(innerRef, () => ({
        success: (data: SmtpServer) => {
            onSuccess?.(data);
            onOpenChange(false);
        },
        error: () => {
            onOpenChange(false);
        },
    }));

    return (
        <ConfirmDialog
            open={open}
            onOpenChange={(o: boolean) => { if (!loading) onOpenChange(o); }}
            title={resolveLanguageKey(`${langPrefix}.title`)}
            desc={resolveLanguageKey(`${langPrefix}.description`)}
            handleConfirm={() => onFilterChange({_id: smtpServer._id})}
            isLoading={loading}
        />
    );
}

const SetSmtpServerActiveDialogConnected = compose(
    withLanguage("src/modules/core/components/custom/smtpServers/setSmtpServerActiveDialog.tsx"),
    withAxios<SmtpServer>(
        {
            method: "POST",
            url: "/api/auxiliary/smtpServer",
            data: {},
            addToPath: [{whatToGet: ["endpoint"]}],
            onSuccessMessage: {
                if: "active",
                condition: false,
                message: "deactivated",
            },
        },
        true,
    ),
    withDebug(true, true),
)(SetSmtpServerActiveDialogInner);

export default function SetSmtpServerActiveDialog(props: SetSmtpServerActiveDialogOwnProps) {
    return (
        <SetSmtpServerActiveDialogConnected
            {...props}
            endpoint={props.targetActive ? "activate" : "deactivate"}
        />
    );
}
