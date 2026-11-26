import {compose} from "redux";
import {useImperativeHandle} from "react";
import {useForm} from "react-hook-form";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {Form} from "@coreModule/components/ui/form.tsx";
import {StringArrayInput} from "@coreModule/components/custom/inputs/stringArrayInput.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import type {SetCompanyDomainsResponse} from "armonia/src/modules/core/api/platform/private/companies/platformModules.dto.ts";
import type {SetCompanyDomainsFormType} from "armonia/src/modules/core/api/platform/private/companies/setCompanyDomains.form.validator.ts";
import {COMPANY_DOMAIN_MAX, COMPANY_DOMAINS_MAX} from "armonia/src/modules/core/api/company/private/company/companyDomain.ts";

/** What a company is stored with while it has no domain of its own; never shown as one. */
const NO_COMPANY_DOMAIN = "none.none.com";

type ManageDomainsDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: Partial<Company> & {_id: string};
    onSuccess?: (allowedDomains: string[]) => void;
};

/** The platform sets a company's own domains (D189), added one at a time; an empty list leaves only its portal address. */
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
    const form = useForm<SetCompanyDomainsFormType>({
        defaultValues: {allowedDomains: (company.allowedDomains ?? []).filter((domain) => domain !== NO_COMPANY_DOMAIN)},
    });

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
            handleConfirm={() => onFilterChange({allowedDomains: form.getValues("allowedDomains")})}
            isLoading={loading}
            className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto data-[size=default]:max-w-2xl data-[size=default]:sm:max-w-2xl"
        >
            <Form {...form}>
                <StringArrayInput<SetCompanyDomainsFormType>
                    name="allowedDomains"
                    labelKey="domainsLabel"
                    placeholderKey="domainPlaceholder"
                    addTooltipKey="addDomain"
                    removeTooltipKey="removeDomain"
                    resolveLanguageKey={resolveLanguageKey}
                    loading={loading}
                    maxItems={COMPANY_DOMAINS_MAX}
                    maxLength={COMPANY_DOMAIN_MAX}
                />
                <span className="text-xs text-muted-foreground">{resolveLanguageKey("domainsHint")}</span>
            </Form>
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
