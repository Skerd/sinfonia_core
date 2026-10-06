import {useEffect} from "react";
import {X} from "lucide-react";
import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Drawer, DrawerClose, DrawerContent} from "@coreModule/components/ui/drawer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {editUser} from "@coreModule/helpers/redux/slices/uiSlice.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import AccountSettings from "@coreModule/clients/panel/private/accountSettings";
import {getName} from "@coreModule/helpers/general/names.ts";
import {ENTITY_SHEET_WIDTH_CLASS, FLOATING_SHEET_CONTENT_CLASS} from "@coreModule/components/viewEngine/sheet/widgets/sheetFloatingChrome.ts";
import {clearStaleBodyPointerEventsLock, SheetMenuNavigateDismissProvider} from "@coreModule/components/viewEngine/sheet/widgets/sheetMenuNavigateDismiss.tsx";

type EditUserProps = WithLanguageType & {}

function EditUser({}: EditUserProps) {

    const dispatch = useDispatch();
    const editUserData = useSelector((state: RootState) => state.ui.editUser);

    useEffect(() => () => {
        window.setTimeout(clearStaleBodyPointerEventsLock, 0);
    }, []);

    if( !editUserData ) return <></>;

    return (
        <Drawer direction="right" open={!!editUserData} onOpenChange={ () => { dispatch(editUser(null)); }}>
            <DrawerContent
                className={cn(
                    FLOATING_SHEET_CONTENT_CLASS,
                    ENTITY_SHEET_WIDTH_CLASS,
                    // Vaul's right drawer sets `w-3/4`, `rounded-l-xl`, and `sm:max-w-sm`.
                    "!w-auto !rounded-lg sm:!max-w-[98vw] lg:!max-w-[58vw]",
                )}
            >
                <SheetMenuNavigateDismissProvider onDismiss={() => dispatch(editUser(null))}>
                    <AccountSettings
                        specificUserId={editUserData._id}
                        fullName={getName(editUserData)}
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