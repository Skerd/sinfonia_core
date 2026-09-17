import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {UserPen} from "lucide-react";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@baseModule/helpers/hooks/useAccess.ts";
import {useDispatch} from "react-redux";
import {editUser} from "@baseModule/helpers/redux/slices/uiSlice.ts";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/companyUser.dto.ts";
import {useKeyboardShortcuts} from "@baseModule/helpers/hooks/useKeyboardShortcut.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type EditUserActionProps = WithLanguageType & {
    specificUserId?: string,
    user: CompanyUserType;
}

function EditUserAction({user, resolveLanguageKey, specificUserId}: EditUserActionProps) {
    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    const dispatch = useDispatch();

    if (!write) return <HiddenElement />;

    const handleEdit = () => {
        dispatch(editUser({
            _id: user._id,
            name: user.name,
            surname: user.surname
        }));
    };

    const shortcut = "1";
    useKeyboardShortcuts(shortcut, () => {handleEdit();});

    return (
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(); }}>
            <UserPen size={16} />
            <p>{resolveLanguageKey("editProfile")}</p>
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/center/actions/edit.tsx"),
    withDebug(true, true, "users")
)(EditUserAction);
