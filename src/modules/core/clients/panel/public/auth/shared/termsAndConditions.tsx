import {useState} from "react";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@coreModule/components/ui/dialog.tsx";

type TermsAndConditionsProps = WithLanguageType & {};

function TermsAndConditions({resolveLanguageKey}: TermsAndConditionsProps) {
    const [open, setOpen] = useState<null | "terms" | "privacy">(null);

    const linkClass = cn(
        "inline cursor-pointer border-0 bg-transparent p-0 font-inherit text-inherit",
        "underline underline-offset-4 hover:text-primary"
    );

    return (
        <>
            <p className="text-muted-foreground px-8 text-center text-sm">
                {resolveLanguageKey("byClickingYouAgree")}{" "}
                <button
                    type="button"
                    className={linkClass}
                    onClick={() => setOpen("terms")}
                >
                    {resolveLanguageKey("termsOfService")}
                </button>{" "}
                {resolveLanguageKey("and")}{" "}
                <button
                    type="button"
                    className={linkClass}
                    onClick={() => setOpen("privacy")}
                >
                    {resolveLanguageKey("privacyPolicy")}
                </button>
            </p>

            <Dialog
                open={open != null}
                onOpenChange={(next) => {
                    if (!next) {
                        setOpen(null);
                    }
                }}
            >
                <DialogContent
                    className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden sm:max-w-lg"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader className="shrink-0 pr-8">
                        <DialogTitle>
                            {open === "terms"
                                ? resolveLanguageKey("termsOfService")
                                : open === "privacy"
                                  ? resolveLanguageKey("privacyPolicy")
                                  : ""}
                        </DialogTitle>
                    </DialogHeader>
                    {open != null && (
                        <div
                            className="text-muted-foreground mt-2 max-h-[min(65vh,560px)] overflow-y-auto pr-1 text-sm leading-relaxed whitespace-pre-line"
                            tabIndex={0}
                        >
                            {open === "terms"
                                ? resolveLanguageKey("termsContent")
                                : resolveLanguageKey("privacyContent")}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/public/auth/shared/termsAndConditions.tsx"),
    withDebug(true, true)
)(TermsAndConditions);
