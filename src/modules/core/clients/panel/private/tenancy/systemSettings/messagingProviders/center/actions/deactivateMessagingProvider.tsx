import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {PowerOff} from "lucide-react";
import type {MessagingProvider} from "armonia/src/modules/core/api/auxiliary/private/messagingProvider/messagingProvider.dto.ts";

type DeactivateMessagingProviderProps = WithLanguageType & {
    messagingProvider: Pick<MessagingProvider, "_id" | "active">;
    onAction: (action: string) => void;
};

function DeactivateMessagingProvider({messagingProvider, resolveLanguageKey, onAction}: DeactivateMessagingProviderProps) {
    const {write} = useAccess("messagingProviders");

    if (!write?.active) return null;
    if (!messagingProvider.active) return null;

    return (
        <DropdownMenuItem onClick={() => onAction("deactivateMessagingProvider")}>
            <PowerOff className="text-destructive" size={16} />
            {resolveLanguageKey("title")}
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/messagingProviders/center/actions/deactivateMessagingProvider.tsx"),
    withDebug(true, true),
)(DeactivateMessagingProvider);
