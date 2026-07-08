import {compose} from "redux";
import {useImperativeHandle} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@coreModule/components/ui/alert-dialog.tsx";
import {LoaderCircle, ShieldCheck} from "lucide-react";
import {ActionMessage} from "armonia/src/modules/core/types/shared.types.ts";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";

type ActivateCompanyDialogProps = WithLanguageType &
    WithAxiosType<ActionMessage> & {
        open: boolean;
        onOpenChange: (open: boolean) => void;
        company: Partial<Company> & {_id: string};
        onSuccess?: () => void;
    };

function ActivateCompanyDialog({
    open,
    onOpenChange,
    company,
    resolveLanguageKey,
    onFilterChange,
    innerRef,
    loading,
    onSuccess = () => {},
}: ActivateCompanyDialogProps) {

    const {write} = useAccess("companies");

    useImperativeHandle(innerRef, () => ({
        success: () => {
            onSuccess();
            onOpenChange(false);
        },
    }));

    if (!write?.isActive) return <></>;
    if (!company.parentCompany) return <></>;
    if (company.isActive) return <></>;

    const handleActivate = () => onFilterChange({});

    return (
        <AlertDialog open={open} onOpenChange={(o: boolean) => { if (!loading) onOpenChange(o); }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{resolveLanguageKey("title")}</AlertDialogTitle>
                    <AlertDialogDescription>{resolveLanguageKey("description")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>{resolveLanguageKey("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleActivate(); }} disabled={loading}>
                        {loading ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}
                        {resolveLanguageKey("confirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/company/activateCompanyDialog.tsx"),
    withAxios(
        {
            url: "/api/company/activate",
            method: "POST",
            data: {},
            addToHeader: [{whatToGet: "company._id", whereToPut: "x-company-id"}],
        },
        true
    ),
    withDebug(true, true)
)(ActivateCompanyDialog);
