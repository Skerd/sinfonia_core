import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useEffect, useImperativeHandle, useState} from "react";
import {LoaderCircle, Trash2} from "lucide-react";
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from "@coreModule/components/ui/alert-dialog.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";

type DeleteActionProps = WithLanguageType & WithAxiosType & {
    accessModel: string
    deleteId: string,
    openAlert?: boolean,
    name?: string
    confirmName?: string,
    url: string,
    onSuccess?: (data: DeletedData) => void,
    onCancel?: () => void,
}

function DeleteAction({
    accessModel,
    deleteId,
    openAlert,
    name,
    confirmName: confirmNameProp,
    resolveLanguageKey,
    innerRef,
    onFilterChange,
    onSuccess = () => {},
    onCancel = () => {},
    loading
}: DeleteActionProps) {

    const {delete: deleteModel} = useAccess(accessModel);
    const [open, setOpen] = useState<boolean>(!!openAlert);
    const [confirmValue, setConfirmValue] = useState<string>("");
    const confirmName = confirmNameProp ?? resolveLanguageKey("typeDelete");

    useImperativeHandle(innerRef, () => ({
        success: (data: DeletedData) => {
            if( !deleteModel ) return;
            setOpen(false);
            onSuccess?.(data);
        }
    }));
    useEffect(() => {
        if( !deleteModel ) return;
        setOpen(!!openAlert);
    }, [openAlert]);
    useEffect(() => {
        if( !open ){
            onCancel?.();
        }
        setConfirmValue("");
    }, [open]);

    if( !deleteModel ) {
        return <HiddenElement />
    }

    return (
        <>
            <AlertDialog open={open} onOpenChange={(open) => {setOpen(open);if (!open) setConfirmValue("");}}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{resolveLanguageKey("title")} {name ? `'${name}'` : resolveLanguageKey("item")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {resolveLanguageKey("description")} {name ? `'${name}'` : resolveLanguageKey("item")}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {
                        confirmName &&
                        <div className="mb-2" style={{border: "0px solid red"}}>
                            {/*<Separator className="mb-2" />*/}
                            <div className="space-y-2">
                                <Label htmlFor="confirm-project-name">{resolveLanguageKey("typeToConfirm").replace("{}", confirmName)}</Label>
                                <Input
                                    id={`confirm-name-${confirmName}`}
                                    value={confirmValue}
                                    disabled={loading}
                                    onChange={(e) => setConfirmValue(e.target.value)}
                                    placeholder={confirmName}
                                />
                            </div>
                        </div>
                    }
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>
                            {resolveLanguageKey("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onFilterChange({
                                    _id: deleteId
                                });
                            }}
                            variant="destructive"
                            disabled={loading || ( !!confirmName && confirmName !== confirmValue ) }
                        >
                            {(loading) ? <LoaderCircle className="animate-spin"/> : <Trash2 />}
                            <p>{resolveLanguageKey("delete")}</p>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/components/custom/actions/deleteAction.tsx"),
    withAxios(
        {
            method: "DELETE",
            url: "toBeDeterminedByProp",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(DeleteAction)
