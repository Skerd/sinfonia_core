import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {PowerOff} from "lucide-react";
import type {SmtpServer} from "armonia/src/modules/core/api/auxiliary/private/smtpServer/smtpServer.dto.ts";

type DeactivateSmtpServerProps = WithLanguageType & {
    smtpServer: Pick<SmtpServer, "_id" | "active">;
    onAction: (action: string) => void;
};

function DeactivateSmtpServer({smtpServer, resolveLanguageKey, onAction}: DeactivateSmtpServerProps) {
    const {write} = useAccess("smtpServers");

    if (!write?.active) return null;
    if (!smtpServer.active) return null;

    return (
        <DropdownMenuItem onClick={() => onAction("deactivateSmtpServer")}>
            <PowerOff className="text-destructive" size={16} />
            {resolveLanguageKey("title")}
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/smtpServers/center/actions/deactivateSmtpServer.tsx"),
    withDebug(true, true),
)(DeactivateSmtpServer);
