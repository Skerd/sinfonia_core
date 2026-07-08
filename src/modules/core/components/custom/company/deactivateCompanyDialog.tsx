import {compose} from "redux";
import {useImperativeHandle, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DeactivateCompanyFormType} from "armonia/src/modules/core/api/company/private/company/deactivateCompany.form.type.ts";
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
import {Input} from "@coreModule/components/ui/input.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {LoaderCircle, ShieldMinus} from "lucide-react";
import {ActionMessage} from "armonia/src/modules/core/types/shared.types.ts";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";

type DeactivateCompanyDialogProps = WithLanguageType &
    WithAxiosType<ActionMessage, DeactivateCompanyFormType> & {
        open: boolean;
        onOpenChange: (open: boolean) => void;
        company: Partial<Company> & {_id: string; name: string};
        onSuccess?: () => void;
    };

function DeactivateCompanyDialog({
    open,
    onOpenChange,
    company,
    resolveLanguageKey,
    onFilterChange,
    innerRef,
    loading,
    onSuccess = () => {},
}: DeactivateCompanyDialogProps) {
    const {write, read} = useAccess("companies");
    const [confirmName, setConfirmName] = useState("");

    useImperativeHandle(innerRef, () => ({
        success: () => {
            onSuccess();
            onOpenChange(false);
            setConfirmName("");
        },
    }));

    if (!write?.isActive) return <></>;
    if (!company.parentCompany) return <></>;
    if (!company.isActive) return <></>;

    const handleDeactivate = () => onFilterChange({name: company.name});
    const canConfirm = !read?.name || confirmName === company.name;

    return (
        <AlertDialog
            open={open}
            onOpenChange={(o: boolean) => {
                if (loading) return;
                onOpenChange(o);
                if (!o) setConfirmName("");
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {resolveLanguageKey("title")} {read?.name ? `'${company.name}'` : ""}
                    </AlertDialogTitle>
                    <AlertDialogDescription>{resolveLanguageKey("description")}</AlertDialogDescription>
                    {read?.name && (
                        <div className="py-2">
                            <Label>{resolveLanguageKey("confirmNameLabel")}</Label>
                            <Input
                                value={confirmName}
                                onChange={(e) => setConfirmName(e.target.value)}
                                placeholder={company.name}
                                className="mt-2"
                            />
                        </div>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>{resolveLanguageKey("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeactivate();
                        }}
                        disabled={loading || !canConfirm}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {loading ? <LoaderCircle className="animate-spin" /> : <ShieldMinus />}
                        {resolveLanguageKey("confirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/company/deactivateCompanyDialog.tsx"),
    withAxios(
        {
            url: "/api/company/deactivate",
            method: "POST",
            data: {},
            addToHeader: [{whatToGet: "company._id", whereToPut: "x-company-id"}],
        },
        true
    ),
    withDebug(true, true)
)(DeactivateCompanyDialog);
