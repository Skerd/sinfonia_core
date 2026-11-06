import {compose} from "redux";
import {useEffect, useImperativeHandle, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {PhoneInput} from "@coreModule/components/ui/phone-input.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import type {PhoneNumberFormResponseType} from "armonia/src/modules/core/api/user/private/data/phoneNumber.form.response.type.ts";
import type {MessagingProvider, TestMessagingProviderConnectionResponse} from "armonia/src/modules/core/api/auxiliary/private/messagingProvider/messagingProvider.dto.ts";

const OWN_PHONE_REQUEST = {method: "get" as const, url: "/api/user/data/phoneNumber", data: {}};

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
        if (!open) setTestPhone("");
    }, [open]);

    // Prefill with the user's own number each time the dialog opens; silent if it has none.
    const [phoneLookup, setPhoneLookup] = useState({open, count: open ? 1 : 0});
    if (phoneLookup.open !== open) setPhoneLookup({open, count: open ? phoneLookup.count + 1 : phoneLookup.count});
    useHttpRequest<PhoneNumberFormResponseType>(OWN_PHONE_REQUEST, {}, phoneLookup.count, true, {
        success: (data) => {
            if (data?.phoneNumber?.trim()) setTestPhone(data.phoneNumber.trim());
        },
    });

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
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/messagingProviders/center/dialogs/testMessagingProviderConnectionDialog.tsx"),
    withAxios(
        {
            method: "POST",
            url: "/api/auxiliary/messagingProvider/testConnection",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "messagingProviders"),
)(TestMessagingProviderConnectionDialog);
