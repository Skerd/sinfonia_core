import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@baseModule/helpers/hooks/useAccess.ts";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Power} from "lucide-react";
import type {MessagingProvider} from "armonia/src/modules/core/api/auxiliary/private/messagingProvider/messagingProvider.dto.ts";

type ActivateMessagingProviderProps = WithLanguageType & {
    messagingProvider: Pick<MessagingProvider, "_id" | "active">;
    onAction: (action: string) => void;
};

function ActivateMessagingProvider({messagingProvider, resolveLanguageKey, onAction}: ActivateMessagingProviderProps) {
    const {write} = useAccess("messagingProviders");

    if (!write?.active) return null;
    if (messagingProvider.active) return null;

    return (
        <DropdownMenuItem onClick={() => onAction("activateMessagingProvider")}>
            <Power className="text-success" size={16} />
            {resolveLanguageKey("title")}
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/messagingProviders/center/actions/activateMessagingProvider.tsx"),
    withDebug(true, true, "messagingProviders"),
)(ActivateMessagingProvider);
