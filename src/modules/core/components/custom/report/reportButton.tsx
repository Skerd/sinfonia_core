import {useState} from "react";
import {compose} from "redux";
import {useSelector} from "react-redux";
import {Link, useLocation} from "react-router-dom";
import {toast} from "sonner";
import {IconFlag} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import useHttpRequest, {readErrorBody} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {handleError} from "@coreModule/helpers/general/errors.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@coreModule/components/ui/dialog.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {RadioGroup, RadioGroupItem} from "@coreModule/components/ui/radio-group.tsx";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {REPORT_COMMENT_MAX, REPORT_REASONS, type ReportReason} from "armonia/src/modules/core/api/reports/report.form.validator.ts";

const LANGUAGE_PATH = "src/modules/core/components/custom/report/reportButton.tsx";

type ReportTarget = {
    /** The reportable kind the record's module declared (`marketplace.listing`, D191). */
    kind: string;
    recordId: string;
};

type ReportDialogProps = ReportTarget & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

/** Sends one report to the platform's report desk (D191); the company never sees who reported it. */
function ReportDialogInner({kind, recordId, open, onOpenChange, resolveLanguageKey}: ReportDialogProps & WithLanguageType) {
    // A report is filed under the reporter's account: a signed-out visitor is asked to sign in, then comes back here.
    const signedIn = useSelector((state: RootState) => Boolean(state.authentication.token));
    const {pathname, search} = useLocation();
    const [reason, setReason] = useState<ReportReason>("misleading");
    const [comment, setComment] = useState("");
    const [send, setSend] = useState<{count: number; body: Record<string, unknown>}>({count: 0, body: {}});

    const {loading} = useHttpRequest({method: "POST", url: "/api/reports"}, send.body, send.count, true, {
        success: () => {
            toast.success(resolveLanguageKey("sent"));
            onOpenChange(false);
            setComment("");
        },
        error: async (err) => {
            if ((await readErrorBody(err)).error_code === "report_already_sent") {
                toast.info(resolveLanguageKey("already"));
                onOpenChange(false);
                return;
            }
            handleError(err, {context: "Report", showToast: true, fallbackMessage: resolveLanguageKey("failed")});
        },
    });

    const submit = () => setSend((current) => ({
        count: current.count + 1,
        body: {kind, recordId, reason, ...(comment.trim() ? {comment: comment.trim()} : {})},
    }));

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!loading) onOpenChange(next); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{resolveLanguageKey("title")}</DialogTitle>
                    <DialogDescription>{resolveLanguageKey("description")}</DialogDescription>
                </DialogHeader>
                {!signedIn ? (
                    <p className="text-sm text-muted-foreground">
                        {resolveLanguageKey("signInFirst")}{" "}
                        <Button asChild variant="link" className="h-auto p-0">
                            <Link to={`/login?next=${encodeURIComponent(`${pathname}${search}`)}`}>{resolveLanguageKey("signIn")}</Link>
                        </Button>
                    </p>
                ) : (
                <div className="flex flex-col gap-4">
                    <RadioGroup value={reason} onValueChange={(value) => setReason(value as ReportReason)} aria-label={resolveLanguageKey("reasonLabel")}>
                        {REPORT_REASONS.map((option) => (
                            <Label key={option} className="flex items-center gap-2 font-normal">
                                <RadioGroupItem value={option} />
                                {resolveLanguageKey(`reasons.${option}`)}
                            </Label>
                        ))}
                    </RadioGroup>
                    <Label className="flex-col items-stretch gap-1.5">
                        {resolveLanguageKey("commentLabel")}
                        <Textarea rows={3} maxLength={REPORT_COMMENT_MAX} value={comment} onChange={(event) => setComment(event.target.value)} className="h-auto py-2" />
                    </Label>
                </div>
                )}
                <DialogFooter>
                    <Button type="button" variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>{resolveLanguageKey("cancel")}</Button>
                    {signedIn ? <Button type="button" disabled={loading} onClick={submit}>{resolveLanguageKey("submit")}</Button> : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/** The report dialog on its own, for a menu item that opens it (a chat message's menu). */
const ReportDialogConnected = compose(withLanguage(LANGUAGE_PATH))(ReportDialogInner);

export function ReportDialog(props: ReportDialogProps) {
    return <ReportDialogConnected {...props} />;
}

type ReportButtonProps = ReportTarget & {
    /** `button` (a small outlined button, the default) or `link` (quiet text, for review lists). */
    variant?: "button" | "link";
    className?: string;
};

/** "Report" on a public page or a review: opens the report dialog for that record (D191). */
function ReportButtonInner({kind, recordId, variant = "button", className, resolveLanguageKey}: ReportButtonProps & WithLanguageType) {
    const [open, setOpen] = useState(false);
    return (
        <>
            {variant === "link" ? (
                <Button type="button" variant="link" onClick={() => setOpen(true)} className={cn("h-auto gap-1 p-0 text-xs font-normal text-muted-foreground hover:text-foreground", className)}>
                    <IconFlag size={14} aria-hidden />
                    {resolveLanguageKey("report")}
                </Button>
            ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className={className}>
                    <IconFlag size={16} aria-hidden />
                    {resolveLanguageKey("report")}
                </Button>
            )}
            {open && <ReportDialog kind={kind} recordId={recordId} open={open} onOpenChange={setOpen} />}
        </>
    );
}

const ReportButtonConnected = compose(withLanguage(LANGUAGE_PATH))(ReportButtonInner);

export default function ReportButton(props: ReportButtonProps) {
    return <ReportButtonConnected {...props} />;
}
