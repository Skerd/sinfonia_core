import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {PlugZap} from "lucide-react";

type TestSmtpConnectionProps = WithLanguageType & {
    onAction: (action: string) => void;
};

function TestSmtpConnection({onAction, resolveLanguageKey}: TestSmtpConnectionProps) {
    const actionKey = "testSmtpConnection";

    return (
        <DropdownMenuItem onClick={() => onAction(actionKey)}>
            <PlugZap size={16} />
            {resolveLanguageKey("title")}
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/smtpServers/center/actions/testSmtpConnection.tsx"),
    withDebug(true, true),
)(TestSmtpConnection);
