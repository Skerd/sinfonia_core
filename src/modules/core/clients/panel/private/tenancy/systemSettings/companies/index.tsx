import {compose} from "redux";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import CompanyCard from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/cardView/companyCard.tsx";
import ActivateCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/activate.tsx";
import DeactivateCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/deactivate.tsx";
import ManageModules from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/manageModules.tsx";
import ManageModulesDialog from "./center/dialogs/manageModulesDialog.tsx";
import SetPortalVisibility from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/setPortalVisibility.tsx";
import SetPortalVisibilityDialog from "./center/dialogs/setPortalVisibilityDialog.tsx";
import ActivateCompanyDialog from "./center/dialogs/activateCompanyDialog.tsx";
import DeactivateCompanyDialog from "./center/dialogs/deactivateCompanyDialog.tsx";
import CompanySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/sheetView/companySheetView.tsx";
import EntityListPage from "@coreModule/components/entityPage/pages/entityListPage.tsx";

function AllCompanies({resolveLanguageKey}: WithLanguageType) {
    // Platform admins manage every company on the platform, not only the ones they belong to.
    const isPlatformAdmin = useSelector((state: RootState) => state.authentication.user.isPlatformAdmin);
    return (
        <EntityListPage<Company>
            apiUrl={isPlatformAdmin ? "/api/platform/companies" : "/api/companies"}
            collectionName="companies"
            accessModel="companies"
            tableConfigKey="companies"
            hideCreate
            buildEditPath={() => ""}
            resolveLanguageKey={resolveLanguageKey}
            cardViewClassName="grid grid-cols-1 gap-2 lg:gap-4 md:grid-cols-2 xl:grid-cols-3"
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
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/index.tsx"),
    withDebug(true, true, "companies")
)(AllCompanies);
