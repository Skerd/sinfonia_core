import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {useState} from "react";
import {DropdownMenuItem, DropdownMenuSeparator} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Plus} from "lucide-react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@coreModule/components/ui/dialog.tsx";
import CreateCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/createCompany.tsx";

type CreateCompanyDropMenuItemProps = WithLanguageType & {}

function CreateCompanyDropMenuItem({resolveLanguageKey}: CreateCompanyDropMenuItemProps) {

    const [dialogOpen, setDialogOpen] = useState(false);
    const {create} = useAccess("companies");

    if (!create) {
        return <HiddenElement />;
    }

    return (
        <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                className="gap-2 p-2"
                onSelect={(e) => {
                    e.preventDefault();
                    setDialogOpen(true);
                }}
            >
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                    <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">{resolveLanguageKey("addCompany")}</div>
            </DropdownMenuItem>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent
                    className="flex max-h-[min(90vh,920px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
                >
                    <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 text-left">
                        <DialogTitle>{resolveLanguageKey("dialogTitle")}</DialogTitle>
                        <DialogDescription>{resolveLanguageKey("dialogDescription")}</DialogDescription>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        {dialogOpen ? (
                            <CreateCompany
                                embedForm
                                onFinished={() => setDialogOpen(false)}
                            />
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/createCompanyDropMenuItem.tsx"),
    withDebug(true, true)
)(CreateCompanyDropMenuItem);
