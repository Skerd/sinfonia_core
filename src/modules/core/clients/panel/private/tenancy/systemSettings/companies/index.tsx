import {compose} from "redux";
import {useCallback, useMemo} from "react";
import {useSelector} from "react-redux";
import {useSearchParams} from "react-router-dom";
import {IconHierarchy2, IconList} from "@tabler/icons-react";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {Company, CompanySignupSource} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import CompanyCard from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/cardView/companyCard.tsx";
import ActivateCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/activate.tsx";
import DeactivateCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/deactivate.tsx";
import ManageModules from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/manageModules.tsx";
import ManageModulesDialog from "./center/dialogs/manageModulesDialog.tsx";
import SetPortalVisibility from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/setPortalVisibility.tsx";
import SetPortalVisibilityDialog from "./center/dialogs/setPortalVisibilityDialog.tsx";
import PortalApprovalActions from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/portalApproval.tsx";
import PortalApprovalDialog, {isPortalApprovalAction} from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/dialogs/portalApprovalDialog.tsx";
import ActivateCompanyDialog from "./center/dialogs/activateCompanyDialog.tsx";
import DeactivateCompanyDialog from "./center/dialogs/deactivateCompanyDialog.tsx";
import CompanySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/sheetView/companySheetView.tsx";
import EntityListPage, {EntityListHeader, type EntityListHeaderContext} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import {ToggleGroup, ToggleGroupItem} from "@coreModule/components/ui/toggle-group.tsx";
import Forbidden from "@coreModule/components/custom/pages/forbidden.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import CompanyHierarchy from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/hierarchy/companyHierarchy.tsx";
import type {QuickFilterDef} from "@coreModule/components/entityPage/filters/quickFilterBar.tsx";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators.ts";
import {PORTAL_APPROVAL_STATUSES} from "armonia/src/modules/core/api/company/private/company/portalApproval.ts";

type CompaniesView = "list" | "hierarchy";

/** Switches the page between the companies' list and their hierarchy. */
function CompaniesViewSwitch({view, onChange, resolveLanguageKey}: {view: CompaniesView; onChange: (next: string) => void} & Pick<WithLanguageType, "resolveLanguageKey">) {
    return (
        <ToggleGroup type="single" spacing={0} variant="outline" size="sm" value={view} onValueChange={onChange} aria-label={resolveLanguageKey("views.label")}>
            <ToggleGroupItem value="list" className="gap-1.5 px-2.5">
                <IconList aria-hidden />
                {resolveLanguageKey("views.list")}
            </ToggleGroupItem>
            <ToggleGroupItem value="hierarchy" className="gap-1.5 px-2.5">
                <IconHierarchy2 aria-hidden />
                {resolveLanguageKey("views.hierarchy")}
            </ToggleGroupItem>
        </ToggleGroup>
    );
}

function AllCompanies({resolveLanguageKey}: WithLanguageType) {
    // Platform admins manage every company on the platform, not only the ones they belong to.
    const isPlatformAdmin = useSelector((state: RootState) => state.authentication.user.isPlatformAdmin);
    // Self-serve companies waiting for the platform's approval to be listed on the portal (D178), and the companies that
    // signed themselves up (P23.9); the rest were created by the platform.
    const quickFilters = useMemo<QuickFilterDef[]>(() => isPlatformAdmin ? [{
        field: "portalApproval.status",
        label: resolveLanguageKey("approvalFilter"),
        type: COLUMN_TYPE.ENUM,
        enumValues: PORTAL_APPROVAL_STATUSES.map((value) => ({value, label: resolveLanguageKey(`approvalStatuses.${value}`)})),
    }, {
        field: "signupSource.via",
        label: resolveLanguageKey("signupFilter"),
        type: COLUMN_TYPE.ENUM,
        enumValues: [{value: "selfServe" satisfies CompanySignupSource["via"], label: resolveLanguageKey("signupVia.selfServe")}],
    }] : [], [isPlatformAdmin, resolveLanguageKey]);
    const {read} = useAccess("companies");
    // The hierarchy covers every company on the platform, so only platform admins get it (the server checks the same).
    const [searchParams, setSearchParams] = useSearchParams();
    const view: CompaniesView = isPlatformAdmin && searchParams.get("view") === "hierarchy" ? "hierarchy" : "list";
    const setView = useCallback((next: string) => {
        // Radix clears the value when the active item is pressed again; the page always shows one view.
        if (next !== "list" && next !== "hierarchy") return;
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            if (next === "hierarchy") params.set("view", next);
            else params.delete("view");
            return params;
        }, {replace: true});
    }, [setSearchParams]);
    const header = (ctx: EntityListHeaderContext) => (
        <EntityListHeader ctx={ctx}>
            {isPlatformAdmin ? <CompaniesViewSwitch view={view} onChange={setView} resolveLanguageKey={resolveLanguageKey} /> : null}
        </EntityListHeader>
    );

    if (view === "hierarchy") {
        if (read === false) return <Forbidden />;
        return (
            <div className="min-w-0 flex-full gap-4">
                {header({resolveLanguageKey, canCreate: false, canRequest: false})}
                <CompanyHierarchy />
            </div>
        );
    }

    return (
        <EntityListPage<Company>
            apiUrl={isPlatformAdmin ? "/api/platform/companies" : "/api/companies"}
            collectionName="companies"
            accessModel="companies"
            tableConfigKey="companies"
            buildEditPath={() => ""}
            resolveLanguageKey={resolveLanguageKey}
            header={header}
            cardViewClassName="grid grid-cols-1 gap-2 lg:gap-4 md:grid-cols-2"
            quickFilters={quickFilters}
            rowActionMenu={{
                hideDelete:                 true,
                hideRestore:                true,
                hideEdit:                   true,
                allowMenuForCustomChildren: true,
            }}
            renderCard={(company, _onDelete, _onRestore, listRef) => (
                <CompanyCard company={company} listRef={listRef} hideEdit />
            )}
            renderActionMenuChildren={(company, bindRowAction) => (
                <>
                    <ActivateCompany company={company} onAction={(a: string) => bindRowAction(a)} />
                    <DeactivateCompany company={company} onAction={(a: string) => bindRowAction(a)} />
                    <ManageModules company={company} onAction={(a: string) => bindRowAction(a)} />
                    <SetPortalVisibility company={company} onAction={(a: string) => bindRowAction(a)} />
                    <PortalApprovalActions company={company} onAction={(a: string) => bindRowAction(a)} />
                </>
            )}
            renderFloatingModals={({action, entity, resetAction, listRef}) => {
                if (action === "activateCompany") {
                    return (
                        <ActivateCompanyDialog
                            open={true}
                            onOpenChange={(o: boolean) => {
                                if (!o) resetAction();
                            }}
                            company={entity}
                            onSuccess={() => listRef.current?.updateRow?.(entity._id, {isActive: true})}
                        />
                    );
                }
                if (action === "deactivateCompany") {
                    return (
                        <DeactivateCompanyDialog
                            open={true}
                            onOpenChange={(o: boolean) => {
                                if (!o) resetAction();
                            }}
                            company={entity}
                            onSuccess={() => listRef.current?.updateRow?.(entity._id, {isActive: false})}
                        />
                    );
                }
                if (action === "manageModules") {
                    return (
                        <ManageModulesDialog
                            open={true}
                            onOpenChange={(o: boolean) => {
                                if (!o) resetAction();
                            }}
                            company={entity}
                            onSuccess={(modules) => listRef.current?.updateRow?.(entity._id, {modules})}
                        />
                    );
                }
                if (action === "setPortalVisibility") {
                    return (
                        <SetPortalVisibilityDialog
                            open={true}
                            onOpenChange={(o: boolean) => {
                                if (!o) resetAction();
                            }}
                            company={entity}
                            onSuccess={(hiddenFromPortal) => listRef.current?.updateRow?.(entity._id, {hiddenFromPortal})}
                        />
                    );
                }
                if (isPortalApprovalAction(action)) {
                    return (
                        <PortalApprovalDialog
                            action={action}
                            onOpenChange={(o: boolean) => {
                                if (!o) resetAction();
                            }}
                            company={entity}
                            onSuccess={(patch) => listRef.current?.updateRow?.(entity._id, patch)}
                        />
                    );
                }
                return null;
            }}
            renderSheet={({entity, open, onOpenChange, listRef}) => (
                <CompanySheetView
                    open={open}
                    onOpenChange={(opened: boolean) => {
                        if (!opened) onOpenChange();
                    }}
                    company={entity}
                    hideEdit
                    onActivateSuccess={() => listRef.current?.updateRow?.(entity._id, {isActive: true})}
                    onDeactivateSuccess={() => listRef.current?.updateRow?.(entity._id, {isActive: false})}
                    onCompanyPatched={(patch: Partial<Company>) => listRef.current?.updateRow?.(entity._id, patch)}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/index.tsx"),
    withDebug(true, true, "companies")
)(AllCompanies);
