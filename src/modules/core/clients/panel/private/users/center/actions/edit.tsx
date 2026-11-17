import {IconUserEdit} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/companyUser.dto.ts";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type EditUserActionProps = WithLanguageType & {
    specificUserId?: string,
    user: CompanyUserType;
    /** Opens the edit drawer the users page owns. */
    onEdit: (user: CompanyUserType) => void;
}

function EditUserAction({user, resolveLanguageKey, specificUserId, onEdit}: EditUserActionProps) {
    const {write} = useAccess("users", !specificUserId ? "self" : "others");

    const handleEdit = () => onEdit(user);

    const shortcut = "1";
    useKeyboardShortcuts(shortcut, () => {handleEdit();}, {enabled: write});

    if (!write) return <HiddenElement />;

    return (
        // Selecting closes the menu before the edit sheet opens; preventing the click's default kept it open on top.
        <DropdownMenuItem onClick={(e) => e.stopPropagation()} onSelect={handleEdit}>
            <IconUserEdit size={16} />
            <p>{resolveLanguageKey("editProfile")}</p>
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/center/actions/edit.tsx"),
    withDebug(true, true, "users")
)(EditUserAction);
