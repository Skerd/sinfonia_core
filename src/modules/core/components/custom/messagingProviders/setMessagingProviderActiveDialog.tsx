import {compose} from "redux";
import {useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import type {MessagingProvider} from "armonia/src/modules/core/api/auxiliary/private/messagingProvider/messagingProvider.dto.ts";

const MESSAGING_PROVIDER_API_URL = "/api/auxiliary/messagingProvider";

type SetMessagingProviderActiveDialogProps = WithLanguageType & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    messagingProvider: MessagingProvider;
    targetActive: boolean;
    onSuccess?: (provider: MessagingProvider) => void;
};

function SetMessagingProviderActiveDialog({
    open,
    onOpenChange,
    messagingProvider,
    targetActive,
    resolveLanguageKey,
    onSuccess,
}: SetMessagingProviderActiveDialogProps) {
    const [loading, setLoading] = useState(false);
    const langPrefix = targetActive ? "activate" : "deactivate";
    const endpoint = targetActive ? "activate" : "deactivate";

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const res = await apiClient.post<MessagingProvider>(
                `${MESSAGING_PROVIDER_API_URL}/${endpoint}`,
                {_id: messagingProvider._id},
            );
            onSuccess?.(res.data);
            onOpenChange(false);
        } catch {
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ConfirmDialog
            open={open}
            onOpenChange={(o: boolean) => { if (!loading) onOpenChange(o); }}
            title={resolveLanguageKey(`${langPrefix}.title`)}
            desc={resolveLanguageKey(`${langPrefix}.description`)}
            handleConfirm={() => { void handleConfirm(); }}
            isLoading={loading}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/messagingProviders/setMessagingProviderActiveDialog.tsx"),
    withDebug(true, true),
)(SetMessagingProviderActiveDialog);
