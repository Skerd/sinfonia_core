import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import {useEffect, useState} from "react";
import ActivateCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/activate.tsx";
import DeactivateCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/deactivate.tsx";
import ActivateCompanyDialog from "@coreModule/components/custom/company/activateCompanyDialog.tsx";
import DeactivateCompanyDialog from "@coreModule/components/custom/company/deactivateCompanyDialog.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";

export type CompanySheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: Company;
    hideActions?: boolean;
    hideEdit?: boolean;
    onActivateSuccess?: () => void;
    onDeactivateSuccess?: () => void;
};

function companyEditPath(c: Company) {
    const params = new URLSearchParams();
    params.set("companyId", c._id);
    if (c.name) params.set("companyName", c.name);
    return `/tenancy/systemSettings/companies/edit?${params.toString()}`;
}

function CompanySheetView({
    open,
    onOpenChange,
    company,
    resolveLanguageKey,
    hideActions = false,
    hideEdit = false,
    onActivateSuccess,
    onDeactivateSuccess,
}: CompanySheetViewOwnProps & WithLanguageType) {
    const access = useAccess("companies");
    const viewConfig = useViewConfig("companies", "sheet");
    const [action, setAction] = useState("");

    useEffect(() => {
        if (!open) {
            setAction("");
        }
    }, [open]);

    if (!viewConfig) return null;

    return (
        <>
            <SheetViewRenderer
                config={viewConfig}
                data={company}
                open={open}
                onOpenChange={onOpenChange}
                resolveLanguageKey={resolveLanguageKey}
                access={access}
                hideActions={hideActions}
                editPath={companyEditPath(company)}
                hideDelete={true}
                hideRestore={true}
                hideEdit={hideEdit}
                actionMenuAllowCustomChildren
                actionMenuChildren={
                    <>
                        <ActivateCompany company={company} onAction={(a: string) => setAction(a)} />
                        <DeactivateCompany company={company} onAction={(a: string) => setAction(a)} />
                    </>
                }
            />

            {action === "activateCompany" && (
                <ActivateCompanyDialog
                    open={action === "activateCompany"}
                    onOpenChange={(o: boolean) => { if (!o) setAction(""); }}
                    company={company}
                    onSuccess={onActivateSuccess}
                />
            )}
            {action === "deactivateCompany" && (
                <DeactivateCompanyDialog
                    open={action === "deactivateCompany"}
                    onOpenChange={(o: boolean) => { if (!o) setAction(""); }}
                    company={company}
                    onSuccess={onDeactivateSuccess}
                />
            )}
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/sheetView/companySheetView.tsx"),
    withDebug(true, true)
)(CompanySheetView);
