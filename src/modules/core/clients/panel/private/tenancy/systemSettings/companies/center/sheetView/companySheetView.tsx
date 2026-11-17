import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import {useEffect, useState} from "react";
import ActivateCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/activate.tsx";
import DeactivateCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/deactivate.tsx";
import ActivateCompanyDialog from "../dialogs/activateCompanyDialog.tsx";
import DeactivateCompanyDialog from "../dialogs/deactivateCompanyDialog.tsx";
import ManageModules from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/manageModules.tsx";
import SetPortalVisibility from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/setPortalVisibility.tsx";
import ManageModulesDialog from "../dialogs/manageModulesDialog.tsx";
import SetPortalVisibilityDialog from "../dialogs/setPortalVisibilityDialog.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";

export type CompanySheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The full row, or the stub a linked reference seeds while `/single` loads. */
    company?: Company;
    /** Opened from a reference (e.g. who requested a platform list entry): the sheet loads the company itself. */
    fetchId?: string;
    hideActions?: boolean;
    hideEdit?: boolean;
    onActivateSuccess?: () => void;
    onDeactivateSuccess?: () => void;
    /** A sheet action changed the company (its modules, its portal visibility): the list updates its row. */
    onCompanyPatched?: (patch: Partial<Company>) => void;
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
    company: companyProp,
    fetchId,
    resolveLanguageKey,
    hideActions = false,
    hideEdit = false,
    onActivateSuccess,
    onDeactivateSuccess,
    onCompanyPatched,
}: CompanySheetViewOwnProps & WithLanguageType) {
    const access = useAccess("companies");
    const viewConfig = useViewConfig("companies", "sheet");
    const [action, setAction] = useState("");
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(companyProp ?? {_id: fetchId});

    useEffect(() => {
        if (companyProp) setSheetData(companyProp);
    }, [companyProp]);

    useEffect(() => {
        if (!open) {
            setAction("");
        }
    }, [open]);

    if (!viewConfig) return null;
    const company = sheetData as Company;
    const patchCompany = (patch: Partial<Company>) => {
        setSheetData((prev) => ({...prev, ...patch}));
        onCompanyPatched?.(patch);
    };

    return (
        <>
            <SheetViewRenderer
                config={viewConfig}
                data={sheetData}
                url={fetchId ? "/api/companies/single" : undefined}
                fetchId={fetchId}
                onDataFetched={(data) => setSheetData(data)}
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
                        {/* The same platform actions as the list's row and card menus (TD-F112). */}
                        <ManageModules company={company} onAction={(a: string) => setAction(a)} />
                        <SetPortalVisibility company={company} onAction={(a: string) => setAction(a)} />
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
            {action === "manageModules" && (
                <ManageModulesDialog
                    open
                    onOpenChange={(o: boolean) => { if (!o) setAction(""); }}
                    company={company}
                    onSuccess={(modules) => patchCompany({modules})}
                />
            )}
            {action === "setPortalVisibility" && (
                <SetPortalVisibilityDialog
                    open
                    onOpenChange={(o: boolean) => { if (!o) setAction(""); }}
                    company={company}
                    onSuccess={(hiddenFromPortal) => patchCompany({hiddenFromPortal})}
                />
            )}
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/sheetView/companySheetView.tsx"),
    withDebug(true, true, "companies")
)(CompanySheetView);
