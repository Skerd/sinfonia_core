import {compose} from "redux";
import {useImperativeHandle, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import type {SetCompanyDomainsResponse} from "armonia/src/modules/core/api/platform/private/companies/platformModules.dto.ts";

/** What a company is stored with while it has no domain of its own; never shown as one. */
const NO_COMPANY_DOMAIN = "none.none.com";

type ManageDomainsDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: Partial<Company> & {_id: string};
    onSuccess?: (allowedDomains: string[]) => void;
};

/** The platform sets a company's own domains, one per line (D189); an empty box leaves only its portal address. */
function ManageDomainsDialogInner({
    open,
    onOpenChange,
    company,
    onSuccess,
    resolveLanguageKey,
    innerRef,
    onFilterChange,
    loading,
}: ManageDomainsDialogProps & WithLanguageType & WithAxiosType<SetCompanyDomainsResponse>) {
    const [text, setText] = useState(() => (company.allowedDomains ?? []).filter((domain) => domain !== NO_COMPANY_DOMAIN).join("\n"));

    useImperativeHandle(innerRef, () => ({
        success: (data: SetCompanyDomainsResponse) => {
            onSuccess?.(data.allowedDomains);
            onOpenChange(false);
        },
    }));

    return (
        <ConfirmDialog
            open={open}
            onOpenChange={(next: boolean) => { if (!loading) onOpenChange(next); }}
            title={resolveLanguageKey("title")}
            desc={`${company.name} — ${resolveLanguageKey("description")}`}
            confirmText={resolveLanguageKey("save")}
            handleConfirm={() => onFilterChange({allowedDomains: text.split(/[\n,]/).map((line) => line.trim()).filter(Boolean)})}
            isLoading={loading}
        >
            <Label className="flex-col items-stretch gap-1.5">
                {resolveLanguageKey("domainsLabel")}
                <Textarea rows={4} value={text} onChange={(event) => setText(event.target.value)} placeholder="shop.example.com" className="h-auto py-2 font-mono text-sm" />
                <span className="text-xs font-normal text-muted-foreground">{resolveLanguageKey("domainsHint")}</span>
            </Label>
        </ConfirmDialog>
    );
}

const ManageDomainsDialogConnected = compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/dialogs/manageDomainsDialog.tsx"),
    withAxios<SetCompanyDomainsResponse>(
        {
            method: "PUT",
            url: "/api/platform/companies/domains",
            data: {},
            addToPath: [{whatToGet: ["company", "_id"]}],
        },
        true,
    ),
    withDebug(true, true, "companies"),
)(ManageDomainsDialogInner);

export default function ManageDomainsDialog(props: ManageDomainsDialogProps) {
    return <ManageDomainsDialogConnected {...props} />;
}
