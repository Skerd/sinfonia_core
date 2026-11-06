import {useEffect} from "react";
import {X} from "lucide-react";
import {compose} from "redux";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Drawer, DrawerClose, DrawerContent} from "@coreModule/components/ui/drawer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/companyUser.dto.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import AccountSettings from "@coreModule/clients/panel/private/accountSettings";
import {getName} from "@coreModule/helpers/general/names.ts";
import {ENTITY_SHEET_WIDTH_CLASS, FLOATING_SHEET_CONTENT_CLASS} from "@coreModule/components/viewEngine/sheet/widgets/sheetFloatingChrome.ts";
import {clearStaleBodyPointerEventsLock, SheetMenuNavigateDismissProvider} from "@coreModule/components/viewEngine/sheet/widgets/sheetMenuNavigateDismiss.tsx";

type EditUserProps = WithLanguageType & {
    /** The user being edited; `null` keeps the drawer closed. */
    user: CompanyUserType | null;
    onClose: () => void;
}

function EditUser({user, onClose}: EditUserProps) {

    useEffect(() => () => {
        window.setTimeout(clearStaleBodyPointerEventsLock, 0);
    }, []);

    if( !user ) return <></>;

    return (
        <Drawer direction="right" open={true} onOpenChange={onClose}>
            <DrawerContent
                className={cn(
                    FLOATING_SHEET_CONTENT_CLASS,
                    ENTITY_SHEET_WIDTH_CLASS,
                    // Vaul's right drawer sets `w-3/4`, `rounded-l-xl`, and `sm:max-w-sm`.
                    "!w-auto !rounded-lg sm:!max-w-[98vw] lg:!max-w-[58vw]",
                )}
            >
                <SheetMenuNavigateDismissProvider onDismiss={onClose}>
                    <AccountSettings
                        specificUserId={user._id}
                        fullName={getName(user)}
                        headerEnd={(
                            <DrawerClose asChild>
                                <Button variant="ghost" size="icon" className="shrink-0">
                                    <X />
                                    <span className="sr-only">Close</span>
                                </Button>
                            </DrawerClose>
                        )}
                    />
                </SheetMenuNavigateDismissProvider>
            </DrawerContent>
        </Drawer>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/editUser/index.tsx")
)(EditUser);