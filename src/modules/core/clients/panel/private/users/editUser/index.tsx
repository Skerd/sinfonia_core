import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Drawer, DrawerContent} from "@coreModule/components/ui/drawer.tsx";
import {editUser} from "@coreModule/helpers/redux/slices/uiSlice.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import AccountSettings from "@coreModule/clients/panel/private/accountSettings";

type EditUserProps = WithLanguageType & {}

function EditUser({}: EditUserProps) {

    const dispatch = useDispatch();
    const editUserData = useSelector((state: RootState) => state.ui.editUser);

    if( !editUserData ) return <></>;

    return (
        <Drawer direction="right" open={!!editUserData} onOpenChange={ () => { dispatch(editUser(null)); }}>
            <DrawerContent className="h-screen max-w-5xl min-w-[50vw] w-full rounded-l-xl px-4 py-6 shadow-xl">
                <AccountSettings
                    specificUserId={editUserData._id}
                    fullName={`${editUserData.name} ${editUserData.surname}`}
                />
            </DrawerContent>
        </Drawer>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/editUser/index.tsx")
)(EditUser);