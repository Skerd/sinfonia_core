import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import CompanyCard from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/cardView/companyCard.tsx";
import ActivateCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/activate.tsx";
import DeactivateCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/deactivate.tsx";
import ActivateCompanyDialog from "@coreModule/components/custom/company/activateCompanyDialog.tsx";
import DeactivateCompanyDialog from "@coreModule/components/custom/company/deactivateCompanyDialog.tsx";
import CompanySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/sheetView/companySheetView.tsx";
import EntityListPage from "@coreModule/components/entityPage/EntityListPage.tsx";

function AllCompanies({resolveLanguageKey}: WithLanguageType) {
    return (
        <EntityListPage<Company>
            apiUrl="/api/companies"
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
    withDebug(true, true)
)(AllCompanies);
