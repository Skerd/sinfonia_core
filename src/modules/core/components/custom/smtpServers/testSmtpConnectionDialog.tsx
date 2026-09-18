import {compose} from "redux";
import {useImperativeHandle} from "react";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@baseModule/helpers/hocs/withAxios.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import ConfirmDialog from "@baseModule/components/custom/confirmDialog.tsx";
import type {SmtpServer, TestSmtpConnectionResponse} from "armonia/src/modules/core/api/auxiliary/private/smtpServer/smtpServer.dto.ts";
import apiClient from "@baseModule/helpers/apiClient/apiClient.ts";

type TestSmtpConnectionDialogProps = WithLanguageType & WithAxiosType<TestSmtpConnectionResponse> & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    smtpServer: SmtpServer;
    onTestComplete?: (lastTest: TestSmtpConnectionResponse) => void;
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

    const reloadLastTest = async () => {
        const {data} = await apiClient.post<SmtpServer>("/api/auxiliary/smtpServer/single", {_id: smtpServer._id});
        const {lastTestedAt, lastTestStatus, lastTestMessage} = data;
        onTestComplete?.({lastTestedAt, lastTestStatus, lastTestMessage});
    };

    useImperativeHandle(innerRef, () => ({
        success: (data: TestSmtpConnectionResponse) => {
            onTestComplete?.(data);
            onOpenChange(false);
        },
        error: () => {
            void reloadLastTest();
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
    withDebug(true, true, "smtpServers"),
)(TestSmtpConnectionDialog);
