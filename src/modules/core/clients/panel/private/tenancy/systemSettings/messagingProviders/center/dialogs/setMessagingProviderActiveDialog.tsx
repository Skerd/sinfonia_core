import {compose} from "redux";
import {useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import type {MessagingProvider} from "armonia/src/modules/core/api/auxiliary/private/messagingProvider/messagingProvider.dto.ts";

const MESSAGING_PROVIDER_API_URL = "/api/auxiliary/messagingProvider";

const SET_ACTIVE_REQUEST = {method: "post" as const, url: MESSAGING_PROVIDER_API_URL, data: {}};

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
    const langPrefix = targetActive ? "activate" : "deactivate";
    const endpoint = targetActive ? "activate" : "deactivate";
    const [request, setRequest] = useState({body: {} as Record<string, unknown>, count: 0});

    // Silent: the dialog closes either way, as before.
    const {loading} = useHttpRequest<MessagingProvider>(SET_ACTIVE_REQUEST, request.body, request.count, true, {
        success: (data) => {
            onSuccess?.(data);
            onOpenChange(false);
        },
        error: () => onOpenChange(false),
    }, {url: `${MESSAGING_PROVIDER_API_URL}/${endpoint}`});

    const handleConfirm = () => {
        setRequest((current) => ({body: {_id: messagingProvider._id}, count: current.count + 1}));
    };

    return (
        <ConfirmDialog
            open={open}
            onOpenChange={(o: boolean) => { if (!loading) onOpenChange(o); }}
            title={resolveLanguageKey(`${langPrefix}.title`)}
            desc={resolveLanguageKey(`${langPrefix}.description`)}
            handleConfirm={handleConfirm}
            isLoading={loading}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/messagingProviders/center/dialogs/setMessagingProviderActiveDialog.tsx"),
    withDebug(true, true, "messagingProviders"),
)(SetMessagingProviderActiveDialog);
