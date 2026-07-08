import { useImperativeHandle, useState } from "react";
import {Button, ButtonTitle} from "@coreModule/components/ui/button.tsx";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@coreModule/components/ui/alert-dialog.tsx";
import { LoaderCircle } from "lucide-react";
import withAxios, { WithAxiosType } from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, { WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useDispatch, useSelector} from "react-redux";
import { RootState } from "@coreModule/helpers/redux/store/generalStore.ts";
import { MarkNotificationsReadFormType } from "armonia/src/modules/core/api/user/private/notifications/markNotificationsRead.form.type.ts";
import { MarkNotificationsReadFormResponseType } from "armonia/src/modules/core/api/user/private/notifications/markNotificationsRead.form.response.type.ts";
import { compose } from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {
    markCachedNotificationsRead,
    setNotificationNumber
} from "@coreModule/helpers/redux/slices/notificationSlice.ts";
import {IconEyeCheck} from "@tabler/icons-react";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";

type MarkAllAsReadButtonProps = WithLanguageType & WithAxiosType<MarkNotificationsReadFormResponseType, MarkNotificationsReadFormType> & {
    inPopover?: boolean,
    onMarkedAllRead?: () => void
};

function MarkAllAsReadButton({
    resolveLanguageKey,
    innerRef,
    loading,
    onFilterChange,
    inPopover,
    onMarkedAllRead,
}: MarkAllAsReadButtonProps) {

    const dispatch = useDispatch();
    const { unreadNotifications } = useSelector((state: RootState) => state.notifications);
    const [open, setOpen] = useState(false);

    useImperativeHandle(innerRef, () => ({
        success: () => {
            dispatch(setNotificationNumber(0));
            dispatch(markCachedNotificationsRead(new Date().toISOString()));
            onMarkedAllRead?.();
            setOpen(false);
        }
    }), [dispatch, onMarkedAllRead]);

    if (isNaN(unreadNotifications) || unreadNotifications <= 0) return null;

    return (
        <>
            <TooltipDisplayer tooltip={resolveLanguageKey("markAllAsRead")}>
                <Button
                    variant={inPopover ? "ghost" : "outline"}
                    size={inPopover ? "sm" : "default"}
                    className={inPopover ? "h-8 shrink-0 px-2 text-xs font-normal" : undefined}
                    onClick={() => setOpen(true)}
                >
                    {
                        !inPopover ?
                        <>
                            <IconEyeCheck />
                            <ButtonTitle>
                                {resolveLanguageKey("markAllAsRead")}
                            </ButtonTitle>
                        </>
                        :
                        <>
                            {resolveLanguageKey("markAllAsRead")}
                        </>
                    }
                </Button>
            </TooltipDisplayer>
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{resolveLanguageKey("confirmTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{resolveLanguageKey("confirmDescription")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>{resolveLanguageKey("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onFilterChange({ all: true })} disabled={loading}>
                            {loading ? <LoaderCircle className="animate-spin" size={16} /> : null}
                            <span>{resolveLanguageKey("confirm")}</span>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/notificationCenter/markAllAsReadButton.tsx"),
    withAxios(
        {
            method: "PATCH",
            url: "/api/user/notifications/read",
            data: { all: true }
        },
        true
    ),
    withDebug(true, true)
)(MarkAllAsReadButton);
