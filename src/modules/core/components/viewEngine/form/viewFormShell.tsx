import type {ReactNode} from "react";
import type {FieldValues, Path, UseFormReturn} from "react-hook-form";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {buildPageTitle} from "@coreModule/helpers/general/pageTitle.ts";
import {Form} from "@coreModule/components/ui/form.tsx";
import {FieldGroup} from "@coreModule/components/ui/field.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import Header from "@coreModule/components/custom/header.tsx";
import {readPageHelp} from "@coreModule/components/custom/pageHelp.tsx";
import {LoaderCircle, Save} from "lucide-react";

type ViewFormShellProps<T extends FieldValues> = {
    form: UseFormReturn<T>;
    resolveLanguageKey: ResolveLanguageKey;
    onSubmit: (data: T) => void;
    onCancel: () => void;
    /** Disables the buttons and shows the spinner on submit. */
    busy: boolean;
    /** Spinner on the submit button (the request is in flight, not just data loading). */
    submitting: boolean;
    submitDisabled?: boolean;
    submitIcon?: ReactNode;
    extraTitles?: (string | undefined)[];
    hideChrome?: boolean;
    hideActions?: boolean;
    /** Shown instead of the form (loader, load error). */
    replaceForm?: ReactNode;
    children: ReactNode;
};

/**
 * Page chrome shared by the create and edit view forms: header, `<form>`, focus on the first
 * invalid field, and the cancel / submit row.
 */
export function ViewFormShell<T extends FieldValues>({
    form,
    resolveLanguageKey: t,
    onSubmit,
    onCancel,
    busy,
    submitting,
    submitDisabled = false,
    submitIcon,
    extraTitles = [],
    hideChrome = false,
    hideActions = false,
    replaceForm,
    children,
}: ViewFormShellProps<T>) {
    return (
        // Avoid nested `.flex-full` (each sets overflow-y: auto) — panel content is the sole scroll root.
        <div className="flex flex-col gap-4">
            {!hideChrome && (
                <Header
                    title={buildPageTitle(t("formHeader.title"), extraTitles.filter(Boolean))}
                    description={t("formHeader.description")}
                    help={readPageHelp(t)}
                />
            )}
            <div className={`flex flex-col gap-4 ${hideChrome ? "px-0 pb-2" : "px-2 pb-[100px]"}`}>
                {replaceForm ?? (
                    <Form {...form}>
                        <form
                            noValidate
                            onSubmit={form.handleSubmit(onSubmit, (errors) => {
                                const first = Object.keys(errors)[0];
                                if (first) form.setFocus(first as Path<T>);
                            })}
                        >
                            <FieldGroup>
                                {children}
                                {!hideActions && (
                                    <div className="flex items-center justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
                                            {t("formButtons.cancel")}
                                        </Button>
                                        <Button type="submit" disabled={busy || submitDisabled}>
                                            {submitting ? <LoaderCircle className="animate-spin h-4 w-4" /> : (submitIcon ?? <Save />)}
                                            {t("formButtons.submit")}
                                        </Button>
                                    </div>
                                )}
                            </FieldGroup>
                        </form>
                    </Form>
                )}
            </div>
        </div>
    );
}
