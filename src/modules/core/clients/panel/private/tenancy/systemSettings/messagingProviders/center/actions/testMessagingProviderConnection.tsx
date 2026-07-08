import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {MessageSquareMore} from "lucide-react";

type TestMessagingProviderConnectionProps = WithLanguageType & {
    onAction: (action: string) => void;
};

function TestMessagingProviderConnection({onAction, resolveLanguageKey}: TestMessagingProviderConnectionProps) {
    return (
        <DropdownMenuItem onClick={() => onAction("testMessagingProviderConnection")}>
            <MessageSquareMore size={16} />
            {resolveLanguageKey("title")}
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/messagingProviders/center/actions/testMessagingProviderConnection.tsx"),
    withDebug(true, true),
)(TestMessagingProviderConnection);
