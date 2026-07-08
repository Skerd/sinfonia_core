import {compose} from "redux";
import {useImperativeHandle} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import type {SmtpServer, TestSmtpConnectionResponse} from "armonia/src/modules/core/api/auxiliary/private/smtpServer/smtpServer.dto.ts";

type TestSmtpConnectionDialogProps = WithLanguageType &
    WithAxiosType<TestSmtpConnectionResponse> & {
        open: boolean;
        onOpenChange: (open: boolean) => void;
        smtpServer: SmtpServer;
        onTestComplete?: (result: TestSmtpConnectionResponse) => void;
    };

function TestSmtpConnectionDialog({
    open,
    onOpenChange,
    smtpServer,
    resolveLanguageKey,
    onTestComplete,
    innerRef,
    onFilterChange,
    loading,
}: TestSmtpConnectionDialogProps) {

    useImperativeHandle(innerRef, () => ({
        success: (data: TestSmtpConnectionResponse) => {
            onTestComplete?.(data);
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
            title={resolveLanguageKey("title")}
            desc={resolveLanguageKey("description")}
            handleConfirm={() => onFilterChange({_id: smtpServer._id})}
            isLoading={loading}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/smtpServers/testSmtpConnectionDialog.tsx"),
    withAxios(
        {
            method: "POST",
            url: "/api/auxiliary/smtpServer/testConnection",
            data: {},
        },
        true,
    ),
    withDebug(true, true),
)(TestSmtpConnectionDialog);
