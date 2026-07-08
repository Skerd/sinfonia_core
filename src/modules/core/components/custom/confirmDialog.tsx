import {JSX, ReactNode} from "react";
import {LoaderCircle} from "lucide-react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Button} from '@coreModule/components/ui/button.tsx';
import {AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@coreModule/components/ui/alert-dialog.tsx';
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";

type ConfirmDialogProps = WithLanguageType & {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: ReactNode
    disabled?: boolean
    desc: JSX.Element | string
    cancelBtnText?: string
    confirmText?: ReactNode
    destructive?: boolean
    handleConfirm: () => void
    isLoading?: boolean
    className?: string
    children?: ReactNode
}

export function ConfirmDialog(props: ConfirmDialogProps) {
    const {
        title,
        desc,
        children,
        className,
        confirmText,
        cancelBtnText,
        destructive,
        isLoading,
        disabled = false,
        handleConfirm,
        resolveLanguageKey,
        ...actions
    } = props

    return (
        <AlertDialog {...actions}>
            <AlertDialogContent className={cn(className && className)}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div>{desc}</div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {children}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>
                        {cancelBtnText ?? resolveLanguageKey("cancel")}
                    </AlertDialogCancel>
                    <Button
                        variant={destructive ? 'destructive' : 'default'}
                        onClick={handleConfirm}
                        disabled={disabled || isLoading}
                    >
                        {
                            (isLoading) &&
                            <LoaderCircle
                                size={20}
                                className="hover:text-betTertiary hover:cursor-not-allowed animate-spin"
                            />
                        }
                        {confirmText ?? resolveLanguageKey("confirm")}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default compose(
    withLanguage("src/modules/core/components/custom/confirmDialog.tsx")
)(ConfirmDialog)