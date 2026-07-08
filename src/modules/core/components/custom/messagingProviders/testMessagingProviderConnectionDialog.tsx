import {compose} from "redux";
import {useEffect, useImperativeHandle, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {PhoneInput} from "@coreModule/components/ui/phone-input.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import type {PhoneNumberFormResponseType} from "armonia/src/modules/core/api/user/private/data/phoneNumber.form.response.type.ts";
import type {MessagingProvider, TestMessagingProviderConnectionResponse} from "armonia/src/modules/core/api/auxiliary/private/messagingProvider/messagingProvider.dto.ts";

type TestMessagingProviderConnectionDialogProps = WithLanguageType &
    WithAxiosType<TestMessagingProviderConnectionResponse> & {
        open: boolean;
        onOpenChange: (open: boolean) => void;
        messagingProvider: MessagingProvider;
        onTestComplete?: (result: TestMessagingProviderConnectionResponse) => void;
    };

function TestMessagingProviderConnectionDialog({
    open,
    onOpenChange,
    messagingProvider,
    resolveLanguageKey,
    onTestComplete,
    innerRef,
    onFilterChange,
    loading,
}: TestMessagingProviderConnectionDialogProps) {
    const [testPhone, setTestPhone] = useState("");

    useEffect(() => {
        if (!open) {
            setTestPhone("");
            return;
        }

        let cancelled = false;
        void apiClient
            .get<PhoneNumberFormResponseType>("/api/user/data/phoneNumber")
            .then((res) => {
                if (!cancelled && res.data?.phoneNumber?.trim()) {
                    setTestPhone(res.data.phoneNumber.trim());
                }
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [open]);

    useImperativeHandle(innerRef, () => ({
        success: (data: TestMessagingProviderConnectionResponse) => {
            onTestComplete?.(data);
            onOpenChange(false);
            setTestPhone("");
        },
        error: () => {
            onOpenChange(false);
        },
    }));

    const trimmedPhone = testPhone.trim();
    const canConfirm = !!trimmedPhone;

    return (
        <ConfirmDialog
            open={open}
            onOpenChange={(o: boolean) => {
                if (loading) return;
                onOpenChange(o);
                if (!o) setTestPhone("");
            }}
            title={resolveLanguageKey("title")}
            desc={resolveLanguageKey("description")}
            handleConfirm={() => onFilterChange({_id: messagingProvider._id, testPhone: trimmedPhone})}
            isLoading={loading}
            disabled={!canConfirm}
        >
            <div className="py-2">
                <Label htmlFor="testPhone">{resolveLanguageKey("testPhoneLabel")}</Label>
                <PhoneInput
                    id="testPhone"
                    value={testPhone}
                    onChange={(value) => setTestPhone(value ?? "")}
                    disabled={loading}
                    className="mt-2"
                />
            </div>
        </ConfirmDialog>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/messagingProviders/testMessagingProviderConnectionDialog.tsx"),
    withAxios(
        {
            method: "POST",
            url: "/api/auxiliary/messagingProvider/testConnection",
            data: {},
        },
        true,
    ),
    withDebug(true, true),
)(TestMessagingProviderConnectionDialog);
