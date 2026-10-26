import {compose} from "redux";
import {useImperativeHandle} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import type {SetPortalVisibilityResponse} from "armonia/src/modules/core/api/platform/private/companies/platformModules.dto.ts";

type SetPortalVisibilityDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: Partial<Company> & {_id: string};
    onSuccess?: (hiddenFromPortal: boolean) => void;
};

function SetPortalVisibilityDialogInner({
    open,
    onOpenChange,
    company,
    onSuccess,
    resolveLanguageKey,
    innerRef,
    onFilterChange,
    loading,
}: SetPortalVisibilityDialogProps & WithLanguageType & WithAxiosType<SetPortalVisibilityResponse>) {
    const hide = !company.hiddenFromPortal;
    const prefix = hide ? "hide" : "show";

    useImperativeHandle(innerRef, () => ({
        success: (data: SetPortalVisibilityResponse) => {
            onSuccess?.(data.hiddenFromPortal);
            onOpenChange(false);
        },
    }));

    return (
        <ConfirmDialog
            open={open}
            onOpenChange={(o: boolean) => { if (!loading) onOpenChange(o); }}
            title={resolveLanguageKey(`${prefix}.title`)}
            desc={`${company.name} — ${resolveLanguageKey(`${prefix}.description`)}`}
            handleConfirm={() => onFilterChange({hiddenFromPortal: hide})}
            isLoading={loading}
            destructive={hide}
        />
    );
}

const SetPortalVisibilityDialogConnected = compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/dialogs/setPortalVisibilityDialog.tsx"),
    withAxios<SetPortalVisibilityResponse>(
        {
            method: "PUT",
            url: "/api/platform/companies/portalVisibility",
            data: {},
            addToPath: [{whatToGet: ["company", "_id"]}],
        },
        true,
    ),
    withDebug(true, true, "companies"),
)(SetPortalVisibilityDialogInner);

export default function SetPortalVisibilityDialog(props: SetPortalVisibilityDialogProps) {
    return <SetPortalVisibilityDialogConnected {...props} />;
}
